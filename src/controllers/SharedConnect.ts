import { Base } from "./Base";
import { EUFY_CLEAN_WORK_MODE, EUFY_CLEAN_NOVEL_CLEAN_SPEED, EUFY_CLEAN_CONTROL } from "../constants/state.constants";
import { EUFY_CLEAN_X_SERIES } from "../constants/devices.constants";
import { decode, getMultiData, getProtoFile, encode } from '../lib/utils';

export class SharedConnect extends Base {
    public novelApi: boolean = false;
    public robovacData: any = {};
    public debugLog: boolean;
    public deviceId: string;
    public deviceModel: string;
    public config = {};

    constructor(config: { deviceId: string, deviceModel?: string, debug?: boolean }) {
        super();

        this.deviceId = config.deviceId;
        this.deviceModel = config.deviceModel || '';
        this.debugLog = config.debug || false;
    }

    public async checkApiType(dps) {
        try {
            if (!this.novelApi && Object.values(this.novelDPSMap).some(k => k in dps)) {
                console.log('Novel API detected');
                this.setApiTypes(true);
            } else {
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
        this.robovacData = { ...this.DPSMap }; // Make shallow copy of DPSMap
    }


    public mapData(dps: any) {
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
                const value = await decode('./proto/cloud/control.proto', 'ModeCtrlResponse', this.robovacData.PLAY_PAUSE);
                console.log('152 - control response', value)
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
        let value = true;

        if (this.novelApi) {
            value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                autoClean: {
                    cleanTimes: 1
                }
            })
        }

        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
    }

    async sceneClean(id: number) {
        await this.stop(); 

        let value = true;
        let increment = 3; // Scene 1 is 4, Scene 2 is 5, Scene 3 is 6 etc.

        if (this.novelApi) {
            value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: EUFY_CLEAN_CONTROL.START_SCENE_CLEAN,
                sceneClean: {
                    sceneId: id + increment
                }
            })
        }

        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
    }

    async play() {
        let value = true;

        if (this.novelApi) {
            value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: EUFY_CLEAN_CONTROL.RESUME_TASK
            })
        }

        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
    }

    async pause() {
        let value = false

        if (this.novelApi) {
            value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: EUFY_CLEAN_CONTROL.PAUSE_TASK
            })
        }

        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
    }

    async stop() {
        let value = false

        if (this.novelApi) {
            value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: EUFY_CLEAN_CONTROL.STOP_TASK
            })
        }

        return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
    }

    async goHome() {
        if (this.novelApi) {
            const value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: EUFY_CLEAN_CONTROL.START_GOHOME
            });

            return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
        }

        return await this.sendCommand({ [this.DPSMap.GO_HOME]: true })
    }

    async spotClean() {
        if (this.novelApi) {
            const value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: EUFY_CLEAN_CONTROL.START_SPOT_CLEAN
            });

            return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
        }
    }

    async roomClean() {
        if (this.novelApi) {
            const value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: EUFY_CLEAN_CONTROL.START_SELECT_ROOMS_CLEAN
            });

            return await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
        }


        if (EUFY_CLEAN_X_SERIES.includes(this.deviceModel)) {
            await this.sendCommand({ [this.DPSMap.WORK_MODE]: EUFY_CLEAN_WORK_MODE.SMALL_ROOM })
            return await this.play();
        }

        await this.sendCommand({ [this.DPSMap.WORK_MODE]: EUFY_CLEAN_WORK_MODE.ROOM })
        return await this.play();
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
}