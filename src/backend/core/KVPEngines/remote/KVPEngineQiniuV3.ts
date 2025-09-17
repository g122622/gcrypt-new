import * as qiniu from "qiniu-js";
import IKVPEngine from "../../types/IKVPEngine";
import axios from "axios";
import getDigest from "@/backend/hash/getDigest";
import KVPEngineQiniuV3Readonly from "./KVPEngineQiniuV3Readonly";
import { Buffer } from "buffer";
import { error } from "@/utils/gyConsole";
import { UploadProgress } from "qiniu-js/esm/upload";
import { DELETED_FILE_MARKER } from "../common/constants";
import sleep from "@/utils/sleep";

/**
 * 七牛云存储实现的键值对引擎
 */
export default class KVPEngineQiniuV3 extends KVPEngineQiniuV3Readonly implements IKVPEngine {
    constructor() {
        super();
    }

    /**
     * https://developer.qiniu.com/kodo/1208/upload-token
     * @param key
     * @returns
     */
    private buildUploadToken(key: string): string {
        const encodedPutPolicy: string = qiniu.urlSafeBase64Encode(
            JSON.stringify({
                scope: `${this.config.bucketName}:${key}`,
                deadline: Math.floor(Date.now() / 1000) + 3600, // 1h有效期
                returnBody: JSON.stringify({})
            })
        );
        const encodedSign = this.hmacSha1(encodedPutPolicy, this.config.SECRET_KEY, true)
            .replaceAll("/", "_")
            .replaceAll("+", "-");
        const uploadToken = `${this.config.ACCESS_KEY}:${encodedSign}:${encodedPutPolicy}`;
        return uploadToken;
    }

    /**
     * 设置数据(允许覆盖已有值)
     * @param key 键
     * @param value 值
     * @returns
     */
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
                error: err => {
                    error(`[KVPEngineQiniuV3.setData] 上传失败: ${err.message}`);
                    reject(new Error(`Upload failed: ${err.message}`));
                },
                complete: async () => {
                    // 上传完成后，更新缓存
                    this.LRUCache.put(key, value);
                    await sleep(1000);
                    resolve();
                },
                next: (progress: UploadProgress) => {
                    // 报告上传进度
                    const { total } = progress;
                    console.log(`[KVPEngineQiniuV3.setData] 上传进度: ${total.percent}%, 已上传: ${total.loaded}`);
                }
            });
        });
    }

    /**
     * 删除数据
     * @param key 键
     * @returns
     * @note 七牛云存储不支持在浏览器端执行真正的删除操作，会触发跨域，因此只能通过覆盖文件内容的方式模拟删除
     */
    public async deleteData(key: string): Promise<void> {
        // 标记文件为已删除(setData 内部会处理 key 的哈希)
        await this.setData(key, Buffer.from(DELETED_FILE_MARKER));

        // 下面这些缓存移除逻辑其实可以不要，反正 read 和 has 都会判断
        // // 如果需要在这里操作缓存，必须确保 key 是哈希后的。
        // // 但由于 setData 内部已经 put 了（使用哈希后的 key），这里 remove 也应该用哈希后的 key。
        // if (this._useMD5Hashing) {
        //     key = getDigest(Buffer.from(key), "md5");
        // }
        // // 从缓存中移除
        // this.LRUCache.remove(key);
    }
}
