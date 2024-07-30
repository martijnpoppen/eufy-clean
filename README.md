# EufyClean Project
## Overview
The EufyClean project provides an interface to interact with Eufy cleaning devices. It includes functionalities to login, pair new devices, and manage cleaning operations through cloud and MQTT connections.

### Installation
1. Clone the repository:
```bash
git clone https://github.com/martijnpoppen/eufy-clean.git
```
2. Navigate to the project directory:
```bash
cd eufy-clean
```
3. Install dependencies:
```bash
yarn
```
<br>

## Usage

### Initialization
To use the EufyClean class, you need to initialize it with your Eufy account credentials.

```js
import { EufyClean } from './src/eufy-clean';

const eufyClean = new EufyClean('your-email@example.com', 'your-password');
await eufyClean.init();
```

### Methods
`init()`

Initializes the EufyClean instance and logs in to the Eufy API.
```js
await eufyClean.init();
```

<br><br>

`getCloudDevices()`
Fetches the list of cloud-connected devices. (These devices are Tuya based)
```js
const cloudDevices = await eufyClean.getCloudDevices();
```

<br><br>

`getMqttDevices()`

Fetches the list of MQTT-connected devices.
```js
const mqttDevices = await eufyClean.getMqttDevices();
```

<br><br>

`getAllDevices()`

Fetches the list of all devices (both cloud and MQTT).
```js
const allDevices = await eufyClean.getAllDevices();
```

`initDevice(deviceConfig)`

Initializes a specific device based on the provided configuration. The device Id can be found with one of the above methods.

```js
const deviceConfig = { deviceId: 'your-device-id' };
const device = await eufyClean.initDevice(deviceConfig);
```

## Example
Here's an example of how to use the EufyClean class in a script:

```js
import { EufyClean } from './eufy-clean';

async function main() {
    const eufyClean = new EufyClean('your-email@example.com', 'your-password');

    await eufyClean.init();

    const allDevices = await eufyClean.getAllDevices();
    console.log(allDevices);

    const deviceConfig = { deviceId: 'your-device-id' };
    const device = await eufyClean.initDevice(deviceConfig);
    
    await device.connect();

    await device.setCleanParam({ cleanType: 'MOP_ONLY', cleanExtent: 'NARROW', mopMode: 'HIGH' });
    
    await device.sceneClean(10);
}

main();
```


## Contact
For any questions or issues, please open an issue on the GitHub repository.

---
<br> 
<b>Happy Cleaning! 🧹✨</b>