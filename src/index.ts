import crypto from 'crypto';

import { EufyLogin } from './controllers/Login';
import { LocalConnect } from './controllers/LocalConnect';
import { CloudConnect } from './controllers/CloudConnect';
import { MqttConnect } from './controllers/MqttConnect';
import { sleep } from './lib/utils';

export class EufyClean {
    private eufyCleanApi: EufyLogin;
    private openudid: string;

    private username: string;
    private password: string;

    // if the deviceconfig and mqttCredentials are provided the connection will be automatically setup
    constructor(username: string, password: string) {
        console.log('EufyClean constructor');

        this.username = username;
        this.password = password;
        this.openudid = crypto.randomBytes(16).toString('hex');
    }

    // Use this method to login and pair new devices.
    public async init(): Promise<any> {
        console.log('EufyClean init');

        this.eufyCleanApi = new EufyLogin(this.username, this.password, this.openudid);

        await this.eufyCleanApi.init();

        return {
            cloudDevices: this.eufyCleanApi.cloudDevices,
            mqttDevices: this.eufyCleanApi.mqttDevices
        };
    }

    public async getCloudDevices() {
        return this.eufyCleanApi.cloudDevices;
    }

    public async getMqttDevices() {
        return this.eufyCleanApi.mqttDevices;
    }

    public async getAllDevices() {
        return [...this.eufyCleanApi.cloudDevices, ...this.eufyCleanApi.mqttDevices]
    }

    public async initDevice(deviceConfig: {deviceId: string, localKey?: string, autoUpdate?: boolean, debug?: boolean}): Promise<CloudConnect | MqttConnect | null> {
        const devices = await this.getAllDevices();
        const device = devices.find(d => d.deviceId === deviceConfig.deviceId);

        if(!device) {
            return null; 
        }

        if ('localKey' in deviceConfig && !device.mqtt) {
            console.log('LocalConnect is deprecated, use CloudConnect instead');
            // this.localConnect = new LocalConnect(deviceConfig);
        }

        if (!('localKey' in deviceConfig) && !device.mqtt) {
            const cloudConnect = new CloudConnect(device, this.eufyCleanApi);
            return cloudConnect;
        }

        if (!('localKey' in deviceConfig) && device.mqtt) {
            const mqttConnect =  new MqttConnect(device, this.openudid, this.eufyCleanApi);
            return mqttConnect
        }
    }
}

export * from './constants';
