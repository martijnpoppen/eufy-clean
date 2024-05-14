const protobuf = require('protobufjs');
const path = require('path');

export const sleep = async (ms: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

export const getProtoFile = function (proto) {
    const root = new protobuf.Root();
    root.resolvePath = (origin, target) => {
      if(origin.length) {
        return path.resolve(__dirname, `${target}`);
      }
    
      return target
      
    }
    return root.loadSync(proto);
}

export const getData = async function (proto, type, base64Value) {
    const root = await getProtoFile(proto);

    const protoLookupType = root.lookupType(type);
    const buffer = Buffer.from(base64Value, 'base64');

    const decodedMessage = protoLookupType.decodeDelimited(buffer);

    // Convert the decoded message to a plain JavaScript object
    const decodedObject = protoLookupType.toObject(decodedMessage, {
        longs: String, // Long objects will be converted to strings
        enums: String, // Enum values will be converted to strings
        bytes: String // Bytes will be converted to base64 strings
    });

    return decodedObject;
};

// export const getMultiData = async function (proto, type, base64Value) {
//     const root = await getProtoFile(proto);

//     const protoLookupType = root.lookupType(type);
//     const buffer = Buffer.from(base64Value, 'base64');
//     const values = [];

//     if(protoLookupType.fields) {
//         const fieldKeys = Object.values(protoLookupType.fields).map((field) => field?.type);

//         fieldKeys.forEach((fieldKey) => {
//             try {
//                 const field = root.lookupType(fieldKey);
//                 const decodedMessage = field.decodeDelimited(buffer);
//                 const decodedObject = field.toObject(decodedMessage, {
//                     longs: String, // Long objects will be converted to strings
//                     enums: String, // Enum values will be converted to strings
//                     bytes: String // Bytes will be converted to base64 strings
//                 });

//                 values.push({key: fieldKey, ...decodedObject});
//             } catch (e) {
//                 // console.log('error', e);
//             }
//         });
//     }

//     return values;

// }