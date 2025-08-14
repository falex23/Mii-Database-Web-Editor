const textDecoder = new TextDecoder('utf-16be');

/**
 * Parses a 779968-byte database file buffer and extracts the list of 100 Miis.
 * @param {ArrayBuffer} fileBuffer The raw buffer from the loaded .dat file.
 * @returns {Uint8Array[] | null} An array of 100 Mii data blocks (74 bytes each), or null on error.
 */
export function parseDatabase(fileBuffer) {
    const fileBytes = new Uint8Array(fileBuffer);

    if (fileBytes.length !== 779968) {
        alert(`Incorrect file size. Expected: 779968 bytes, got: ${fileBytes.length}`);
        return null;
    }

    const header = fileBytes.slice(0, 4);
    if (header[0] !== 0x52 || header[1] !== 0x4E || header[2] !== 0x4F || header[3] !== 0x44) {
        alert("Invalid file header. This does not appear to be a valid Mii database file.");
        return null;
    }

    const miiDataBlock = fileBytes.slice(4, 4 + 7400);
    const miiList = [];
    for (let i = 0; i < 100; i++) {
        miiList.push(miiDataBlock.slice(i * 74, (i * 74) + 74));
    }
    return miiList;
}

/**
 * Checks if a 74-byte data block represents a valid Mii (i.e., is not all zeroes).
 * @param {Uint8Array} miiData 74-byte Mii data.
 * @returns {boolean}
 */
export function isMii(miiData) {
    if (!miiData || miiData.length !== 74) return false;
    return miiData.some(byte => byte !== 0);
}

/**
 * Extracts the Mii's name from its 74-byte data block.
 * @param {Uint8Array} miiData 74-byte Mii data.
 * @returns {string}
 */
export function getMiiName(miiData) {
    if (!isMii(miiData)) return "";
    const nameData = miiData.slice(2, 22);
    let nameLength = 0;
    for (let i = 0; i < 10; i++) {
        if (nameData[i * 2] === 0x00 && nameData[i * 2 + 1] === 0x00) {
            break;
        }
        nameLength++;
    }
    return textDecoder.decode(nameData.slice(0, nameLength * 2));
}

/**
 * Converts a Uint8Array to a hex string.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function uint8ArrayToHexString(bytes) {
    if (!bytes) return "";
    return Array.from(bytes, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('').toUpperCase();
}

/**
 * Creates a new, empty list of 100 Mii data blocks.
 * @returns {Uint8Array[]}
 */
export function generateEmptyMiiList() {
    return Array.from({
        length: 100
    }, () => new Uint8Array(74));
}

/**
 * Builds a complete 779968-byte database file from a list of 100 Miis.
 * @param {Uint8Array[]} miiDataList The list of 100 Miis.
 * @returns {Uint8Array} The complete file as a byte array.
 */
export function buildFile(miiDataList) {
    const newFileBytes = new Uint8Array(779968);

    const repeatBytes = (bytes, count) => {
        const result = new Uint8Array(bytes.length * count);
        for (let i = 0; i < count; i++) {
            result.set(bytes, i * bytes.length);
        }
        return result;
    };

    const hexStringToUint8Array = (hexString) => {
        const cleanHex = hexString.replace(/[\s-]/g, "");
        const bytes = new Uint8Array(cleanHex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
        }
        return bytes;
    };

    let offset = 0;

    // Write file header
    newFileBytes.set(hexStringToUint8Array("524E4F44"), offset);
    offset += 4;

    // Write Mii data
    const combinedMiiData = new Uint8Array(7400);
    miiDataList.forEach((mii, i) => combinedMiiData.set(mii, i * 74));
    newFileBytes.set(combinedMiiData, offset);
    offset += 7400;

    // Static data from original file
    newFileBytes.set(hexStringToUint8Array("80"), offset);
    offset += 1;

    // Skip 19 bytes of "00"
    offset += 19;

    // Write file header for Mii Parade
    newFileBytes.set(hexStringToUint8Array("524E4844FFFFFFFF"), offset);
    offset += 8;

    // Write "00 00 00 00 00 00 00 00 7F FF 7F FF" 10000 times
    // Mii Parade data for storing Mii ID and System ID
    // Example: DE AD BE EF CA FE BA BE 7F FF 7F FF
    newFileBytes.set(repeatBytes(hexStringToUint8Array("00000000000000007FFF7FFF"), 10000), offset);
    offset += 120000;

    // Skip 22 bytes of "00"
    offset += 22;

    // Write CRC16XModem hash
    const dataToHash = newFileBytes.slice(0, 127454);
    const checksum = calculateCRC16XModem(dataToHash);
    newFileBytes.set(checksum, offset);
    offset += 2;

    // The rest of the file is zeroes
    // Mii data for the Mii Parade
    // Maximum amount of Mii Parade entries is unknown
    
    return newFileBytes;
}

const CRC16XModemTable = [
    0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
    0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
    0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
    0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
    0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
    0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
    0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
    0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
    0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
    0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
    0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
    0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
    0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
    0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
    0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
    0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
    0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
    0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
    0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
    0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
    0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
    0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
    0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
    0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
    0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
    0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
    0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
    0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
    0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
    0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
    0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
    0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0,
];

/**
 * Hashes data using 16-bit CRC XModem Protocol.
 * Adapted from https://github.com/gtrafimenkov/pycrc16/blob/master/python3x/crc16/crc16pure.py
 * @param {Uint8Array} data data.
 * @returns {Uint8Array} 16-bit CRC.
 */
function calculateCRC16XModem(data) {
    let crc = 0x0000;
    for (const byte of data) {
        crc = ((crc << 8) & 0xFF00) ^ CRC16XModemTable[((crc >> 8) & 0xFF) ^ (byte & 0xFF)];
    }
    return new Uint8Array([(crc >> 8) & 0xFF, crc & 0xFF]);
}

function bufToUint16BE(data, addr) {
    return (data[addr] << 8) | data[addr + 1];
}

function bufToUint32BE(data, addr) {
    return (data[addr] << 24) | (data[addr + 1] << 16) | (data[addr + 2] << 8) | data[addr + 3];
}

/**
 * Converts Mii into Studio Mii data block.
 * Adapted from https://kazuki-4ys.github.io/web_apps/MiiInfoEditorCTR/mii.js
 * @param {Uint8Array} miiData 74-byte Mii data.
 * @returns {Uint8Array} 46-byte Studio data.
 */
function convertToStudio(miiData) {
    const data = new Uint8Array(46);
    const WRINKLES = [0, 0, 0, 0, 5, 2, 3, 7, 8, 0, 9, 11];
    const MAKEUP = [0, 1, 6, 9, 0, 0, 0, 0, 0, 10, 0, 0];

    let tmpU16 = bufToUint16BE(miiData, 0);
    data[0x16] = (tmpU16 >> 14) & 1;       // isGirl
    data[0x15] = (tmpU16 >> 1) & 0xF;      // favColor
    data[0x1E] = miiData[0x16];            // height
    data[2] = miiData[0x17];               // weight

    tmpU16 = bufToUint16BE(miiData, 0x20);
    data[0x13] = (tmpU16 >> 13);           // faceShape
    data[0x11] = (tmpU16 >> 10) & 7;       // skinColor
    const facialFeature = (tmpU16 >> 6) & 0xF;
    data[0x12] = MAKEUP[facialFeature];    // makeup
    data[0x14] = WRINKLES[facialFeature];  // wrinkles

    tmpU16 = bufToUint16BE(miiData, 0x22);
    data[0x1D] = tmpU16 >> 9;              // hairStyle
    data[0x1B] = (tmpU16 >> 6) & 7;        // hairColor
    if (data[0x1B] === 0) data[0x1B] = 8;
    data[0x1C] = (tmpU16 >> 5) & 1;        // flipHair

    let tmpU32 = bufToUint32BE(miiData, 0x24);
    data[0xE] = (tmpU32 >> 27) & 0x1F;     // eyebrowStyle
    data[0xC] = (tmpU32 >> 22) & 0xF;      // eyebrowRotation
    data[0xB] = (tmpU32 >> 13) & 7;        // eyebrowColor
    if (data[0xB] === 0) data[0xB] = 8;
    data[0xD] = (tmpU32 >> 9) & 0xF;       // eyebrowScale
    data[0xA] = 3;                         // eyebrowYScale
    data[0x10] = (tmpU32 >> 4) & 0x1F;     // eyebrowYPosition
    data[0xF] = tmpU32 & 0xF;              // eyebrowXSpacing

    tmpU32 = bufToUint32BE(miiData, 0x28);
    data[7] = (tmpU32 >> 26) & 0x3F;       // eyeStyle
    data[5] = (tmpU32 >> 21) & 7;          // eyeRotation
    data[9] = (tmpU32 >> 16) & 0x1F;       // eyeYPosition
    data[4] = ((tmpU32 >> 13) & 7) + 8;    // eyeColor
    data[6] = (tmpU32 >> 9) & 7;           // eyeScale
    data[3] = 3;                           // eyeYScale
    data[8] = (tmpU32 >> 5) & 0xF;         // eyeXSpacing

    tmpU16 = bufToUint16BE(miiData, 0x2C);
    data[0x2C] = tmpU16 >> 12;             // noseStyle
    data[0x2B] = (tmpU16 >> 8) & 0xF;      // noseScale
    data[0x2D] = (tmpU16 >> 3) & 0x1F;     // noseYPosition

    tmpU16 = bufToUint16BE(miiData, 0x2E);
    data[0x26] = tmpU16 >> 11;             // mouthStyle
    data[0x24] = ((tmpU16 >> 9) & 3) + 19; // mouthColor
    data[0x25] = (tmpU16 >> 5) & 0xF;      // mouthScale
    data[0x23] = 3;                        // mouthYScale
    data[0x27] = tmpU16 & 0x1F;            // mouthYPosition

    tmpU16 = bufToUint16BE(miiData, 0x30);
    data[0x19] = tmpU16 >> 12;             // glassesStyle
    data[0x17] = (tmpU16 >> 9) & 7;        // glassesColor
    if (data[0x17] === 0) data[0x17] = 8;
    else if (data[0x17] < 6) data[0x17] += 13;
    else data[0x17] = 0;
    data[0x18] = (tmpU16 >> 5) & 7;        // glassesScale
    data[0x1A] = tmpU16 & 0x1F;            // glassesYPosition

    tmpU16 = bufToUint16BE(miiData, 0x32);
    data[0x29] = tmpU16 >> 14;             // mustacheStyle
    data[1] = (tmpU16 >> 12) & 3;          // beardStyle
    data[0] = (tmpU16 >> 9) & 7;           // beardColor
    if (data[0] === 0) data[0] = 8;
    data[0x28] = (tmpU16 >> 5) & 0xF;      // mustacheScale
    data[0x2A] = tmpU16 & 0x1F;            // mustacheYPosition

    tmpU16 = bufToUint16BE(miiData, 0x34);
    data[0x20] = tmpU16 >> 15;             // enableMole
    data[0x1F] = (tmpU16 >> 11) & 0xF;     // moleScale
    data[0x22] = (tmpU16 >> 6) & 0x1F;     // moleYPosition
    data[0x21] = (tmpU16 >> 1) & 0x1F;     // moleXPosition

    return data;
}

export function encodeStudio(miiData) {
        if (!isMii(miiData)) return null;

        const studioData = convertToStudio(miiData);
        let checksum = 0;
        let encoded = checksum.toString(16).padStart(2, '0');
        for (const studioByte of studioData) {
                const encodedByte = (7 + (studioByte ^ checksum)) & 0xFF;
                checksum = encodedByte;
                encoded += encodedByte.toString(16).padStart(2, '0');
        }
        return encoded;
}
