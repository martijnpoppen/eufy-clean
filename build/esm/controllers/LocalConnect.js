"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalConnect = void 0;
const utils_1 = require("../lib/utils");
const SharedConnect_1 = require("./SharedConnect");
const tuyapi_1 = __importDefault(require("tuyapi"));
const PROBE_DPS = [
    2, 5, 15, 101, 103, 104, 106, 109, 110, 111, 116, 117, 124, 125, 126, 135, 142,
    151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163,
    164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180
];
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
        this.connected = false;
    }
    async setupApi(config) {
        this.api = new tuyapi_1.default({
            id: config.deviceId,
            key: config.localKey,
            ip: config.ip,
            port: 6668,
            version: config.version || '3.3',
            issueRefreshOnConnect: true
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
            await (0, utils_1.sleep)(500);
            console.log('Connecting...');
            await this.connectWithFallback();
        }
        await this.refreshDeviceState();
        setTimeout(() => {
            this.formatStatus();
        }, 2000);
    }
    async disconnect() {
        console.log('Disconnecting...');
        if (this.api) {
            await this.api.disconnect();
        }
    }
    async updateDevice() {
        try {
            await this.refreshDeviceState();
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
    getResolvedIp() {
        return this.api?.device?.ip || this.config?.ip;
    }
    async connectWithFallback() {
        try {
            if (!this.config.ip) {
                await this.findDevice();
            }
            await this.api.connect();
            this.config.ip = this.getResolvedIp() || this.config.ip;
        }
        catch (error) {
            if (!this.config.ip) {
                throw error;
            }
            console.warn('Direct local connection failed, retrying with discovery.', error);
            this.connected = false;
            await this.findDevice(true);
            await this.api.connect();
            this.config.ip = this.getResolvedIp() || this.config.ip;
        }
    }
    async findDevice(force = false) {
        if (force) {
            this.api.device && (this.api.device.ip = undefined);
            this.config.ip = undefined;
        }
        const foundDevice = await this.api.find({
            timeout: this.config.findTimeoutSeconds || 10
        });
        const resolvedIp = foundDevice?.ip || this.api?.device?.ip;
        if (resolvedIp) {
            this.config.ip = resolvedIp;
        }
    }
    async refreshDeviceState() {
        const basePayload = await this.api?.get({ schema: true }).catch(() => undefined);
        if (basePayload?.dps) {
            await this.onUpdate(basePayload.dps);
        }
        const refreshPayload = await this.api?.refresh({
            schema: true,
            requestedDPS: PROBE_DPS
        }).catch(() => undefined);
        if (refreshPayload?.dps) {
            await this.onUpdate(refreshPayload.dps);
        }
    }
}
exports.LocalConnect = LocalConnect;
