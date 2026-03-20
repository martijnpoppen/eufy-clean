import { sleep } from '../lib/utils';
import { SharedConnect } from './SharedConnect';
import TuyAPI from 'tuyapi';

const PROBE_DPS = [
    2, 5, 15, 101, 103, 104, 106, 109, 110, 111, 116, 117, 124, 125, 126, 135, 142,
    151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163,
    164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180
];

export class LocalConnect extends SharedConnect {
    public api: any;
    private didCheckApiType: boolean;
    private connected: boolean;

    constructor(config: { deviceId: string, localKey?: string, ip?: string, version?: string, mapId?: number, findTimeoutSeconds?: number, debug?: boolean, deviceModel?: string }) {
        super(config);

        this.deviceId = config.deviceId;
        this.deviceModel = config.deviceModel || '';
        this.config = config;
        this.debugLog = config.debug || false;
        this.didCheckApiType = false;
        this.connected = false;
    }

    async setupApi(config) {
        this.api = new TuyAPI(
            {
                id: config.deviceId,
                key: config.localKey,
                ip: config.ip,
                port: 6668,
                version: config.version || '3.3',
                issueRefreshOnConnect: true
            }
        );

        this.api.on('error', (error: any) => {
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

        this.mapData(dps)
    }

    async connect() {
        if (!this.connected) {
            await this.setupApi(this.config);
            await sleep(500);

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
        } catch (error) {
            console.log(error)
        }
    }

    async sendCommand(data: { [key: string]: string | number | boolean }) {
        if (this.debugLog) {
            console.log(`Setting: ${JSON.stringify(data, null, 4)}`);
        }

        return await this.api.set({
            multiple: true,
            data: data
        });
    }

    getResolvedIp(): string | undefined {
        return this.api?.device?.ip || this.config?.ip;
    }

    private async connectWithFallback() {
        try {
            if (!this.config.ip) {
                await this.findDevice();
            }

            await this.api.connect();
            this.config.ip = this.getResolvedIp() || this.config.ip;
        } catch (error) {
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

    private async findDevice(force = false) {
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

    private async refreshDeviceState() {
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
