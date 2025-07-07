"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaCloudApi = void 0;
const TuyaCloud_1 = __importDefault(require("../lib/TuyaCloud"));
class TuyaCloudApi {
    tuyaCloud;
    username;
    password;
    userId;
    constructor(username, password, userId, region) {
        this.username = username;
        this.password = password;
        this.userId = userId;
        console.log('TuyaCloudApi', { region });
        this.tuyaCloud = new TuyaCloud_1.default({
            key: 'yx5v9uc3ef9wg3v9atje',
            secret: 's8x78u7xwymasd9kqa7a73pjhxqsedaj',
            secret2: 'cepev5pfnhua4dkqkdpmnrdxx378mpjr',
            certSign: 'A',
            apiEtVersion: '0.0.1',
            region,
            ttid: 'android',
        });
    }
    async login() {
        return await this.tuyaCloud
            .loginEx({
            email: this.username,
            password: this.password,
            uid: this.userId,
            returnFullLoginResponse: 'false',
        });
    }
    async getDeviceList() {
        const groups = await this.tuyaCloud.request({ action: 'tuya.m.location.list' });
        for (const group of groups) {
            // console.debug(`Group: ${group.name} (${group.groupId})`, group);
            const devices = await this.tuyaCloud.request({ action: 'tuya.m.my.group.device.list', gid: group.groupId });
            const sharedDevices = await this.tuyaCloud.request({ action: 'tuya.m.my.shared.device.list' });
            console.debug(`Found ${devices.length} devices and ${sharedDevices.length} sharedDevices via Tuya Cloud`);
            return [...devices, ...sharedDevices];
        }
    }
    async getDevice(deviceId) {
        const groups = await this.tuyaCloud.request({ action: 'tuya.m.location.list' });
        for (const group of groups) {
            const devices = await this.tuyaCloud.request({ action: 'tuya.m.my.group.device.list', gid: group.groupId });
            const sharedDevices = await this.tuyaCloud.request({ action: 'tuya.m.my.shared.device.list' });
            return [...devices, ...sharedDevices].find((device) => device.devId === deviceId);
        }
    }
    async sendCommand(deviceId, dps) {
        console.debug(`Sending command to device ${deviceId}`, { action: 'tuya.m.device.dp.publish', deviceID: deviceId, data: dps });
        await this.tuyaCloud.request({ action: 'tuya.m.device.dp.publish', deviceID: deviceId, data: { dps, devId: deviceId, gwId: deviceId } });
    }
}
exports.TuyaCloudApi = TuyaCloudApi;
