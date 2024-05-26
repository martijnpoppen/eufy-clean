import { EufyLogin } from '../controllers/Login';
import { SharedConnect } from './SharedConnect';

export class CloudConnect extends SharedConnect {
    private autoUpdate: number;

    private eufyAPi: EufyLogin;

    constructor(config: { username: string, password: string, deviceId: string, deviceModel?: string, autoUpdate?: number, debug?: boolean }, openudid: string) {
        super(config);

        this.eufyAPi = new EufyLogin(config.username, config.password, openudid);
        this.deviceId = config.deviceId;
        this.deviceModel = config.deviceModel || '';

        this.autoUpdate = config.autoUpdate || 0;
        this.debugLog = config.debug || false;
    }

    async connect() {
        await this.eufyAPi.login({ mqtt: false, tuya: true });
        await this.updateDevice(true);
    }

    async updateDevice(checkApiType = false) {
        try {
            const device = await this.eufyAPi.getCloudDevice(this.deviceId);

            if (checkApiType) {
                await this.checkApiType(device?.dps);
            }

            await this.mapData(device?.dps)

            if (this.autoUpdate > 0) {
                this.recursiveUpdate(this.autoUpdate);
            }
        } catch (error) {
            console.log(error)
        }
    }

    async sendCommand(data: { [key: string]: string | number | boolean; }): Promise<void> {
        try {
            await this.eufyAPi.sendCloudCommand(this.deviceId, data);
        } catch (error) {
            console.log(error)
        }
    }
}
