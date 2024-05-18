import { Base } from './Base';
import { getFlatData, getDecodedData, getMultiData } from '../lib/utils';
import { CleanSpeed, ErrorCode, WorkStatus, WorkMode, Direction, StatusResponse } from '../types/LegacyConnect';
import { EufyLogin } from '../controllers/Login';

export class CloudConnect extends Base {
    private novelApi: boolean = false
    private autoUpdate: number;
    private debugLog: boolean;
    private deviceId: string;

    public robovacData: any;

    private eufyAPi: EufyLogin;

    

    constructor(config: { username: string, password: string, deviceId: string, autoUpdate?: number, debug?: boolean }, openudid: string) {
        super();

        this.eufyAPi = new EufyLogin(config.username, config.password, openudid);
        this.deviceId = config.deviceId;

        this.autoUpdate = config.autoUpdate || 0;
        this.debugLog = config.debug || false;
    }

    async connect() {
        await this.eufyAPi.softLogin();
        await this.updateDevice(true);
    }

    async updateDevice(checkApiType = false) {
        try {
            const device = await this.eufyAPi.getCloudDevice(this.deviceId);
            // const device = {
            //     dps: {
            //         '150': '',
            //         '151': true,
            //         '152': 'AA==',
            //         '153': 'ChADGgIIAXICIgA=',
            //         '154': 'JgoOCgIIAhIAGgAiAggCKgASABoAIhAKAggCGgAiAggCKgAyAggC',
            //         '155': 'Brake',
            //         '156': true,
            //         '157': 'CgoAEgYKABIAGgA=',
            //         '158': 'Turbo',
            //         '159': true,
            //         '160': false,
            //         '161': 80,
            //         '162': 'CwiSAxCSAxgMIJID',
            //         '163': 100,
            //         '164': 'qgIIBhAGGgAikAEKAggCEgQIARABGgwIARIEGAwgChoCCCIiYgji17fhrDESKGRmZTNlNzM2NmUzZDhkYTRlNDU2MTNmNWYzOTgxNzc0MGNkZDg2MWYYxd+Os+QxIihkZmUzZTczNjZlM2Q4ZGE0ZTQ1NjEzZjVmMzk4MTc3NDBjZGQ4NjFmKhIaEBIOCgIIAhICCAIaAggCIgAijgEKAggBEgQIARABGgwIARIEGAwgChoCCF0iYgj07LXhrDESKGRmZTNlNzM2NmUzZDhkYTRlNDU2MTNmNWYzOTgxNzc0MGNkZDg2MWYY6uWOs+QxIihkZmUzZTczNjZlM2Q4ZGE0ZTQ1NjEzZjVmMzk4MTc3NDBjZGQ4NjFmKhAaDhIMCgIIAhICCAEaACIA',
            //         '165': 'KAomCBQSCggBEgZLZXVrZW4SBwgCEgNIYWwSDQgDEglXb29ua2FtZXI=',
            //         '166': 'CAoAEgAaACIA',
            //         '167': 'HwoFCOQKEBoSCgjm1hQQ7TMYjAIaCgjm1hQQ7TMYhQI=',
            //         '168': 'JQojCgIIcRICCHEaAghxIgIIcSoCCDwyAggioAG4xs7tqp2Q6Bc=',
            //         '169': 'mAEKFWV1ZnkgQ2xlYW4gWDkgUHJvIEFDUxoRMTQ6ZjU6Zjk6Zjc6NTA6MGQiBjEuNS4yMygKMhdNaWNoaWVsIGRlIFJvdXRlciAtIElvVEIoZGZlM2U3MzY2ZTNkOGRhNGU0NTYxM2Y1ZjM5ODE3NzQwY2RkODYxZloLCgYwLjIuMTEQkE5iEggBGgQIAhAHIgQIARABMgIIAQ==',
            //         '170': 'BQgEEJsM',
            //         '171': 'AhAB',
            //         '172': 'BAgCEF0=',
            //         '173': 'LgokCgwKBggBGgIIChIAGAESBggBEgIIATIMCgIIARIGCAEQARgPEgIIASoCCDQ=',
            //         '175': '',
            //         '176': 'KAoAGgIIASICCAEqADIAQgQIoJkCSgBSDAoCCAESAggBIgIIAVgoagA=',
            //         '177': 'EAibhKzohIQeGgJGUiIAUgA=',
            //         '178': 'Cwji2tWypokeEgER',
            //         '179': 'HhIcChoIjAIQATD52ZyyBjj26pyyBkDkCkgaUDJYFA=='
            //     }
            // }
    
            if (checkApiType) {
                await this.checkApiType(device?.dps);
            }
    
            await this.mapData(device?.dps)
    
            if (this.autoUpdate > 0) {
                this.recursiveUpdate(this.autoUpdate);
            }
        } catch (error) {
            console.log(error)
        }

    }

    async recursiveUpdate(time) {
        setTimeout(async () => {
            await this.updateDevice();
        }, time);
    }

    private async checkApiType(dps) {
        if (!this.novelApi && Object.values(this.novelDPSMap).some(k => k in dps)) {
            console.log('Novel API detected');
            this.setApiTypes(true);
        } else {
            console.log('Legacy API detected');
            this.setApiTypes(false);
        }
    }

    private async setApiTypes(novelApi: boolean) {
        this.novelApi = novelApi;

        this.DPSMap = this.novelApi ? this.novelDPSMap : this.legacyDPSMap;
        this.robovacData = { ...this.DPSMap }; // Make shallow copy of DPSMap
    }

    private mapData(dps: any) {
        for (const key in dps) {
            const mappedKey = Object.keys(this.DPSMap).find(k => this.DPSMap[k] === key);

            if (mappedKey) {
                this.robovacData[mappedKey] = dps[key];
            }
        }

        if(this.debugLog) console.debug('mappedData', this.robovacData);
    }

    async getRobovacData() {
        return this.robovacData;
    }

    async getCleanSpeed() {
        return this.robovacData.CLEAN_SPEED.toLowerCase();
    }


    async getPlayPause(): Promise<boolean> {
        return <boolean>this.robovacData.PLAY_PAUSE;
    }

    async getWorkMode() {
        try {
            if (this.novelApi) {
                const values = await getMultiData('./proto/cloud/work_status.proto', 'WorkStatus', this.robovacData.WORK_STATUS);

                const mode = values.find(v => v.key === 'Mode');

                return mode?.value?.toLowerCase() || 'AUTO'.toLowerCase();
            }

            return this.robovacData.WORK_MODE.toLowerCase();
        } catch (error) {
            return 'COMPLETED'.toLowerCase();
        }
    }

    async getWorkStatus() {
        try {
            if (this.novelApi) {
                const value = await getDecodedData('./proto/cloud/work_status.proto', 'WorkStatus', this.robovacData.WORK_STATUS);
                return value?.state?.toLowerCase() || 'COMPLETED'.toLowerCase();
            }

            return this.robovacData.WORK_STATUS;
        } catch (error) {
            return 'COMPLETED'.toLowerCase();
        }
    }
    
    async setCleanSpeed(cleanSpeed) {
        try {
            await this.eufyAPi.sendCloudCommand(this.deviceId, {
                [this.DPSMap.CLEAN_SPEED]: cleanSpeed
            })    
        } catch (error) {
            console.error(error)
        }
        
    }

    // async setPlayPause(state: boolean) {
    //     await this.doWork(async () => {
    //         await this.set({
    //             [this.DPSMap.PLAY_PAUSE]: state
    //         })
    //     });
    // }

    // async play() {
    //     await this.setPlayPause(true);
    // }

    // async pause() {
    //     await this.setPlayPause(true);
    // }

    // async setWorkMode(workMode: WorkMode) {
    //     await this.doWork(async () => {
    //         if (this.debugLog) {
    //             console.log(`Setting WorkMode to ${workMode}`);
    //         }
    //         await this.set({
    //             [this.DPSMap.WORK_MODE]: workMode
    //         })
    //     });
    // }

    // async startCleaning(force: boolean = false) {
    //     if (this.debugLog) {
    //         console.log('Starting Cleaning', JSON.stringify(await this.getStatuses(force), null, 4));
    //     }
    //     await this.setWorkMode(WorkMode.AUTO);

    //     if (this.debugLog) {
    //         console.log('Cleaning Started!');
    //     }
    // }

    // async setWorkStatus(workStatus: WorkStatus) {
    //     await this.doWork(async () => {
    //         await this.set({
    //             [this.DPSMap.WORK_STATUS]: workStatus
    //         })
    //     });
    // }

    // async goHome() {
    //     await this.doWork(async () => {
    //         await this.set({
    //             [this.DPSMap.GO_HOME]: true
    //         })
    //     });
    // }

    // async setDirection(direction: Direction) {
    //     await this.doWork(async () => {
    //         await this.set({
    //             [this.DPSMap.DIRECTION]: direction
    //         })
    //     });
    // }

    // async setFindRobot(state: boolean) {
    //     return await this.doWork(async () => {
    //         await this.set({
    //             [this.DPSMap.FIND_ROBOT]: state
    //         })
    //     });
    // }

    // async getFindRobot(force: boolean = false) {
    //     let statuses = await this.getStatuses(force);
    //     return <boolean>statuses.dps[this.DPSMap.FIND_ROBOT];
    // }

    async getBatteryLevel() {
        return <number>this.robovacData.BATTERY_LEVEL;
    }

    async getErrorCode(): Promise<string|number> {
        try {
            if (this.novelApi) {
                const value = await getDecodedData('./proto/cloud/error_code.proto', 'ErrorCode', this.robovacData.ERROR_CODE);
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

    // async set(data: { [key: string]: string | number | boolean }) {
    //     if (this.debugLog) {
    //         console.log(`Setting: ${JSON.stringify(data, null, 4)}`);
    //     }


    //     return await this.api.set({
    //         multiple: true,
    //         data: data
    //     });
    // }

    public formatStatus() {
        console.log('formatted status:', this.robovacData);
    }
}
