import TuyaCloud from '../lib/TuyaCloud.js';

export class TuyaCloudApi {
    private tuyaCloud: any;
    private username: string;
    private password: string;
    private userId: string;

    constructor(username: string, password: string, userId: string) {
        this.username = username;
        this.password = password;
        this.userId = userId;

        this.tuyaCloud = new TuyaCloud({
            key: 'yx5v9uc3ef9wg3v9atje',
            secret: 's8x78u7xwymasd9kqa7a73pjhxqsedaj',
            secret2: 'cepev5pfnhua4dkqkdpmnrdxx378mpjr',
            certSign: 'A',
            apiEtVersion: '0.0.1',
            region: 'EU',
            ttid: 'android',
        });
    }

    public async login(): Promise<string> {
        return await this.tuyaCloud
            .loginEx({
                email: this.username,
                password: this.password,
                uid: this.userId,
                returnFullLoginResponse: 'false',
            })
            .catch((error: any) => {
                console.error(error);
                console.error('Login failed');
            });
    }

    public async getDeviceList(): Promise<any> {
        const groups = await this.tuyaCloud.request({ action: 'tuya.m.location.list' });
        for (const group of groups) {
            console.debug(`Group: ${group.name} (${group.groupId})`, group);
            
            const devices = await this.tuyaCloud.request({ action: 'tuya.m.my.group.device.list', gid: group.groupId });
            const sharedDevices = await this.tuyaCloud.request({ action: 'tuya.m.my.shared.device.list' });
            
            console.info(`Found ${devices.length} devices and ${sharedDevices.length} sharedDevices via Tuya Cloud`);

            return [...devices, ...sharedDevices];
        }
    }

    public async getDevice(deviceId: string): Promise<any> {
        const groups = await this.tuyaCloud.request({ action: 'tuya.m.location.list' });
        for (const group of groups) {            
            const devices = await this.tuyaCloud.request({ action: 'tuya.m.my.group.device.list', gid: group.groupId });
            const sharedDevices = await this.tuyaCloud.request({ action: 'tuya.m.my.shared.device.list' });

            
            console.info(`Found ${devices.length} devices and ${sharedDevices.length} sharedDevices via Tuya Cloud`);
            
            return [...devices, ...sharedDevices].find((device) => device.devId === deviceId);
        }
    }
}