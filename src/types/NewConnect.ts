// 102
export enum CleanSpeed {
    NO_SUCTION = 'No_suction',
    STANDARD = 'Standard',
    QUIET = 'Quiet',
    TURBO = 'Turbo',
    BOOST_IQ = 'Boost_IQ',
    MAX = 'Max'
}

// 106
export enum ErrorCode {
    NO_ERROR = 'no_error',
    WHEEL_STUCK = 'Wheel_stuck',
    R_BRUSH_STUCK = 'R_brush_stuck',
    CRASH_BAR_STUCK = 'Crash_bar_stuck',
    SENSOR_DIRTY = 'sensor_dirty',
    NOT_ENOUGH_POWER = 'N_enough_pow',
    STUCK_5_MIN = 'Stuck_5_min',
    FAN_STUCK = 'Fan_stuck',
    S_BRUSH_STUCK = 'S_brush_stuck'
}

// 153
export enum WorkStatus {
    AUTO = 'BgoAEAUyAA==',
    POSITION = 'BgoAEAVSAA==',
    PAUSE = 'CAoAEAUyAggB',
    ROOM = 'CAoCCAEQBTIA',
    ROOM_POSITION = 'CAoCCAEQBVIA',
    ROOM_PAUSE = 'CgoCCAEQBTICCAE=',
    SPOT = 'CAoCCAIQBTIA',
    SPOT_POSITION = 'CAoCCAIQBVIA',
    SPOT_PAUSE = 'CgoCCAIQBTICCAE=',
    START_MANUAL = 'BAoAEAY=',
    GOING_TO_CHARGE = 'BBAHQgA=',
    CHARGING = 'BBADGgA=',
    COMPLETED = 'BhADGgIIAQ==',
    STANDBY = 'AA==',
    SLEEPING = 'AhAB',    
}

// 3
export enum Direction {
    LEFT = 'left',
    RIGHT = 'right',
    FORWARD = 'forward',
    BACKWARD = 'backward'
}

// 5
export enum WorkMode {
    AUTO = 'auto',
    NO_SWEEP = 'Nosweep',
    SMALL_ROOM = 'SmallRoom',
    ROOM = 'room',
    ZONE = 'zone',
    EDGE = 'Edge',
    SPOT = 'Spot',
    SINGLE = 'single',
    POINT = 'point',
    STANDBY = 'standby',
    WALL_FOLLOW = 'wall_follow',
    SMART = 'smart'
}

export interface StatusResponse {
    devId: string,
    dps: {
        "1": boolean,
        "2": boolean,
        "3": string,
        "5": string,
        "15": string,
        "101": boolean,
        "102": string,
        "103": boolean,
        "104": number,
        "106": string,
        '151': boolean,
        '152': string,
        '153': string,
        '155': string,
        '156': string,
        '158': string,
        '159': boolean,
        '160': boolean,
        '161': number,
        '163': number
    }
}