export class Base {    
    public legacyDPSMap = {
        PLAY_PAUSE: '2',
        DIRECTION: '3',
        WORK_MODE: '5',
        WORK_STATUS: '15',
        CLEANING_PARAMETERS: '154',
        CLEANING_STATISTICS: '167',
        ACCESSORIES_STATUS: '168',
        GO_HOME: '101',
        CLEAN_SPEED: '102',
        FIND_ROBOT: '103',
        BATTERY_LEVEL: '104',
        ERROR_CODE: '106',
    }

    public novelDPSMap = {
        PLAY_PAUSE: '152',
        DIRECTION: '155',
        WORK_MODE: '153',
        WORK_STATUS: '153',
        CLEANING_PARAMETERS: '154',
        CLEANING_STATISTICS: '167',
        ACCESSORIES_STATUS: '168',
        GO_HOME: '173',
        CLEAN_SPEED: '158',
        FIND_ROBOT: '160',
        BATTERY_LEVEL: '163',
        ERROR_CODE: '177',
    }

    public DPSMap = this.legacyDPSMap;

    constructor() {}

    public async connect() {
        throw new Error('Not implemented');
    }
}