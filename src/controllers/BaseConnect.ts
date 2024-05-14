import { StatusResponse } from '../types/LegacyConnect';

export class BaseConnect {
    public robovacData: any;
    public statuses: StatusResponse = null;
    public lastStatusUpdate: number = null;
    public maxStatusUpdateAge: number = 1000 * (1 * 30); //30 Seconds
    public timeoutDuration: number = 2;
    
    public legacyDPSMap = {
        PLAY_PAUSE: '2',
        DIRECTION: '3',
        WORK_MODE: '5',
        WORK_STATUS: '15',
        GO_HOME: '101',
        CLEAN_SPEED: '102',
        FIND_ROBOT: '103',
        BATTERY_LEVEL: '104',
        ERROR_CODE: '106',

    }

    public novelDPSMap = {
        PLAY_PAUSE: '151',
        DIRECTION: '155',
        WORK_MODE: '152',
        WORK_STATUS: '153',
        CLEANING_PARAMETERS: '154',
        GO_HOME: '173',
        CLEAN_SPEED: '158',
        FIND_ROBOT: '160',
        BATTERY_LEVEL: '163',
        ERROR_CODE: '177',
    }

    public DPSMap = this.legacyDPSMap;

    constructor() {
        console.log('BaseConnect constructor');
    }
}