import * as qiniu from "qiniu-js";
import IKVPEngine from "../../types/IKVPEngine";
import RequestURLBuilder from "@/utils/http/RequestURLBuilder";
import axios from "axios";
import getDigest from "@/backend/hash/getDigest";
import KVPEngineQiniuV3Readonly from "./KVPEngineQiniuV3Readonly";
import { Buffer } from "buffer";

/**
 * 七牛云存储实现的键值对引擎
 */
export default class KVPEngineQiniuV3 extends KVPEngineQiniuV3Readonly implements IKVPEngine {
    /**
     * https://developer.qiniu.com/kodo/1208/upload-token
     * @param key
     * @returns
     */
    private buildUploadToken(key: string): string {
        const encodedPutPolicy: string = qiniu.urlSafeBase64Encode(
            JSON.stringify({
                scope: `${this.config.bucketName}:${key}`,
                deadline: Math.floor(Date.now() / 1000) + 3600,
                returnBody: JSON.stringify({})
            })
        );
        // hmacSha1签名之后会自动算出base64编码
        const encodedSign = this.hmacSha1(encodedPutPolicy, this.config.SECRET_KEY, true);
        const uploadToken = `${this.config.ACCESS_KEY}:${encodedSign}:${encodedPutPolicy}`;
        return uploadToken;
    }

    public async setData(key: string, value: Buffer): Promise<void> {
        if (this._useMD5Hashing) {
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
        if (this._useMD5Hashing) {
            key = getDigest(Buffer.from(key), "md5");
        }

        // 1. 构造 EncodedEntryURI: <bucket>:<key> → URL安全Base64编码
        const entry = `${this.config.bucketName}:${key}`;
        const encodedEntry = qiniu.urlSafeBase64Encode(entry);

        // 2. 构造请求URL
        const url = `http://rs.qiniu.com/delete/${encodedEntry}`;

        // 3. 构造待签名字符串 signingStr
        // 格式: "POST /delete/xxx\nHost: rs.qiniu.com\n\n"
        const path = `/delete/${encodedEntry}`;
        const host = "rs.qiniu.com";
        const signingStr = `POST ${path}\nHost: ${host}\n\n`;

        // 4. HMAC-SHA1 签名 + URL安全Base64编码
        // 注意：hmacSha1 需要返回二进制签名后再做 urlsafe_base64_encode
        const encodedSign = this.hmacSha1(signingStr, this.config.SECRET_KEY, true);

        // 5. 拼接管理凭证
        const accessToken = `${this.config.ACCESS_KEY}:${encodedSign}`;

        // 6. 发送删除请求
        try {
            await axios.post(url, null, {
                headers: {
                    Authorization: `Qiniu ${accessToken}`,
                    "Content-Type": "application/x-www-form-urlencoded" // 七牛要求
                }
            });
        } catch (error) {
            throw new Error(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
