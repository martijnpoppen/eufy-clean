"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMultiData = exports.getFlatData = exports.encode = exports.decode = exports.getProtoFile = exports.sleep = void 0;
const protobuf = require('protobufjs');
const path = require('path');
const sleep = async (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
exports.sleep = sleep;
const getProtoFile = function (proto) {
    const root = new protobuf.Root();
    root.resolvePath = (origin, target) => {
        if (origin.length) {
            return path.resolve(__dirname, `${target}`);
        }
        return path.resolve(__dirname, `${target}`);
    };
    return root.loadSync(proto);
};
exports.getProtoFile = getProtoFile;
const decode = async function (proto, type, base64Value) {
    const root = await (0, exports.getProtoFile)(proto);
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
exports.decode = decode;
const encode = async function (proto, type, object) {
    const root = await (0, exports.getProtoFile)(proto);
    const protoLookupType = root.lookupType(type);
    // Create a new message from the object
    const message = protoLookupType.create(object);
    // Encode the message to a buffer using encodeDelimited
    const buffer = protoLookupType.encodeDelimited(message).finish();
    // Convert the buffer to a base64 string
    return buffer.toString('base64');
};
exports.encode = encode;
const getFlatData = async function (proto, type, number) {
    const root = await (0, exports.getProtoFile)(proto);
    const protoLookupType = root[type];
    const decodedMessage = getKeyByValue(protoLookupType, number);
    return decodedMessage;
};
exports.getFlatData = getFlatData;
const getMultiData = async function (proto, type, base64Value) {
    const root = await (0, exports.getProtoFile)(proto);
    const protoLookupType = root.lookupType(type);
    const buffer = Buffer.from(base64Value, 'base64');
    const values = [];
    if (protoLookupType.fields) {
        // @ts-ignore
        const fieldKeys = Object.values(protoLookupType.fields).map((field) => field?.type);
        fieldKeys.forEach((fieldKey) => {
            try {
                const field = root.lookupType(fieldKey);
                const decodedMessage = field.decodeDelimited(buffer);
                const decodedObject = field.toObject(decodedMessage, {
                    longs: String, // Long objects will be converted to strings
                    enums: String, // Enum values will be converted to strings
                    bytes: String // Bytes will be converted to base64 strings
                });
                values.push({ key: fieldKey, ...decodedObject });
            }
            catch (e) {
                // console.log('error', e);
            }
        });
    }
    return values;
};
exports.getMultiData = getMultiData;
const getKeyByValue = function (object, value) {
    return Object.keys(object).find(key => object[key] === value);
};
