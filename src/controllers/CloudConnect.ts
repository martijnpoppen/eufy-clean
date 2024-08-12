import { EufyLogin } from '../controllers/Login';
import { SharedConnect } from './SharedConnect';

export class CloudConnect extends SharedConnect {
    private autoUpdate: number;

    private eufyCleanApi: EufyLogin;

    constructor(config: { deviceId: string, deviceModel?: string, autoUpdate?: number, debug?: boolean }, eufyCleanApi: EufyLogin) {
        super(config);

        this.deviceId = config.deviceId;
        this.deviceModel = config.deviceModel || '';
        this.config = config;

        this.autoUpdate = config.autoUpdate || 0;
        this.debugLog = config.debug || false;
        this.eufyCleanApi = eufyCleanApi;
    }

    async connect() {
        await this.updateDevice(true);
    }

    async updateDevice(checkApiType = false) {
        try {
            const device = await this.eufyCleanApi.getCloudDevice(this.deviceId);

            if (checkApiType) {
                await this.checkApiType(device?.dps);
            }

            await this.mapData(device?.dps)
        } catch (error) {
            console.log(error)
        }
    }

    async sendCommand(data: { [key: string]: string | number | boolean; }): Promise<void> {
        try {
            await this.eufyCleanApi.sendCloudCommand(this.deviceId, data);
        } catch (error) {
            console.log(error)
        }
    }
}
