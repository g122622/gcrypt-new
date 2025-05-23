/**
 * File: \src\api\core\KVPEngines\KVPEngineJson.ts
 * Project: Gcrypt
 * Created Date: 2023-11-26 17:14:30
 * Author: Guoyi
 * -----
 * Last Modified: 2024-02-15 22:49:30
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

import VFS from "@/utils/file/virtualFS";
import IKVPEngine from "../types/IKVPEngine";
import IEncryptionEngine from "../types/IEncryptionEngine";
import { Buffer } from "buffer";
import { Disposable } from "@/utils/helpers/Disposable";

const calcDataJsonSrc = (entryJsonSrc, dataJsonFileName: string) => {
    let foo = entryJsonSrc.split("/");
    foo.pop();
    foo.push(dataJsonFileName);
    return foo.join("/");
};

class KVPEngineJson extends Disposable implements IKVPEngine {
    private currentJson = null;
    private currentDataJsonSrc: string = null;
    private encryptionEngine: IEncryptionEngine;

    /**
     * 初始化jsonStorage
     * @param storeEntryJsonSrc 入口json文件的绝对路径，不是data.json的路径！！！
     * @param pwd 密码
     */
    public init = async (storeEntryJsonSrc: string, encryptionEngine) => {
        this.currentDataJsonSrc = calcDataJsonSrc(storeEntryJsonSrc, "data.json");
        this.encryptionEngine = encryptionEngine;

        // old code
        // if (VFS.existsSync(this.currentDataJsonSrc)) {
        //     this.currentJson = JSON.parse((await VFS.readFile(this.currentDataJsonSrc)).toString('utf-8'));
        // } else {
        //     await this.createNewStore();
        // }

        try {
            await VFS.access(this.currentDataJsonSrc, VFS.constants.F_OK);
            this.currentJson = JSON.parse((await VFS.readFile(this.currentDataJsonSrc)).toString("utf-8"));
        } catch (e) {
            await this.createNewStore();
        }
    };

    /**
     * 在内存中创建一个空的存储库
     * @param storageName
     * @param comment
     */
    public getEmptyJson = () => {
        const res = {
            data: {},
            extra: {}
        };
        return res;
    };

    /**
     * 将内存和本地数据同步
     */
    private sync = async () => {
        await VFS.writeFile(this.currentDataJsonSrc, JSON.stringify(this.currentJson));
    };

    /**
     * 在本地创建一个新的库
     * @param src
     * @param storageName
     * @param comment
     */
    private createNewStore = async () => {
        this.currentJson = this.getEmptyJson();
        await this.sync();
    };

    /**
     * 判断数据是否存在
     * @param hash
     */
    public hasData = async (hash: string): Promise<boolean> => {
        // TS2339: Property 'hasOwn' does not exist on type 'ObjectConstructor'.
        // eslint-disable-next-line dot-notation
        return Object["hasOwn"](this.currentJson.data, hash);
    };

    /**
     * 获取数据
     * @param hash
     */
    public getData = async (hash: string): Promise<Buffer | null> => {
        // eslint-disable-next-line dot-notation
        if (Object["hasOwn"](this.currentJson.data, hash)) {
            const data: string = this.currentJson.data[hash];
            return await this.encryptionEngine.decrypt(Buffer.from(data, "base64"));
        } else {
            return null;
        }
    };

    /**
     *
     * @param hash 根据已有键去set数据
     * @param buf
     */
    public setData = async (hash: string, buf: Buffer) => {
        this.currentJson.data[hash] = (await this.encryptionEngine.encrypt(buf)).toString("base64");
        await this.sync();
    };

    /**
     *
     * @param hash 根据已有键去delete数据
     * @param buf
     */
    public deleteData = async (hash: string) => {
        if (!(await this.hasData(hash))) {
            throw new Error("要删除的key不存在：" + hash);
        }
        delete this.currentJson.data[hash];
        await this.sync();
    };
}

export default KVPEngineJson;
