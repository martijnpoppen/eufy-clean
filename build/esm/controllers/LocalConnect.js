"use strict";
// Communication with the Local Tuya API
// This is only supported for "old" devices like the RoboVac G30
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalConnect = void 0;
// As of july 2024 this is not used in the main codebase, but it's here for reference
const utils_1 = require("../lib/utils");
const SharedConnect_1 = require("./SharedConnect");
const tuyapi_1 = __importDefault(require("tuyapi"));
class LocalConnect extends SharedConnect_1.SharedConnect {
    api;
    didCheckApiType;
    connected;
    constructor(config) {
        super(config);
        this.deviceId = config.deviceId;
        this.deviceModel = config.deviceModel || '';
        this.config = config;
        this.debugLog = config.debug || false;
        this.didCheckApiType = false;
    }
    async setupApi(config) {
        this.api = new tuyapi_1.default({
            id: config.deviceId,
            key: config.localKey,
            ip: config.ip,
            port: 6668,
            version: '3.3'
        });
        this.api.on('error', (error) => {
            console.error('Robovac Error', error);
        });
        this.api.on('connected', () => {
            this.connected = true;
            console.log("Connected!");
        });
        this.api.on('disconnected', () => {
            this.connected = false;
            console.log('Disconnected!');
        });
        this.api.on('dp-refresh', data => {
            this.onUpdate(data.dps);
        });
        this.api.on('data', (data) => {
            this.onUpdate(data.dps);
        });
    }
    async onUpdate(dps) {
        if (!this.didCheckApiType) {
            this.didCheckApiType = true;
            await this.checkApiType(dps);
        }
        this.mapData(dps);
    }
    async connect() {
        if (!this.connected) {
            await this.setupApi(this.config);
            await (0, utils_1.sleep)(2000);
            console.log('Connecting...');
            await this.api.connect().catch(error => {
                console.log(error);
                console.error(`Failed to connect to device please close the app or check your network. Please allow port 6668 via TCP from the device IP. ${error}`);
            });
        }
        await this.api.refresh({ schema: true });
        setTimeout(() => {
            this.formatStatus();
        }, 2000);
    }
    async disconnect() {
        console.log('Disconnecting...');
        await this.api.disconnect();
    }
    async updateDevice() {
        try {
            await this.api?.refresh({ schema: true });
        }
        catch (error) {
            console.log(error);
        }
    }
    async sendCommand(data) {
        if (this.debugLog) {
            console.log(`Setting: ${JSON.stringify(data, null, 4)}`);
        }
        return await this.api.set({
            multiple: true,
            data: data
        });
    }
}
exports.LocalConnect = LocalConnect;
