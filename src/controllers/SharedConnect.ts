import { Base } from "./Base";
import { getFlatData, decode, getMultiData, encode } from '../lib/utils';

export class SharedConnect extends Base {
    public novelApi: boolean = false;
    public robovacData: any = {};
    public debugLog: boolean;

    constructor(config: { debug?: boolean }) {
        super();

        this.debugLog = config.debug || false;
    }

    public async checkApiType(dps) {
        if (!this.novelApi && Object.values(this.novelDPSMap).some(k => k in dps)) {
            console.log('Novel API detected');
            this.setApiTypes(true);
        } else {
            console.log('Legacy API detected');
            this.setApiTypes(false);
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
    }

    public async updateDevice() {
        throw new Error('Method not implemented.');
    }

    async recursiveUpdate(time) {
        setTimeout(async () => {
            await this.updateDevice();
        }, time);
    }

    public async getRobovacData() {
        return this.robovacData;
    }


    async getCleanSpeed() {
        if (typeof this.robovacData?.CLEAN_SPEED === 'string') {
            return this.robovacData?.CLEAN_SPEED.toLowerCase();
        }

        return <number>this.robovacData.CLEAN_SPEED;
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

            return this.robovacData.WORK_MODE.toLowerCase();
        } catch (error) {
            return 'AUTP'.toLowerCase();
        }
    }

    async getWorkStatus() {
        try {
            if (this.novelApi) {
                const value = await decode('./proto/cloud/work_status.proto', 'WorkStatus', this.robovacData.WORK_STATUS);
                return value?.state?.toLowerCase() || 'COMPLETED'.toLowerCase();
            }

            return this.robovacData.WORK_STATUS;
        } catch (error) {
            return 'COMPLETED'.toLowerCase();
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
            console.log('Setting clean speed to: ', cleanSpeed)
            await this.sendCommand({
                [this.DPSMap.CLEAN_SPEED]: cleanSpeed
            })
        } catch (error) {
            console.error(error)
        }
    }

    async play() {
        let value = true;

        if (this.novelApi) {
            value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: 'START_AUTO_CLEAN',
                autoClean: {
                    cleanTimes: 1
                }
            })
        }

        await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
    }

    async pause() {
        let value = false

        if (this.novelApi) {
            value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: 'PAUSE_TASK',
                autoClean: {
                    cleanTimes: 1
                }
            })
        }

        await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
    }

    async goHome() {
        if (this.novelApi) {
            const value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: 'START_GOHOME',
                autoClean: {
                    cleanTimes: 1
                }
            });

            await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
        }

        await this.sendCommand({ [this.DPSMap.GO_HOME]: true })
    }

    async spotClean() {
        if (this.novelApi) {
            const value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: 'START_GOHOME',
                autoClean: {
                    cleanTimes: 1
                }
            });

            await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
        }
    }

    async roomClean() {
        if (this.novelApi) {
            const value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: 'START_GOHOME',
                autoClean: {
                    cleanTimes: 1
                }
            });

            await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
        }
    }

    async smallRoomClean() {
        if (this.novelApi) {
            const value = await encode('proto/cloud/control.proto', 'ModeCtrlRequest', {
                method: 'START_GOHOME',
                autoClean: {
                    cleanTimes: 1
                }
            });

            await this.sendCommand({ [this.DPSMap.PLAY_PAUSE]: value })
        }
    }

    async setWorkMode(workMode: 'AUTO' | 'SPOT' | 'ROOM' | 'SMALL_ROOM') {
        switch (workMode) {
            case 'AUTO':
                await this.play();
                break;
            case 'SPOT':
                await this.spotClean();
            case 'ROOM':
                await this.roomClean();
            case 'SMALL_ROOM':
                await this.smallRoomClean();
            default:
                await this.pause();
                break;
        }
    }

    async setCleanParam(config: { cleanType?, cleanCarpet?, cleanExtent?, mopMode?, smartModeSw?, areaCleanParam?}) {
        // const currentParams = 
        const requestParams = {
            cleanParam: {
                cleanType: { value: 1 },
                cleanCarpet: {},
                cleanExtent: {},
                mopMode: { level: 1 },
                smartModeSw: { value: false }
            },
            areaCleanParam: {}
        }
    }

    public formatStatus() {
        console.log('formatted status:', this.robovacData);
    }

    public async sendCommand(data: { [key: string]: string | number | boolean }) {
        throw new Error('Method not implemented.');
    }
}