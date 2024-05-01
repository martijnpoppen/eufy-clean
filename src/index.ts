import { EufyLogin } from './Login';
import { EufyMqtt } from './api/EufyMqtt';
import crypto, { createECDH } from 'crypto';
import { sleep, decryptAPIData } from './lib/utils';

export class EufyClean {
    private eufyMqtt: EufyMqtt | null = null;
    private eufyLogin: EufyLogin;
    private ecdh = createECDH("prime256v1");
    private readonly SERVER_PUBLIC_KEY = "04c5c00c4f8d1197cc7c3167c52bf7acb054d722f0ef08dcd7e0883236e0d72a3868d9750cb47fa4619248f3d83f0f662671dadc6e2d31c2f41db0161651c7c076";
    private openudid: string;

    private devices: any[] = [];
    private newDevices: any[] = [];

    mqttCredentials: any;

    // if the deviceconfig and mqttCredentials are provided the connection will be automatically setup
    constructor(deviceConfig?: any, deviceType?: "device" | "newDevice", mqttCredentials?: any) {
        console.log('EufyClean constructor');

        this.openudid = crypto.randomBytes(16).toString('hex');

        if (deviceConfig && deviceType === "device") {
            this.devices.push(deviceConfig);
            // this.setupLocal();
        }

        if (deviceConfig && deviceType === "newDevice") {
            this.newDevices.push(deviceConfig);

            this.setupMqtt();
        }
    }

    // Use this method to login and pair new devices.
    public async login(username, password): Promise<void> {
        console.log('EufyClean init');

        this.eufyLogin = new EufyLogin(username, password, this.openudid);

        await this.eufyLogin.init();

        this.devices = [...this.devices, ...this.eufyLogin.devices];
        this.newDevices = [...this.newDevices, ...this.eufyLogin.newDevices];

        this.mqttCredentials = this.eufyLogin.mqttCredentials;

        // await this.setupLegacy();
        // await this.setupNew();
        this.setupMqtt();
    }

    public async setupMqtt(): Promise<void> {
        if (this.mqttCredentials) {
            console.info('MQTT Credentials found');
            console.info('Setup MQTT Connection');
            this.eufyMqtt = new EufyMqtt(this.mqttCredentials, this.openudid, this.newDevices);
            await this.eufyMqtt.connectMqtt();
        }
    }
}

new EufyClean().login();