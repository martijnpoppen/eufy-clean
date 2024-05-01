import mqtt from 'mqtt';

export class EufyMqtt {
    private mqttClient: any;
    private mqttCredentials: any;
    private openudid: string;
    private deviceArray: any;
    private dataPoints: any = {};


    constructor(mqttCredentials: any, openudid: string, deviceArray: any) {
        console.log('EufyClean constructor');
        this.mqttCredentials = mqttCredentials;
        this.openudid = openudid;
        this.deviceArray = deviceArray;
    }

    async connectMqtt() {
        if (this.mqttClient) {
            this.mqttClient.end();
        }

        this.mqttClient = mqtt.connect('mqtt://' + this.mqttCredentials.endpoint_addr, {
            clientId: `android-${this.mqttCredentials.app_name}-eufy_android_${this.openudid}_${this.mqttCredentials.user_id
                }-${Date.now()}`,
            username: this.mqttCredentials.thing_name,
            cert: Buffer.from(this.mqttCredentials.certificate_pem, 'utf8'),
            key: Buffer.from(this.mqttCredentials.private_key, 'utf8'),
        });

        this.mqttClient.on('connect', () => {
           console.info('Connected to MQTT');
            for (const device of this.deviceArray) {
               console.debug(`Subscribe to cmd/eufy_home/${device.device_model}/${device.id}/res`);
                this.mqttClient && this.mqttClient.subscribe(`cmd/eufy_home/${device.device_model}/${device.id}/res`);
            }
        });
        
        this.mqttClient.on('message', (topic, message) => {
            /* Example response
            {
        "head": {
          "version": "1.0.0.1",
          "client_id": "XXXXXX",
          "sess_id": "1368-7091",
          "msg_seq": 1104,
          "cmd": 65537,
          "cmd_status": 1,
          "sign_code": 0,
          "seed": "null",
          "timestamp": 1713685571
        },
        "payload": {
          "protocol": 1,
          "t": 1713685571042,
          "account_id": "XXXXXX",
          "device_sn": "XXXXXXX",
          "data": { "168": "JQojCgIIAxICCAMaAggDIgIIAyoCCAMyAggCoAHgu76zqP6O5Bc=" }
        }
      }
      */
           console.debug(`Received message on ${topic}: ${message.toString()}`);
            const messageParsed = JSON.parse(message.toString());
            const device = this.deviceArray.find((device) => device.id === messageParsed.payload.device_sn);
            if (!device) {
               console.error(`Device not found for ${messageParsed.payload.device_sn}`);
                return;
            }
            const data = messageParsed.payload.data;
            if (this.dataPoints[device.model]) {
                for (const dataPoint of Object.keys(data)) {
                    const dataPointFound = this.dataPoints[device.model].find((dp) => dp.dp_id === parseInt(dataPoint));
                    if (dataPointFound) {
                        let value = data[dataPoint];
                        if (dataPointFound.data_type === 'String') {
                            value = Buffer.from(data[dataPoint], 'base64').toString('utf8');
                        }
                        if (dataPointFound.data_type === 'Raw') {
                            value = Buffer.from(data[dataPoint], 'base64').toString('hex');
                        }
                       console.debug(`Found ${dataPointFound.code} with value ${value}`);
                        console.log(device.id + '.dps.' + dataPoint, value, true);
                    } else {
                        console.log(device.id + '.dps.' + dataPoint, data[dataPoint], true);
                    }
                }
            }
        });
        this.mqttClient.on('error', (error) => {
           console.error(`MQTT Error: ${error}`);
        });
        this.mqttClient.on('close', () => {
           console.error('MQTT Connection closed');
        });
        this.mqttClient.on('reconnect', () => {
           console.info('MQTT Reconnect');
        });
        this.mqttClient.on('offline', () => {
           console.error('MQTT Offline');
        });
        this.mqttClient.on('end', () => {
           console.info('MQTT End');
        });
    }
}