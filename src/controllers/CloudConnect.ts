// Communication with the Eufy cloud - This goes via MQTT
// This is only supported for "new" devices like the RoboVac X10 and X9
import { BaseConnect } from './BaseConnect';
import { EufyMqtt } from '../api/EufyMqtt';

export class CloudConnect extends BaseConnect {
    private eufyMqtt: EufyMqtt | null = null;
    private mqttCredentials: any;
    private devices: any[];
    private openudid: string;

    public PLAY_PAUSE = '151';
    public DIRECTION = '155';
    public WORK_MODE = '152';
    public WORK_STATUS = '153';
    public GO_HOME = '173';
    public CLEAN_SPEED = '158';
    public FIND_ROBOT = '160';
    public BATTERY_LEVEL = '163';
    public ERROR_CODE = '177';
    

    constructor(mqttCredentials: any, devices: any[] = [], openudid: string = '') {
        super();

        this.mqttCredentials = mqttCredentials;
        this.openudid = openudid;
        this.devices = devices;

        console.log('CloudConnect constructor');
    }

    public async setupMqtt(): Promise<void> {
        if (this.mqttCredentials) {
            console.info('MQTT Credentials found');
            console.info('Setup MQTT Connection');

            const mappedDevices = this.devices.map((device) => {
                return {
                    id: device.device_sn,
                    device_model: device.device_model
                };
            });

            this.eufyMqtt = new EufyMqtt(this.mqttCredentials, this.openudid, mappedDevices);
            await this.eufyMqtt.connectMqtt();
        }
    }
}