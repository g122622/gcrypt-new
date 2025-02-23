import KVPEngineBase from "../../types/KVPEngineBase";
import EncryptionEngineBase from "../../types/EncryptionEngineBase";
import RequestURLBuilder from "@/utils/http/RequestURLBuilder";
import axios from "axios";
import getDigest from "@/api/hash/getDigest";
import VFS from "@/utils/file/virtualFS";
import crypto from "crypto";
import EntryJson from "../../types/EntryJson";
import { Buffer } from "buffer";
import { changeGlobalOperationState, resetGlobalOperationState } from "@/utils/globalOperationState";
import { Disposable } from "@/utils/helpers/Disposable";

/**
 * 七牛云存储实现的键值对引擎
 */
export default class KVPEngineQiniuV3Readonly extends Disposable implements KVPEngineBase {
    protected config!: {
        isHttps: boolean;
        domain: string;
        bucketName: string;
        ACCESS_KEY: string;
        SECRET_KEY: string;
    };
    protected encryptionEngine!: EncryptionEngineBase;
    public useMD5Hashing: boolean = true; // 仅仅用于测试，实际使用时请设置为 true

    constructor() {
        super();
        this._register({
            dispose: () => {
                this.config = undefined as any;
                this.encryptionEngine = undefined as any;
            }
        })
    }

    public async init(entryFileSrc: string, encryptionEngine: EncryptionEngineBase) {
        const json = JSON.parse(await VFS.readFile(entryFileSrc, "utf-8")) as EntryJson;
        this.config = {
            isHttps: json.config.remote.isHttps,
            domain: json.config.remote.domain,
            bucketName: json.config.remote.bucketName,
            ACCESS_KEY: json.config.remote.ACCESS_KEY,
            SECRET_KEY: json.config.remote.SECRET_KEY
        };
        this.encryptionEngine = encryptionEngine;
    }

    public async initWithConfig(
        config: typeof KVPEngineQiniuV3Readonly.prototype.config,
        encryptionEngine: EncryptionEngineBase
    ) {
        this.config = config;
        this.encryptionEngine = encryptionEngine;
    }

    protected hmacSha1(encodedFlags: string, secretKey: string): string {
        const hmac = crypto.createHmac("sha1", secretKey);
        hmac.update(encodedFlags);
        return hmac.digest("base64");
    }

    /**
     * 签名
     * https://developer.qiniu.com/kodo/1202/download-token
     * @param key
     * @returns
     */
    private buildDownloadUrl(key: string): string {
        const base64ToUrlSafe = function (v: string) {
            return v.replace(/\//g, "_").replace(/\+/g, "-");
        };

        const builder = new RequestURLBuilder(this.config.domain, this.config.isHttps);
        const expireStamp = Math.floor(Date.now() / 1000) + 60; // 1 minute later
        const baseUrl = builder.buildUrl(key, { e: expireStamp });
        const signature = this.hmacSha1(baseUrl, this.config.SECRET_KEY);
        const encodedSign = base64ToUrlSafe(signature);
        const downloadToken = `${this.config.ACCESS_KEY}:${encodedSign}`;
        const downloadUrl = `${baseUrl}&token=${downloadToken}`;
        return downloadUrl;
    }

    public async hasData(key: string): Promise<boolean> {
        changeGlobalOperationState(`Checking ${key} in Qiniu KV3...`);
        if (this.useMD5Hashing) {
            key = getDigest(Buffer.from(key), "md5");
        }
        const url = this.buildDownloadUrl(key);
        // use axios to send request
        try {
            const response = await axios.head(url);
            resetGlobalOperationState();
            return response.status === 200;
        } catch (error) {
            resetGlobalOperationState();
            if (error.response && error.response.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * https://developer.qiniu.com/kodo/1656/download-private
     * @param key 键
     * @param value 值
     * @returns Promise<void>
     */
    public async getData(key: string): Promise<Buffer> {
        changeGlobalOperationState(`Downloading ${key} from Qiniu KV3...`);
        if (this.useMD5Hashing) {
            key = getDigest(Buffer.from(key), "md5");
        }
        const downloadUrl = this.buildDownloadUrl(key);
        const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
        const arrayBuffer = response.data;
        const res = await this.encryptionEngine.decrypt(Buffer.from(arrayBuffer));
        resetGlobalOperationState();
        return res;
    }

    public async setData(_key: string, _value: Buffer): Promise<void> {
        // return Promise.reject("Not implemented, because Qiniu KV3 does not support setting data currently.");
        return;
    }

    public async deleteData(_key: string): Promise<void> {
        // return Promise.reject("Not implemented, because Qiniu KV3 does not support deleting data currently.");
        return;
    }
}
