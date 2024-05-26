export const GET_STATE = {
    sleeping: 'stopped',
    standby: 'stopped',
    recharge: 'docked',
    running: 'cleaning',
    cleaning: 'cleaning',
    spot: 'spot_cleaning',
    completed: 'docked',
    charging: 'charging'
};

export const VACUUMCLEANER_STATE = {
    STOPPED: 'stopped',
    CLEANING: 'cleaning',
    SPOT_CLEANING: 'spot_cleaning',
    DOCKED: 'docked',
    CHARGING: 'charging'
};

export const WorkStatus = {
    // Cleaning
    RUNNING: 'Running',
    // In the dock, charging
    CHARGING: 'Charging',
    // Not in the dock, paused
    STAND_BY: 'standby',
    // Not in the dock - goes into this state after being paused for a while
    SLEEPING: 'Sleeping',
    // Going home because battery is depleted
    RECHARGE_NEEDED: 'Recharge',
    // In the dock, full charged
    COMPLETED: 'completed'
};

export const WorkMode = {
    AUTO: 'auto',
    NO_SWEEP: 'Nosweep',
    SMALL_ROOM: 'SmallRoom',
    ROOM: 'room',
    ZONE: 'zone',
    EDGE: 'Edge',
    SPOT: 'Spot'
};

export const ERROR_CODES = {
    0: 'NONE',
    1: 'CRASH BUFFER STUCK',
    2: 'WHEEL STUCK',
    3: 'SIDE BRUSH STUCK',
    4: 'ROLLING BRUSH STUCK',
    5: 'HOST TRAPPED CLEAR OBST',
    6: 'MACHINE TRAPPED MOVE',
    7: 'WHEEL OVERHANGING',
    8: 'POWER LOW SHUTDOWN',
    13: 'HOST TILTED',
    14: 'NO DUST BOX',
    17: 'FORBIDDEN AREA DETECTED',
    18: 'LASER COVER STUCK',
    19: 'LASER SENSOR STUCK',
    20: 'LASER BLOCKED',
    21: 'DOCK FAILED',
    26: 'POWER APPOINT START FAIL',
    31: 'SUCTION PORT OBSTRUCTION',
    32: 'WIPE HOLDER MOTOR STUCK',
    33: 'WIPING BRACKET MOTOR STUCK',
    39: 'POSITIONING FAIL CLEAN END',
    40: 'MOP CLOTH DISLODGED',
    41: 'AIRDRYER HEATER ABNORMAL',
    50: 'MACHINE ON CARPET',
    51: 'CAMERA BLOCK',
    52: 'UNABLE LEAVE STATION',
    55: 'EXPLORING STATION FAIL',
    70: 'CLEAN DUST COLLECTOR',
    71: 'WALL SENSOR FAIL',
    72: 'ROBOVAC LOW WATER',
    73: 'DIRTY TANK FULL',
    74: 'CLEAN WATER LOW',
    75: 'WATER TANK ABSENT',
    76: 'CAMERA ABNORMAL',
    77: '3D TOF ABNORMAL',
    78: 'ULTRASONIC ABNORMAL',
    79: 'CLEAN TRAY NOT INSTALLED',
    80: 'ROBOVAC COMM FAIL',
    81: 'SEWAGE TANK LEAK',
    82: 'CLEAN TRAY NEEDS CLEAN',
    83: 'POOR CHARGING CONTACT',
    101: 'BATTERY ABNORMAL',
    102: 'WHEEL MODULE ABNORMAL',
    103: 'SIDE BRUSH ABNORMAL',
    104: 'FAN ABNORMAL',
    105: 'ROLLER BRUSH MOTOR ABNORMAL',
    106: 'HOST PUMP ABNORMAL',
    107: 'LASER SENSOR ABNORMAL',
    111: 'ROTATION MOTOR ABNORMAL',
    112: 'LIFT MOTOR ABNORMAL',
    113: 'WATER SPRAY ABNORMAL',
    114: 'WATER PUMP ABNORMAL',
    117: 'ULTRASONIC ABNORMAL',
    119: 'WIFI BLUETOOTH ABNORMAL'
};
