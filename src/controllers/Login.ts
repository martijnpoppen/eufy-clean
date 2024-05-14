import { EufyApi } from '../api/EufyApi';
import { TuyaCloudApi } from '../api/TuyaCloudApi';

// import { EufyLocal }

export class EufyLogin {
    private tuyaApi: TuyaCloudApi | null = null;
    private eufyApi: EufyApi;
    

    private username: string;
    private password: string;

    private sid: string;
    public mqttCredentials: any;

    public devices: string[];
    public newDevices: string[];
    public cloudDevices: string[];

    constructor(username: string, password: string, openudid: string) {
        console.log('Login constructor');

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

    public async getDevices(): Promise<any> {
        if (this.sid) {
            console.log('Login successful');
            this.devices = await this.tuyaApi.getDeviceList();

            // Devices like the X10 are not supported by the Tuya Cloud API
            this.newDevices = await this.eufyApi.getDeviceList();


            // Get all devices from the Eufy Cloud API. 
            // Currently we don't need it, but it could be useful in the future.
            this.cloudDevices = await this.eufyApi.getCloudDeviceList();            

            console.log('devices', this.devices);   
            console.log('newDevices', this.newDevices);
        }
    }
}