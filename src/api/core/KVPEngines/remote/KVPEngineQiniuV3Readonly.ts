import IKVPEngine from "../../types/IKVPEngine";
import IEncryptionEngine from "../../types/IEncryptionEngine";
import RequestURLBuilder from "@/utils/http/RequestURLBuilder";
import axios from "axios";
import getDigest from "@/api/hash/getDigest";
import VFS from "@/utils/file/virtualFS";
import crypto from "crypto";
import EntryJson from "../../types/EntryJson";
import { Buffer } from "buffer";
import { changeGlobalOperationState, resetGlobalOperationState } from "@/utils/globalOperationState";
import { Disposable } from "@/utils/helpers/Disposable";
import LRUCache from "@/utils/helpers/LRUCache";

/**
 * 七牛云存储实现的键值对引擎
 */
export default class KVPEngineQiniuV3Readonly extends Disposable implements IKVPEngine {
    protected config!: {
        isHttps: boolean;
        domain: string;
        bucketName: string;
        ACCESS_KEY: string;
        SECRET_KEY: string;
    };
    protected encryptionEngine!: IEncryptionEngine;
    protected _useMD5Hashing: boolean = true; // 仅仅用于测试，实际使用时请设置为 true
    protected LRUCache: LRUCache = null;

    get useMD5Hashing(): boolean {
        return this._useMD5Hashing;
    }

    set useMD5Hashing(value: boolean) {
        this._useMD5Hashing = value;
    }

    constructor() {
        super();
        this._register({
            dispose: () => {
                this.config = null as any;
                this.encryptionEngine = null as any;
            }
        });
        // 这个缓存主要是为了缓存小文件（如元数据、缩略图等），因此单item最大值设为512KB
        this.LRUCache = new LRUCache(1024 * 1024 * 20, 1024 * 512); // 20MB, 512KB
        this._register(this.LRUCache);
    }

    public async init(entryFileSrc: string, encryptionEngine: IEncryptionEngine) {
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

    public async initWithConfig(config: typeof KVPEngineQiniuV3Readonly.prototype.config, encryptionEngine: IEncryptionEngine) {
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
        if (this._useMD5Hashing) {
            key = getDigest(Buffer.from(key), "md5");
        }

        // access the cache first
        if (this.LRUCache.get(key)) {
            resetGlobalOperationState();
            return true;
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
        if (this._useMD5Hashing) {
            key = getDigest(Buffer.from(key), "md5");
        }

        // access the cache first
        const cachedValue = this.LRUCache.get(key);
        if (cachedValue) {
            resetGlobalOperationState();
            return cachedValue;
        }

        // if not in cache, download from Qiniu KV3
        try {
            const downloadUrl = this.buildDownloadUrl(key);
            const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
            const arrayBuffer = response.data;
            // decrypt the data
            const res = await this.encryptionEngine.decrypt(Buffer.from(arrayBuffer));
            // update the cache
            this.LRUCache.put(key, res);
            // set the global operation state
            resetGlobalOperationState();
            return res;
        } catch (error) {
            resetGlobalOperationState();
            throw error;
        }
    }

    public async setData(key: string, value: Buffer): Promise<void> {
        if (this._useMD5Hashing) {
            key = getDigest(Buffer.from(key), "md5");
        }
        // return Promise.reject("Not implemented, because Qiniu KV3 does not support setting data currently.");
        // 写缓存
        this.LRUCache.put(key, value);
        return;
    }

    public async deleteData(key: string): Promise<void> {
        if (this._useMD5Hashing) {
            key = getDigest(Buffer.from(key), "md5");
        }
        // return Promise.reject("Not implemented, because Qiniu KV3 does not support deleting data currently.");
        // 移除缓存
        this.LRUCache.remove(key);
        return;
    }
}
