import IKVPEngine from "../../types/IKVPEngine";
import IEncryptionEngine from "../../types/IEncryptionEngine";
import RequestURLBuilder from "@/utils/http/RequestURLBuilder";
import axios from "axios";
import getDigest from "@/backend/hash/getDigest";
import VFS from "@/utils/file/virtualFS";
import crypto from "crypto";
import EntryJson from "../../types/EntryJson";
import { Buffer } from "buffer";
import { changeGlobalOperationState, resetGlobalOperationState } from "@/utils/globalOperationState";
import { Disposable } from "@/utils/helpers/Disposable";
import LRUCache from "@/utils/helpers/LRUCache";
import { DELETED_FILE_MARKER } from "../common/constants";
import ASSERT from "@/utils/ASSERT";

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
        this.LRUCache = new LRUCache(0, 0); // 20MB, 512KB
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

    protected hmacSha1(encodedFlags: string, secretKey: string, shouldToBase64: boolean = true): string {
        const hmac = crypto.createHmac("sha1", secretKey);
        hmac.update(encodedFlags);
        if (shouldToBase64) {
            return hmac.digest("base64");
        }
        return hmac.digest("hex");
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
        const expireStamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour later
        const baseUrl = builder.buildUrl(key, { e: expireStamp });
        const signature = this.hmacSha1(baseUrl, this.config.SECRET_KEY);
        const encodedSign = base64ToUrlSafe(signature);
        const downloadToken = `${this.config.ACCESS_KEY}:${encodedSign}`;
        const downloadUrl = `${baseUrl}&token=${downloadToken}`;
        return downloadUrl;
    }

    public async hasData(key: string): Promise<boolean> {
        changeGlobalOperationState(`Checking ${key} in Qiniu KV3...`);
        try {
            if (this._useMD5Hashing) {
                key = getDigest(Buffer.from(key), "md5");
            }
            debugger;
            // 检查缓存
            const cached = this.LRUCache.get(key);
            if (cached) {
                // 缓存中如果是删除标记，视为不存在
                return !cached.equals(Buffer.from(DELETED_FILE_MARKER));
            }
            // 注意：缓存里没有，不代表文件真的不存在，需要通过后续请求来确认

            const url = this.buildDownloadUrl(key);

            // 先发 HEAD 请求获取长度
            const headResponse = await axios.head(url);
            const contentLength = headResponse.headers["content-length"];
            ASSERT(contentLength);

            const markerLength = (await this.encryptionEngine.encrypt(Buffer.from(DELETED_FILE_MARKER))).length;
            const actualLength = parseInt(contentLength, 10);

            // 长度不匹配 → 肯定不是删除标记 → 存在有效数据
            if (actualLength !== markerLength) {
                return true;
            }

            // 长度匹配 → 需要下载内容确认是否真的是删除标记
            const response = await axios.get(url, { responseType: "arraybuffer" });
            const arrayBuffer = response.data;
            const downloadedData = Buffer.from(arrayBuffer);

            // 对比下载到的内容是否与删除标记一致
            return !downloadedData.equals(Buffer.from(DELETED_FILE_MARKER));
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return false;
            }
            throw error;
        } finally {
            resetGlobalOperationState();
        }
    }

    /**
     * https://developer.qiniu.com/kodo/1656/download-private
     * @param key 键
     * @param value 值
     * @returns Promise<void>
     */
    public async getData(key: string): Promise<Buffer | null> {
        changeGlobalOperationState(`Downloading ${key} from Qiniu KV3...`);

        try {
            if (this._useMD5Hashing) {
                key = getDigest(Buffer.from(key), "md5");
            }

            // Access the cache first
            const cachedValue = this.LRUCache.get(key);
            if (cachedValue) {
                // If cached value is deleted marker, return null
                return cachedValue.equals(Buffer.from(DELETED_FILE_MARKER)) ? null : cachedValue;
            }

            // If not in cache, download from Qiniu KV3
            const downloadUrl = this.buildDownloadUrl(key);
            const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
            const arrayBuffer = response.data;

            // Decrypt the data
            const res = await this.encryptionEngine.decrypt(Buffer.from(arrayBuffer));

            // Update the cache
            this.LRUCache.put(key, res);

            // Return null if it's a deleted marker
            return res.equals(Buffer.from(DELETED_FILE_MARKER)) ? null : res;
        } catch (error) {
            throw error;
        } finally {
            resetGlobalOperationState();
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
