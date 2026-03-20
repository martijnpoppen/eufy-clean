import { Base } from "./Base";
import { EUFY_CLEAN_WORK_MODE, EUFY_CLEAN_NOVEL_CLEAN_SPEED, EUFY_CLEAN_CONTROL } from "../constants/state.constants";
import { EUFY_CLEAN_X_SERIES, EUFY_CLEAN_E_SERIES } from "../constants/devices.constants";
import { decode, getMultiData, getProtoFile, encode } from '../lib/utils';

const LOCAL_NOVEL_FALLBACK_DPS = ['151', '156', '158', '159', '160', '161', '163', '177'];

export class SharedConnect extends Base {
    public novelApi: boolean = false;
    public robovacData: any = {};
    public rawDps: Record<string, any> = {};
    public debugLog: boolean;
    public deviceId: string;
    public deviceModel: string;
    public config: any = {};
    private seq: number;

    constructor(config: { deviceId: string, deviceModel?: string, debug?: boolean }) {
        super();

        this.deviceId = config.deviceId;
        this.deviceModel = config.deviceModel || '';
        this.debugLog = config.debug || false;
        this.seq = Math.floor(Date.now() % 1000);
    }

    public async checkApiType(dps) {
        try {
            if (!this.novelApi && Object.values(this.novelDPSMap).some(k => k in dps)) {
                console.log('Novel API detected');
                this.setApiTypes(true);
            } else if (!this.novelApi) {
                console.log('Legacy API detected');
                this.setApiTypes(false);
            }
        } catch (error) {
            console.error('Error checking API type', error);
        }

    }

    public async setApiTypes(novelApi: boolean) {
        this.novelApi = novelApi;

        this.DPSMap = this.novelApi ? this.novelDPSMap : this.legacyDPSMap;
        this.robovacData = { ...this.DPSMap };
    }


    public mapData(dps: any) {
        this.rawDps = { ...this.rawDps, ...(dps || {}) };

        for (const key in dps) {
            const mappedKeys = Object.keys(this.DPSMap).filter(k => this.DPSMap[k] === key);

            if (mappedKeys.length) {
                mappedKeys.forEach(mappedKey => {
                    this.robovacData[mappedKey] = dps[key];
                });
            }
        }

        if (this.debugLog) console.debug('mappedData', this.robovacData);

        this.getControlResponse();
    }

    public async getRobovacData() {
        return this.robovacData;
    }

    public async listScenes(): Promise<Array<{ id: number; name: string; mapId?: number }>> {
        const raw = this.rawDps['180'] || this.robovacData?.SCENES;
        if (typeof raw !== 'string') {
            return [];
        }

        try {
            const value = await decode('./proto/cloud/scene.proto', 'SceneResponse', raw);
            const infos = Array.isArray(value?.infos) ? value.infos : [];

            return infos
                .map((info: any) => ({
                    id: Number(info?.id?.value ?? 0),
                    name: String(info?.name ?? '').trim(),
                    mapId: info?.mapid ? Number(info.mapid) : undefined
                }))
                .filter((scene) => scene.id > 0 && scene.name);
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    public supportsNamedScenes(): boolean {
        return !!this.config?.mqtt;
    }

    public supportsNumericRoomClean(): boolean {
        return !!this.config?.localKey && (this.novelApi || this.canUseMappedLocalFallback());
    }

    async getCleanSpeed() {
        if (typeof this.robovacData?.CLEAN_SPEED === 'number' || this.robovacData?.CLEAN_SPEED?.length === 1) {
            const cleanSpeeds = Object.values(EUFY_CLEAN_NOVEL_CLEAN_SPEED)
            return <string>cleanSpeeds[parseInt(this.robovacData.CLEAN_SPEED)].toLowerCase();

        }

        return this.robovacData?.CLEAN_SPEED?.toLowerCase() || 'standard'.toLowerCase();
    }

    async getControlResponse() {
        try {
            if (this.novelApi) {
                const value = await decode('./proto/cloud/control.proto', 'ModeCtrlResponse', 'AhB8');
                return value || {};
            }

            return null;
        } catch (error) {
            return {};
        }
    }


    async getPlayPause(): Promise<boolean> {
        return <boolean>this.robovacData.PLAY_PAUSE;
    }

    async getWorkMode() {
        try {
            if (this.novelApi) {
                const values = await getMultiData('./proto/cloud/work_status.proto', 'WorkStatus', this.robovacData.WORK_MODE);

                const mode = values.find(v => v.key === 'Mode');

                return mode?.value?.toLowerCase() || 'AUTO'.toLowerCase();
            }

            return this.robovacData?.WORK_MODE?.toLowerCase();
        } catch (error) {
            return 'AUTO'.toLowerCase();
        }
    }

    async getWorkStatus() {
        try {
            if (this.novelApi) {
                const value = await decode('./proto/cloud/work_status.proto', 'WorkStatus', this.robovacData.WORK_STATUS);
                return value?.state?.toLowerCase() || 'CHARGING'.toLowerCase();
            }

            return this.robovacData?.WORK_STATUS?.toLowerCase();
        } catch (error) {
            return 'CHARGING'.toLowerCase();
        }
    }

    async getCleanParamsRequest() {
        try {
            if (this.novelApi) {
                const value = await decode('./proto/cloud/clean_param.proto', 'CleanParamRequest', this.robovacData?.CLEANING_PARAMETERS);
                return value || {};
            }

            return this.robovacData.WORK_STATUS;
        } catch (error) {
            return {};
        }
    }

    async getCleanParamsResponse() {
        try {
            if (this.novelApi) {
                const value = await decode('./proto/cloud/clean_param.proto', 'CleanParamResponse', this.robovacData?.CLEANING_PARAMETERS);
                return value || {};
            }

            return null;
        } catch (error) {
            return {};
        }
    }

    async getFindRobot() {
        return <boolean>this.robovacData.FIND_ROBOT;
    }

    async getBatteryLevel() {
        return <number>this.robovacData.BATTERY_LEVEL;
    }

    async getErrorCode(): Promise<string | number> {
        try {
            if (this.novelApi) {
                const value = await decode('./proto/cloud/error_code.proto', 'ErrorCode', this.robovacData.ERROR_CODE);
                if (value?.warn?.length) {
                    return value?.warn[0]
                }

                return 0;
            }

            return this.robovacData.ERROR_CODE;
        } catch (error) {
            console.log(error)
        }
    }


    async setCleanSpeed(cleanSpeed) {
        try {
            if (this.novelApi) {
                const setCleanSpeed = Object.values(EUFY_CLEAN_NOVEL_CLEAN_SPEED).findIndex(v => v.toLowerCase() === cleanSpeed);

                console.log('Setting clean speed to: ', setCleanSpeed, Object.values(EUFY_CLEAN_NOVEL_CLEAN_SPEED), cleanSpeed)

                return await this.sendCommand({
                    [this.DPSMap.CLEAN_SPEED]: setCleanSpeed
                })
            }

            console.log('Setting clean speed to: ', cleanSpeed)
            return await this.sendCommand({
                [this.DPSMap.CLEAN_SPEED]: cleanSpeed
            })
        } catch (error) {
            console.error(error)
        }
    }

    async autoClean() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.START_AUTO_CLEAN,
                autoClean: {
                    cleanTimes: 1
                }
            });
        }

        await this.sendCommand({ [this.DPSMap.WORK_MODE]: EUFY_CLEAN_WORK_MODE.AUTO })
        return await this.play();
    }

    async sceneClean(id: number) {
        if (this.novelApi || this.supportsNamedScenes()) {
            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.START_SCENE_CLEAN,
                sceneClean: {
                    sceneId: id
                }
            });
        }

        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: true });
    }

    async sceneCleanSlot(slot: number) {
        if (this.novelApi || this.supportsNamedScenes()) {
            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.START_SCENE_CLEAN,
                sceneClean: {
                    sceneId: slot + 3
                }
            });
        }

        return await this.sceneClean(slot);
    }

    async play() {
        let value = true;

        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.RESUME_TASK
            });
        }

        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
    }

    async pause() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.PAUSE_TASK
            });
        }

        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: false })
    }

    async stop() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.STOP_TASK
            });
        }

        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: false })
    }

    async goHome() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.START_GOHOME
            });
        }

        return await this.sendCommand({ [this.DPSMap.GO_HOME]: true })
    }

    async spotClean() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.START_SPOT_CLEAN
            });
        }
    }

    async roomClean() {
        if (this.novelApi || this.canUseMappedLocalFallback()) {
            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.START_SELECT_ROOMS_CLEAN
            });
        }


        if (EUFY_CLEAN_X_SERIES.includes(this.deviceModel) || EUFY_CLEAN_E_SERIES.includes(this.deviceModel)) {
            await this.sendCommand({ [this.DPSMap.WORK_MODE]: EUFY_CLEAN_WORK_MODE.SMALL_ROOM })
            return await this.play();
        }

        await this.sendCommand({ [this.DPSMap.WORK_MODE]: EUFY_CLEAN_WORK_MODE.ROOM })
        return await this.play();
    }

    async cleanRooms(roomIds: number[], cleanTimes = 1) {
        const normalizedRoomIds = roomIds
            .map((roomId) => Number.parseInt(String(roomId), 10))
            .filter((roomId) => Number.isFinite(roomId) && roomId > 0);

        if (!normalizedRoomIds.length) {
            throw new Error('Please provide at least one valid room ID.');
        }

        if (this.novelApi || this.canUseMappedLocalFallback()) {
            const mapId = Number(this.config?.mapId || 0);

            return await this.sendNovelControlCommand({
                method: EUFY_CLEAN_CONTROL.START_SELECT_ROOMS_CLEAN,
                selectRoomsClean: {
                    rooms: normalizedRoomIds.map((id, index) => ({
                        id,
                        order: index + 1
                    })),
                    cleanTimes: cleanTimes > 0 ? cleanTimes : 1,
                    ...(mapId > 0 ? { mapId } : {})
                }
            });
        }

        return await this.roomClean();
    }

    async setCleanParam(config: { cleanType?: 'SWEEP_AND_MOP' | 'SWEEP_ONLY' | 'MOP_ONLY', mopMode?: 'HIGH' | 'MEDIUM' | 'LOW', cleanExtent?: 'NORMAL' | 'NARROW' | 'QUICK' }) {
        if (!this.novelApi) return;

        const cleanParamProto = await getProtoFile('proto/cloud/clean_param.proto');
        const cleanParams = {
            cleanType: cleanParamProto.lookupType('CleanType')?.Value,
            cleanExtent: cleanParamProto.lookupType('CleanExtent')?.Value,
            mopMode: cleanParamProto.lookupType('MopMode')?.Level,
        }

        const isMop = config.cleanType === 'SWEEP_AND_MOP' || config.cleanType === 'MOP_ONLY';

        const requestParams = {
            cleanParam: {
                ...(config.cleanType ? { cleanType: { value: cleanParams.cleanType[config.cleanType] } } : { cleanType: {} }),
                ...(config.cleanExtent ? { cleanExtent: { value: cleanParams.cleanExtent[config.cleanExtent] } } : { cleanExtent: {} }),
                ...(config.mopMode && isMop ? { mopMode: { level: cleanParams.mopMode[config.mopMode] } } : { mopMode: {} }),
                smartModeSw: {},
                cleanTimes: 1
            }
        }

        console.log('setCleanParam - requestParams', requestParams)

        const value = await encode('proto/cloud/clean_param.proto', 'CleanParamRequest', requestParams);

        await this.sendCommand({ [this.DPSMap.CLEANING_PARAMETERS]: value })
    }

    public formatStatus() {
        console.log('formatted status:', this.robovacData);
    }

    public async sendCommand(data: { [key: string]: string | number | boolean }) {
        throw new Error('Method not implemented.');
    }

    private nextSeq(): number {
        this.seq = (this.seq % 65535) + 1;
        return this.seq;
    }

    private hasNovelLocalControlSignals(): boolean {
        return !!this.config?.localKey && Object.keys(this.rawDps).some((key) => LOCAL_NOVEL_FALLBACK_DPS.includes(key));
    }

    private canUseLocalNovelControlFallback(): boolean {
        return !this.novelApi && this.hasNovelLocalControlSignals();
    }

    private canUseMappedLocalFallback(): boolean {
        const mapId = Number(this.config?.mapId || 0);
        return this.canUseLocalNovelControlFallback() && mapId > 0;
    }

    private getNovelControlDp(): string {
        return this.novelApi ? this.DPSMap.PLAY_PAUSE : this.novelDPSMap.PLAY_PAUSE;
    }

    private async sendNovelControlCommand(command: Record<string, any>) {
        const value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
            seq: this.nextSeq(),
            ...command
        });

        return await this.sendCommand({ [this.getNovelControlDp()]: value });
    }
}
