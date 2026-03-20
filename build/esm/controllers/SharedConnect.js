"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedConnect = void 0;
const Base_1 = require("./Base");
const state_constants_1 = require("../constants/state.constants");
const devices_constants_1 = require("../constants/devices.constants");
const utils_1 = require("../lib/utils");
const LOCAL_NOVEL_FALLBACK_DPS = ['151', '156', '158', '159', '160', '161', '163', '177'];
class SharedConnect extends Base_1.Base {
    novelApi = false;
    robovacData = {};
    rawDps = {};
    debugLog;
    deviceId;
    deviceModel;
    config = {};
    seq;
    constructor(config) {
        super();
        this.deviceId = config.deviceId;
        this.deviceModel = config.deviceModel || '';
        this.debugLog = config.debug || false;
        this.seq = Math.floor(Date.now() % 1000);
    }
    async checkApiType(dps) {
        try {
            if (!this.novelApi && Object.values(this.novelDPSMap).some(k => k in dps)) {
                console.log('Novel API detected');
                this.setApiTypes(true);
            }
            else if (!this.novelApi) {
                console.log('Legacy API detected');
                this.setApiTypes(false);
            }
        }
        catch (error) {
            console.error('Error checking API type', error);
        }
    }
    async setApiTypes(novelApi) {
        this.novelApi = novelApi;
        this.DPSMap = this.novelApi ? this.novelDPSMap : this.legacyDPSMap;
        this.robovacData = { ...this.DPSMap };
    }
    mapData(dps) {
        this.rawDps = { ...this.rawDps, ...(dps || {}) };
        for (const key in dps) {
            const mappedKeys = Object.keys(this.DPSMap).filter(k => this.DPSMap[k] === key);
            if (mappedKeys.length) {
                mappedKeys.forEach(mappedKey => {
                    this.robovacData[mappedKey] = dps[key];
                });
            }
        }
        if (this.debugLog)
            console.debug('mappedData', this.robovacData);
        this.getControlResponse();
    }
    async getRobovacData() {
        return this.robovacData;
    }
    async listScenes() {
        const raw = this.rawDps['180'] || this.robovacData?.SCENES;
        if (typeof raw !== 'string') {
            return [];
        }
        try {
            const value = await (0, utils_1.decode)('./proto/cloud/scene.proto', 'SceneResponse', raw);
            const infos = Array.isArray(value?.infos) ? value.infos : [];
            return infos
                .map((info) => ({
                id: Number(info?.id?.value ?? 0),
                name: String(info?.name ?? '').trim(),
                mapId: info?.mapid ? Number(info.mapid) : undefined
            }))
                .filter((scene) => scene.id > 0 && scene.name);
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }
    supportsNamedScenes() {
        return !!this.config?.mqtt;
    }
    supportsNumericRoomClean() {
        return !!this.config?.localKey && (this.novelApi || this.canUseMappedLocalFallback());
    }
    async getCleanSpeed() {
        if (typeof this.robovacData?.CLEAN_SPEED === 'number' || this.robovacData?.CLEAN_SPEED?.length === 1) {
            const cleanSpeeds = Object.values(state_constants_1.EUFY_CLEAN_NOVEL_CLEAN_SPEED);
            return cleanSpeeds[parseInt(this.robovacData.CLEAN_SPEED)].toLowerCase();
        }
        return this.robovacData?.CLEAN_SPEED?.toLowerCase() || 'standard'.toLowerCase();
    }
    async getControlResponse() {
        try {
            if (this.novelApi) {
                const value = await (0, utils_1.decode)('./proto/cloud/control.proto', 'ModeCtrlResponse', 'AhB8');
                return value || {};
            }
            return null;
        }
        catch (error) {
            return {};
        }
    }
    async getPlayPause() {
        return this.robovacData.PLAY_PAUSE;
    }
    async getWorkMode() {
        try {
            if (this.novelApi) {
                const values = await (0, utils_1.getMultiData)('./proto/cloud/work_status.proto', 'WorkStatus', this.robovacData.WORK_MODE);
                const mode = values.find(v => v.key === 'Mode');
                return mode?.value?.toLowerCase() || 'AUTO'.toLowerCase();
            }
            return this.robovacData?.WORK_MODE?.toLowerCase();
        }
        catch (error) {
            return 'AUTO'.toLowerCase();
        }
    }
    async getWorkStatus() {
        try {
            if (this.novelApi) {
                const value = await (0, utils_1.decode)('./proto/cloud/work_status.proto', 'WorkStatus', this.robovacData.WORK_STATUS);
                return value?.state?.toLowerCase() || 'CHARGING'.toLowerCase();
            }
            return this.robovacData?.WORK_STATUS?.toLowerCase();
        }
        catch (error) {
            return 'CHARGING'.toLowerCase();
        }
    }
    async getCleanParamsRequest() {
        try {
            if (this.novelApi) {
                const value = await (0, utils_1.decode)('./proto/cloud/clean_param.proto', 'CleanParamRequest', this.robovacData?.CLEANING_PARAMETERS);
                return value || {};
            }
            return this.robovacData.WORK_STATUS;
        }
        catch (error) {
            return {};
        }
    }
    async getCleanParamsResponse() {
        try {
            if (this.novelApi) {
                const value = await (0, utils_1.decode)('./proto/cloud/clean_param.proto', 'CleanParamResponse', this.robovacData?.CLEANING_PARAMETERS);
                return value || {};
            }
            return null;
        }
        catch (error) {
            return {};
        }
    }
    async getFindRobot() {
        return this.robovacData.FIND_ROBOT;
    }
    async getBatteryLevel() {
        return this.robovacData.BATTERY_LEVEL;
    }
    async getErrorCode() {
        try {
            if (this.novelApi) {
                const value = await (0, utils_1.decode)('./proto/cloud/error_code.proto', 'ErrorCode', this.robovacData.ERROR_CODE);
                if (value?.warn?.length) {
                    return value?.warn[0];
                }
                return 0;
            }
            return this.robovacData.ERROR_CODE;
        }
        catch (error) {
            console.log(error);
        }
    }
    async setCleanSpeed(cleanSpeed) {
        try {
            if (this.novelApi) {
                const setCleanSpeed = Object.values(state_constants_1.EUFY_CLEAN_NOVEL_CLEAN_SPEED).findIndex(v => v.toLowerCase() === cleanSpeed);
                console.log('Setting clean speed to: ', setCleanSpeed, Object.values(state_constants_1.EUFY_CLEAN_NOVEL_CLEAN_SPEED), cleanSpeed);
                return await this.sendCommand({
                    [this.DPSMap.CLEAN_SPEED]: setCleanSpeed
                });
            }
            console.log('Setting clean speed to: ', cleanSpeed);
            return await this.sendCommand({
                [this.DPSMap.CLEAN_SPEED]: cleanSpeed
            });
        }
        catch (error) {
            console.error(error);
        }
    }
    async autoClean() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: state_constants_1.EUFY_CLEAN_CONTROL.START_AUTO_CLEAN,
                autoClean: {
                    cleanTimes: 1
                }
            });
        }
        await this.sendCommand({ [this.DPSMap.WORK_MODE]: state_constants_1.EUFY_CLEAN_WORK_MODE.AUTO });
        return await this.play();
    }
    async sceneClean(id) {
        if (this.novelApi || this.supportsNamedScenes()) {
            return await this.sendNovelControlCommand({
                method: state_constants_1.EUFY_CLEAN_CONTROL.START_SCENE_CLEAN,
                sceneClean: {
                    sceneId: id
                }
            });
        }
        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: true });
    }
    async sceneCleanSlot(slot) {
        if (this.novelApi || this.supportsNamedScenes()) {
            return await this.sendNovelControlCommand({
                method: state_constants_1.EUFY_CLEAN_CONTROL.START_SCENE_CLEAN,
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
                method: state_constants_1.EUFY_CLEAN_CONTROL.RESUME_TASK
            });
        }
        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value });
    }
    async pause() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: state_constants_1.EUFY_CLEAN_CONTROL.PAUSE_TASK
            });
        }
        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: false });
    }
    async stop() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: state_constants_1.EUFY_CLEAN_CONTROL.STOP_TASK
            });
        }
        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: false });
    }
    async goHome() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: state_constants_1.EUFY_CLEAN_CONTROL.START_GOHOME
            });
        }
        return await this.sendCommand({ [this.DPSMap.GO_HOME]: true });
    }
    async spotClean() {
        if (this.novelApi || this.canUseLocalNovelControlFallback()) {
            return await this.sendNovelControlCommand({
                method: state_constants_1.EUFY_CLEAN_CONTROL.START_SPOT_CLEAN
            });
        }
    }
    async roomClean() {
        if (this.novelApi || this.canUseMappedLocalFallback()) {
            return await this.sendNovelControlCommand({
                method: state_constants_1.EUFY_CLEAN_CONTROL.START_SELECT_ROOMS_CLEAN
            });
        }
        if (devices_constants_1.EUFY_CLEAN_X_SERIES.includes(this.deviceModel) || devices_constants_1.EUFY_CLEAN_E_SERIES.includes(this.deviceModel)) {
            await this.sendCommand({ [this.DPSMap.WORK_MODE]: state_constants_1.EUFY_CLEAN_WORK_MODE.SMALL_ROOM });
            return await this.play();
        }
        await this.sendCommand({ [this.DPSMap.WORK_MODE]: state_constants_1.EUFY_CLEAN_WORK_MODE.ROOM });
        return await this.play();
    }
    async cleanRooms(roomIds, cleanTimes = 1) {
        const normalizedRoomIds = roomIds
            .map((roomId) => Number.parseInt(String(roomId), 10))
            .filter((roomId) => Number.isFinite(roomId) && roomId > 0);
        if (!normalizedRoomIds.length) {
            throw new Error('Please provide at least one valid room ID.');
        }
        if (this.novelApi || this.canUseMappedLocalFallback()) {
            const mapId = Number(this.config?.mapId || 0);
            return await this.sendNovelControlCommand({
                method: state_constants_1.EUFY_CLEAN_CONTROL.START_SELECT_ROOMS_CLEAN,
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
    async setCleanParam(config) {
        if (!this.novelApi)
            return;
        const cleanParamProto = await (0, utils_1.getProtoFile)('proto/cloud/clean_param.proto');
        const cleanParams = {
            cleanType: cleanParamProto.lookupType('CleanType')?.Value,
            cleanExtent: cleanParamProto.lookupType('CleanExtent')?.Value,
            mopMode: cleanParamProto.lookupType('MopMode')?.Level,
        };
        const isMop = config.cleanType === 'SWEEP_AND_MOP' || config.cleanType === 'MOP_ONLY';
        const requestParams = {
            cleanParam: {
                ...(config.cleanType ? { cleanType: { value: cleanParams.cleanType[config.cleanType] } } : { cleanType: {} }),
                ...(config.cleanExtent ? { cleanExtent: { value: cleanParams.cleanExtent[config.cleanExtent] } } : { cleanExtent: {} }),
                ...(config.mopMode && isMop ? { mopMode: { level: cleanParams.mopMode[config.mopMode] } } : { mopMode: {} }),
                smartModeSw: {},
                cleanTimes: 1
            }
        };
        console.log('setCleanParam - requestParams', requestParams);
        const value = await (0, utils_1.encode)('proto/cloud/clean_param.proto', 'CleanParamRequest', requestParams);
        await this.sendCommand({ [this.DPSMap.CLEANING_PARAMETERS]: value });
    }
    formatStatus() {
        console.log('formatted status:', this.robovacData);
    }
    async sendCommand(data) {
        throw new Error('Method not implemented.');
    }
    nextSeq() {
        this.seq = (this.seq % 65535) + 1;
        return this.seq;
    }
    hasNovelLocalControlSignals() {
        return !!this.config?.localKey && Object.keys(this.rawDps).some((key) => LOCAL_NOVEL_FALLBACK_DPS.includes(key));
    }
    canUseLocalNovelControlFallback() {
        return !this.novelApi && this.hasNovelLocalControlSignals();
    }
    canUseMappedLocalFallback() {
        const mapId = Number(this.config?.mapId || 0);
        return this.canUseLocalNovelControlFallback() && mapId > 0;
    }
    getNovelControlDp() {
        return this.novelApi ? this.DPSMap.PLAY_PAUSE : this.novelDPSMap.PLAY_PAUSE;
    }
    async sendNovelControlCommand(command) {
        const value = await (0, utils_1.encode)('proto/cloud/control.proto', 'ModeCtrlRequest', {
            seq: this.nextSeq(),
            ...command
        });
        return await this.sendCommand({ [this.getNovelControlDp()]: value });
    }
}
exports.SharedConnect = SharedConnect;
