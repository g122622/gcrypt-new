/**
 * File: \src\api\core\KVPEngines\KVPEngineFolder.ts
 * Project: Gcrypt
 * Created Date: 2023-11-26 17:14:30
 * Author: Guoyi
 * -----
 * Last Modified: 2024-02-15 10:57:42
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

import VFS from "@/utils/file/virtualFS";
import IKVPEngine from "../types/IKVPEngine";
import IEncryptionEngine from "../types/IEncryptionEngine";
import getDigest from "@/api/hash/getDigest";
import { Buffer } from "buffer";
import { Disposable } from "@/utils/helpers/Disposable";

const calcDataFileSrc = (entryJsonSrc, dataFileName: string) => {
    let foo = entryJsonSrc.split("/");
    foo.pop();
    foo.push(dataFileName);
    return foo.join("/");
};

class KVPEngineFolder extends Disposable implements IKVPEngine {
    private encryptionEngine: IEncryptionEngine;
    private storeEntryJsonSrc;

    /**
     * 初始化jsonStorage
     * @param storeEntryJsonSrc 入口json文件的绝对路径
     */
    public async init(storeEntryJsonSrc: string, encryptionEngine) {
        this.storeEntryJsonSrc = storeEntryJsonSrc;
        this.encryptionEngine = encryptionEngine;
    }

    /**
     * 判断数据是否存在
     * @param key
     */
    public async hasData(key: string): Promise<boolean> {
        try {
            await VFS.access(calcDataFileSrc(this.storeEntryJsonSrc, getDigest(Buffer.from(key), "md5")));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取数据
     * @param key
     */
    public async getData(key: string): Promise<Buffer | null> {
        if (!(await this.hasData(key))) {
            return null;
        }
        try {
            let dataFilePath = calcDataFileSrc(this.storeEntryJsonSrc, getDigest(Buffer.from(key), "md5"));
            await VFS.access(dataFilePath);
            const data: Buffer = await VFS.readFile(dataFilePath);
            return await this.encryptionEngine.decrypt(data);
        } catch (e) {
            console.error(`键值对引擎获取数据失败`, e);
            throw e;
        }
    }

    /**
     *
     * @param key 根据已有键去set数据
     * @param buf
     */
    public async setData(key: string, buf: Buffer) {
        let dataFilePath = calcDataFileSrc(this.storeEntryJsonSrc, getDigest(Buffer.from(key), "md5"));
        await VFS.writeFile(dataFilePath, await this.encryptionEngine.encrypt(buf));
    }

    /**
     *
     * @param key 根据已有键去delete数据
     * @param buf
     */
    public async deleteData(key: string) {
        let dataFilePath = calcDataFileSrc(this.storeEntryJsonSrc, getDigest(Buffer.from(key), "md5"));
        await VFS.unlink(dataFilePath);
    }
}

export default KVPEngineFolder;
