import { EufyApi } from '../api/EufyApi';
import { TuyaCloudApi } from '../api/TuyaCloudApi';
import { Base } from './Base';

export class EufyLogin extends Base {
    private tuyaApi: TuyaCloudApi | null = null;
    private eufyApi: EufyApi;

    private username: string;
    private password: string;

    private sid: string;
    public mqttCredentials: any;

    public cloudDevices: any[] = [];
    public mqttDevices: any[] = [];
    public eufyApiDevices: any[] = [];

    constructor(username: string, password: string, openudid: string) {
        super();

        this.username = username;
        this.password = password;
        this.eufyApi = new EufyApi(username, password, openudid);
    }

    public async init(): Promise<void> {
        await this.login();
        await this.getDevices();
    }

    public async login(): Promise<void> {
        const eufyLogin = await this.eufyApi.login();

        if (eufyLogin) {
            console.log('Eufy login successful');

            this.mqttCredentials = eufyLogin.mqtt;

            this.tuyaApi = new TuyaCloudApi(this.username, this.password, this.eufyApi.session.user_id);
            this.sid = await this.tuyaApi.login();
        }
    }

    public async softLogin(): Promise<void> {
        const eufyLogin = await this.eufyApi.sofLogin();

        if (eufyLogin) {
            console.log('Eufy login successful');

            this.tuyaApi = new TuyaCloudApi(this.username, this.password, this.eufyApi.session.user_id);
            this.sid = await this.tuyaApi.login();
        }
    }

    public async checkLogin(): Promise<void> {
        if(!this.sid) {
            throw new Error("Not logged in");
        }
    }

    public async getDevices(): Promise<any> {
        if (this.sid) {
            console.log('Login successful');
            this.cloudDevices = await this.tuyaApi.getDeviceList();
            this.cloudDevices = this.cloudDevices.map(device => ({
                ...device,
                apiType: this.checkApiType(device.dps)
            }));

            // Devices like the X10 are not supported by the Tuya Cloud API
            this.mqttDevices = await this.eufyApi.getDeviceList();


            // Get all devices from the Eufy Cloud API. 
            // Currently we don't need it, but it could be useful in the future.
            this.eufyApiDevices = await this.eufyApi.getCloudDeviceList();
        }
    }

    public async getCloudDevice(deviceId: string): Promise<any> {
        try {
            await this.checkLogin();
            return await this.tuyaApi.getDevice(deviceId);
        } catch (error) {
            throw new Error(error);
            
        }
    }

    public async sendCloudCommand(deviceId: string, dps: any): Promise<any> {
        try {
            await this.checkLogin();
            return await this.tuyaApi.sendCommand(deviceId, dps);
        } catch (error) {
            throw new Error(error);
        }
    }

    public async getMqttDevice(deviceId: string): Promise<any> {
        this.mqttDevices = await this.eufyApi.getDeviceList();

        return this.mqttDevices.find(device => device.devId === deviceId);
    }

    private checkApiType(dps) {
        if (Object.values(this.novelDPSMap).some(k => k in dps)) {
            return 'novel'
        }

        return 'legacy'
    }
}