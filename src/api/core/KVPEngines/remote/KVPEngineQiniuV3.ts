import * as qiniu from "qiniu-js";
import KVPEngineBase from "../../types/KVPEngineBase";
import RequestURLBuilder from "@/utils/http/RequestURLBuilder";
import axios from "axios";
import getDigest from "@/api/hash/getDigest";
import KVPEngineQiniuV3Readonly from "./KVPEngineQiniuV3Readonly";
import { Buffer } from "buffer";

/**
 * 七牛云存储实现的键值对引擎
 */
export default class KVPEngineQiniuV3 extends KVPEngineQiniuV3Readonly implements KVPEngineBase {
    /**
     * https://developer.qiniu.com/kodo/1208/upload-token
     * @param key
     * @returns
     */
    private buildUploadToken(key: string): string {
        const encodedPutPolicy: string = qiniu.urlSafeBase64Encode(
            JSON.stringify({
                scope: `${this.config.bucketName}:${key}`,
                deadline: Math.floor(Date.now() / 1000) + 60
            })
        );
        const sign = this.hmacSha1(encodedPutPolicy, this.config.SECRET_KEY);
        const encodedSign = qiniu.urlSafeBase64Encode(sign);
        const uploadToken = `${this.config.ACCESS_KEY}:${encodedSign}:${encodedPutPolicy}`;
        return uploadToken;
    }

    public async setData(key: string, value: Buffer): Promise<void> {
        if (this.useMD5Hashing) {
            key = getDigest(Buffer.from(key), "md5");
        }
        const file = new File([await this.encryptionEngine.encrypt(value)], key, { type: "application/octet-stream" });
        const putExtra = { fname: key };
        const config = { useCdnDomain: false };

        return new Promise((resolve, reject) => {
            const observable = qiniu.upload(file, key, this.buildUploadToken(key), putExtra, config);

            observable.subscribe({
                error: err => reject(new Error(`Upload failed: ${err.message}`)),
                complete: () => resolve()
            });
        });
    }

    public async deleteData(key: string): Promise<void> {
        if (this.useMD5Hashing) {
            key = getDigest(Buffer.from(key), "md5");
        }
        // todo: 实现删除文件
    }
}
