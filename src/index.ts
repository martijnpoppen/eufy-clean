import crypto from 'crypto';

import { EufyLogin } from './controllers/Login';
import { LocalConnect } from './controllers/LocalConnect';
import { CloudConnect } from './controllers/CloudConnect';
import { MqttConnect } from './controllers/MqttConnect';
import { sleep } from './lib/utils';

export class EufyCleanLogin {
    private eufyLogin: EufyLogin;
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
    public async login(): Promise<any> {
        console.log('EufyClean init');

        this.eufyLogin = new EufyLogin(this.username, this.password, this.openudid);

        await this.eufyLogin.init();

        return {
            cloudDevices: this.eufyLogin.cloudDevices,
            mqttDevices: this.eufyLogin.mqttDevices,
            mqttCredentials: this.eufyLogin.mqttCredentials,
            openudid: this.openudid
        };
    }
}

export class EufyCleanDevice {
    private openudid: string;
    public localConnect: LocalConnect | null = null;
    public cloudConnect: CloudConnect | null = null;
    public mqqtConnect: MqttConnect | null = null;

    constructor(deviceConfig: {
        deviceId: string,
        deviceModel: string,
        localKey?: string,
        username: string,
        password: string,
        mqtt: boolean,
        ip?: string,
        debug?: boolean
    }) {
        this.openudid = crypto.randomBytes(16).toString('hex');

        if ('localKey' in deviceConfig && !deviceConfig.mqtt) {
            // this.localConnect = new LocalConnect(deviceConfig);
        }

        if (!('localKey' in deviceConfig) && !deviceConfig.mqtt) {
            this.cloudConnect = new CloudConnect(deviceConfig, this.openudid);
        }

        if (!('localKey' in deviceConfig) && deviceConfig.mqtt) {
            this.mqqtConnect = new MqttConnect(deviceConfig, this.openudid);
        }
    }

    public getInstance = () => {
        // Legacy, local connection
        if (this.localConnect) {
            return this.localConnect;
        }

        if (this.cloudConnect) {
            return this.cloudConnect;
        }

        if (this.mqqtConnect) {
            return this.mqqtConnect;
        }

        return null;
    }
}

async function main() {

}

main();