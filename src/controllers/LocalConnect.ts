// Communication with the Local Tuya API
// This is only supported for "old" devices like the RoboVac G30

// As of july 2024 this is not used in the main codebase, but it's here for reference
import { sleep } from '../lib/utils';
import { SharedConnect } from './SharedConnect';
import TuyAPI from 'tuyapi';

export class LocalConnect extends SharedConnect {
    public api: any;
    private didCheckApiType: boolean;
    private connected: boolean

    constructor(config: { deviceId: string, localKey?: string, ip?: string, debug?: boolean, deviceModel?: string }) {
        super(config);

        this.deviceId = config.deviceId;
        this.deviceModel = config.deviceModel || '';
        this.config = config;
        this.debugLog = config.debug || false;
        this.didCheckApiType = false;
    }

    async setupApi(config) {
        this.api = new TuyAPI(
            {
                id: config.deviceId,
                key: config.localKey,
                ip: config.ip,
                port: 6668,
                version: '3.3'
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
        if(!this.didCheckApiType) {
            this.didCheckApiType = true;
            await this.checkApiType(dps);
        }
        
        this.mapData(dps)
    }

    async connect() {
        if (!this.connected) {
            await this.setupApi(this.config);
            await sleep(2000);

            console.log('Connecting...');

            await this.api.connect().catch(error => {
                console.log(error)
                console.error(
                    `Failed to connect to device please close the app or check your network. Please allow port 6668 via TCP from the device IP. ${error}`,
                );
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
}
