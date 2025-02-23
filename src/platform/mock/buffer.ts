import { isNodeJS } from "../platform";
import { Buffer } from "buffer";
// class BrowserBuffer {
//     private buffer: Uint8Array;

//     constructor(data: ArrayBuffer | Uint8Array | string | number[] | number, encoding?: "utf8") {
//         if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
//             this.buffer = new Uint8Array(data);
//         } else if (typeof data === "string") {
//             const encoder = new TextEncoder();
//             this.buffer = encoder.encode(data);
//         } else if (Array.isArray(data)) {
//             this.buffer = new Uint8Array(data);
//         } else if (typeof data === "number") {
//             this.buffer = new Uint8Array(data);
//         } else {
//             throw new TypeError("Unsupported data type");
//         }
//     }

//     get length(): number {
//         return this.buffer.length;
//     }

//     toString(encoding: "utf8" | "base64" | "hex" = "utf8"): string {
//         switch (encoding) {
//             case "utf8":
//                 return new TextDecoder().decode(this.buffer);
//             case "base64":
//                 return btoa(String.fromCharCode(...this.buffer));
//             case "hex":
//                 return Array.from(this.buffer)
//                     .map(byte => byte.toString(16).padStart(2, "0"))
//                     .join("");
//             default:
//                 throw new Error("Unsupported encoding");
//         }
//     }

//     static concat(buffers: BrowserBuffer[]): BrowserBuffer {
//         let totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
//         let result = new Uint8Array(totalLength);
//         let offset = 0;
//         for (let buf of buffers) {
//             result.set(buf.buffer, offset);
//             offset += buf.length;
//         }
//         return new BrowserBuffer(result);
//     }

//     slice(start: number, end?: number): BrowserBuffer {
//         return new BrowserBuffer(this.buffer.subarray(start, end));
//     }

//     write(string: string, offset: number = 0, length?: number, encoding: "utf8" = "utf8"): number {
//         const encoder = new TextEncoder();
//         const encoded = encoder.encode(string);
//         length = length !== undefined ? Math.min(length, encoded.length) : encoded.length;
//         this.buffer.set(encoded.subarray(0, length), offset);
//         return length;
//     }

//     readUInt32BE(offset: number = 0): number {
//         if (offset + 4 > this.length) {
//             throw new RangeError("Offset is out of bounds");
//         }
//         const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + offset, 4);
//         return view.getUint32(0, false); // false 表示大端序
//     }

//     compare(otherBuffer: BrowserBuffer): number {
//         for (let i = 0; i < Math.min(this.length, otherBuffer.length); i++) {
//             if (this.buffer[i] < otherBuffer.buffer[i]) return -1;
//             if (this.buffer[i] > otherBuffer.buffer[i]) return 1;
//         }
//         return this.length - otherBuffer.length;
//     }

//     copy(targetBuffer: BrowserBuffer, targetStart: number = 0, sourceStart: number = 0, sourceEnd?: number): number {
//         const source = this.buffer.subarray(sourceStart, sourceEnd ?? this.length);
//         targetBuffer.buffer.set(source, targetStart);
//         return source.length;
//     }

//     fill(value: number, start: number = 0, end?: number): this {
//         this.buffer.fill(value, start, end ?? this.length);
//         return this;
//     }

//     toJSON(): { type: "Buffer"; data: number[] } {
//         return {
//             type: "Buffer",
//             data: Array.from(this.buffer)
//         };
//     }

//     static fromJSON(json: { type: "Buffer"; data: number[] }): BrowserBuffer {
//         if (json.type === "Buffer" && Array.isArray(json.data)) {
//             return new BrowserBuffer(json.data);
//         }
//         throw new TypeError("Invalid JSON format");
//     }

//     static fromBase64(base64: string): BrowserBuffer {
//         const binaryString = atob(base64);
//         const buf = new Uint8Array(binaryString.length);
//         for (let i = 0; i < binaryString.length; i++) {
//             buf[i] = binaryString.charCodeAt(i);
//         }
//         return new BrowserBuffer(buf);
//     }

//     static fromHex(hex: string): BrowserBuffer {
//         const buf = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) ?? []);
//         return new BrowserBuffer(buf);
//     }
// }

// // 示例用法
// const buf1 = new BrowserBuffer("hello");
// const buf2 = new BrowserBuffer("world");
// const buf3 = BrowserBuffer.concat([buf1, buf2]);

// console.log(buf3.toString()); // 输出: helloworld
// console.log(buf3.slice(0, 5).toString()); // 输出: hello
// console.log(buf3.toString("base64")); // 输出: aGVsbG93b3JsZA==
// console.log(BrowserBuffer.fromBase64("aGVsbG93b3JsZA==").toString()); // 输出: helloworld

export default function mockBuffer() {
    // 如果是在 Node.js 环境下，不进行模拟
    if (!isNodeJS()) {
        window["Buffer"] = Buffer;
    }
}
