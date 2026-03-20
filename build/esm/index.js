"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EufyClean = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Login_1 = require("./controllers/Login");
const LocalConnect_1 = require("./controllers/LocalConnect");
const CloudConnect_1 = require("./controllers/CloudConnect");
const MqttConnect_1 = require("./controllers/MqttConnect");
class EufyClean {
    eufyCleanApi;
    openudid;
    username;
    password;
    // if the deviceconfig and mqttCredentials are provided the connection will be automatically setup
    constructor(username, password) {
        console.log('EufyClean constructor');
        this.username = username;
        this.password = password;
        this.openudid = crypto_1.default.randomBytes(16).toString('hex');
    }
    // Use this method to login and pair new devices.
    async init() {
        console.log('EufyClean init');
        this.eufyCleanApi = new Login_1.EufyLogin(this.username, this.password, this.openudid);
        await this.eufyCleanApi.init();
        return {
            cloudDevices: this.eufyCleanApi.cloudDevices,
            mqttDevices: this.eufyCleanApi.mqttDevices,
            eufyApiDevices: this.eufyCleanApi.eufyApiDevices
        };
    }
    async getCloudDevices() {
        return this.eufyCleanApi.cloudDevices;
    }
    async getMqttDevices() {
        return this.eufyCleanApi.mqttDevices;
    }
    async getAllDevices() {
        return [...this.eufyCleanApi.cloudDevices, ...this.eufyCleanApi.mqttDevices];
    }
    async initDevice(deviceConfig) {
        if ('localKey' in deviceConfig && deviceConfig.localKey) {
            return new LocalConnect_1.LocalConnect(deviceConfig);
        }
        // Local connection doesn't require this check
        const devices = await this.getAllDevices();
        const device = devices.find(d => d.deviceId === deviceConfig.deviceId);
        if (!device) {
            return null;
        }
        if (!('localKey' in deviceConfig) && !device.mqtt) {
            return new CloudConnect_1.CloudConnect({ ...device, debug: deviceConfig.debug }, this.eufyCleanApi);
        }
        if (!('localKey' in deviceConfig) && device.mqtt) {
            return new MqttConnect_1.MqttConnect({ ...device, debug: deviceConfig.debug }, this.openudid, this.eufyCleanApi);
        }
    }
}
exports.EufyClean = EufyClean;
__exportStar(require("./constants"), exports);
