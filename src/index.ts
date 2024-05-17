import crypto from 'crypto';

import { EufyLogin } from './controllers/Login';
import { LocalConnect } from './controllers/LocalConnect';
import { CloudConnect } from './controllers/CloudConnect';

export class EufyCleanLogin {
    private eufyLogin: EufyLogin;
    private openudid: string;

    private devices: any[] = [];
    private newDevices: any[] = [];
    private cloudDevices: any[] = [];

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

        this.devices = [...this.devices, ...this.eufyLogin.devices];
        this.newDevices = [...this.newDevices, ...this.eufyLogin.newDevices];
        this.cloudDevices = [...this.cloudDevices, ...this.eufyLogin.cloudDevices];

        return {
            devices: this.devices,
            newDevices: this.devices,
            mqttCredentials: this.eufyLogin.mqttCredentials,
            openudid: this.openudid
        };
    }


}

export class EufyCleanDevice {
    private openudid: string;
    public localConnect: LocalConnect | null = null;
    public cloudConnect: CloudConnect | null = null;

    constructor(deviceConfig: any, deviceType: "localDevice" | "cloudDevice", mqttCredentials?: any) {
        console.log('EufyCleanDevice constructor');

        this.openudid = crypto.randomBytes(16).toString('hex');

        if (deviceType === "localDevice") {
            this.localConnect = new LocalConnect(deviceConfig);
        }

        if (deviceType === "cloudDevice") {
            this.cloudConnect = new CloudConnect(mqttCredentials, deviceConfig, this.openudid);
        }
    }

    getInstance = () => {
        if (this.localConnect) {
            return this.localConnect;
        }

        if (this.cloudConnect) {
            return this.cloudConnect;
        }

        return null;
    }
}

async function main() {

}

main();