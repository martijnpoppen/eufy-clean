"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EufyLogin = void 0;
const EufyApi_1 = require("../api/EufyApi");
const TuyaCloudApi_1 = require("../api/TuyaCloudApi");
const Base_1 = require("./Base");
class EufyLogin extends Base_1.Base {
    tuyaApi = null;
    eufyApi;
    username;
    password;
    sid;
    mqttCredentials;
    cloudDevices = [];
    mqttDevices = [];
    eufyApiDevices = [];
    constructor(username, password, openudid) {
        super();
        this.username = username;
        this.password = password;
        this.eufyApi = new EufyApi_1.EufyApi(username, password, openudid);
    }
    async init() {
        await this.login({ mqtt: true, tuya: true });
        return await this.getDevices();
    }
    async login(config) {
        let eufyLogin = null;
        if (config.mqtt) {
            eufyLogin = await this.eufyApi.login();
        }
        else {
            eufyLogin = await this.eufyApi.sofLogin();
        }
        if (eufyLogin) {
            if (config.mqtt) {
                this.mqttCredentials = eufyLogin.mqtt;
            }
            if (config.tuya) {
                try {
                    this.tuyaApi = new TuyaCloudApi_1.TuyaCloudApi(this.username, this.password, eufyLogin.session.user_id, 'EU');
                    this.sid = await this.tuyaApi.login();
                    console.log('TuyaCloudApi EU login successful');
                }
                catch (error) {
                    console.error('TuyaCloudApi EU login failed');
                    console.error(error);
                    try {
                        this.tuyaApi = new TuyaCloudApi_1.TuyaCloudApi(this.username, this.password, eufyLogin.session.user_id, 'US');
                        this.sid = await this.tuyaApi.login();
                        console.log('TuyaCloudApi US login successful');
                    }
                    catch (error) {
                        console.error('TuyaCloudApi US login failed');
                        console.error(error);
                    }
                }
            }
        }
    }
    async checkLogin() {
        if (!this.sid) {
            await this.login({ mqtt: true, tuya: true });
        }
    }
    async getDevices() {
        // // Get all devices from the Eufy Cloud API. 
        try {
            this.eufyApiDevices = await this.eufyApi.getCloudDeviceList();
        }
        catch (error) {
            this.eufyApiDevices = [];
        }
        if (this.sid) {
            try {
                this.cloudDevices = await this.tuyaApi.getDeviceList();
                this.cloudDevices = this.cloudDevices.map(device => ({
                    ...this.findModel(device.devId),
                    localKey: device.localKey,
                    productId: device.productId,
                    ip: device.ip,
                    apiType: this.checkApiType(device.dps),
                    mqtt: false,
                    dps: device?.dps || {}
                }));
            }
            catch (error) {
                this.cloudDevices = [];
            }
        }
        // Devices like the X10 are not supported by the Tuya Cloud API
        try {
            this.mqttDevices = await this.eufyApi.getDeviceList();
            this.mqttDevices = this.mqttDevices.map(device => ({
                ...this.findModel(device.device_sn),
                apiType: this.checkApiType(device.dps),
                matter: !!device?.is_integrated || false,
                mqtt: true,
                dps: device?.dps || {}
            }));
            this.mqttDevices = this.mqttDevices.filter(device => !device.invalid);
        }
        catch (error) {
            this.mqttDevices = [];
        }
    }
    async getCloudDevice(deviceId) {
        try {
            await this.checkLogin();
            return await this.tuyaApi.getDevice(deviceId);
        }
        catch (error) {
            this.sid = null;
            throw new Error(error);
        }
    }
    async sendCloudCommand(deviceId, dps) {
        try {
            await this.checkLogin();
            return await this.tuyaApi.sendCommand(deviceId, dps);
        }
        catch (error) {
            this.sid = null;
            throw new Error(error);
        }
    }
    async getMqttDevice(deviceId) {
        return await this.eufyApi.getDeviceList(deviceId);
    }
    checkApiType(dps) {
        if (Object.values(this.novelDPSMap).some(k => k in dps)) {
            return 'novel';
        }
        return 'legacy';
    }
    findModel(deviceId) {
        const device = this.eufyApiDevices.find(d => d.id === deviceId);
        if (device) {
            return {
                deviceId,
                deviceModel: device?.product?.product_code?.substring(0, 5) || device?.device_model.substring(0, 5),
                deviceName: device.alias_name || device.device_name || device.name,
                deviceModelName: device?.product?.name,
                invalid: false
            };
        }
        return { deviceId, deviceModel: '', deviceName: '', deviceModelName: '', invalid: true };
    }
}
exports.EufyLogin = EufyLogin;
