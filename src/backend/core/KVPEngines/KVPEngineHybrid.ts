/*
 * File: \src\api\core\KVPEngines\KVPEngineHybrid.ts
 * Project: Gcrypt
 * Created Date: 2024-02-14 20:27:48
 * Author: Guoyi
 * -----
 * Last Modified: 2024-02-14 20:27:49
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

import KVPEngineFolder from "./KVPEngineFolder";
import KVPEngineQiniuV3Readonly from "./remote/KVPEngineQiniuV3Readonly";
import calcBufSize from "@/utils/calcBufSize";
import ASSERT from "@/utils/ASSERT";
import sharedUtils from "@/utils/sharedUtils";
import { ILock, Lock, NoopLock } from "@/utils/helpers/Lock";
import IKVPEngine from "../types/IKVPEngine";
import VFS from "@/utils/file/virtualFS";
import EntryJson from "../types/EntryJson";
import { Buffer } from "buffer";
import { Disposable } from "@/utils/helpers/Disposable";

const config = {
    blockInclusionThreshold: 12 * 1024, // 小于这个值的value将被放在block内
    blockExclusionThreshold: 16 * 1024, // 大于这个值的value将被移出block
    blockSizeThreshold: 128 * 1024 // 尺寸大于这个值的block将不会被放入新的value
};

class KVPEngineHybrid extends Disposable implements IKVPEngine {
    // keyReferenceMap用于快速查询某个键是否在某个block内，若是，返回block名称
    private keyReferenceMap = {};
    // blockUsageMap用于快速查询某个block的存在情况和空间使用情况
    private blockUsageMap = {};
    // 用于确保操作的原子性
    private opLock: ILock;

    private baseEngine: IKVPEngine; // should not be changed after init

    constructor() {
        super();
        this._register({
            dispose: () => {
                this.opLock.unlockAll();
            }
        });
    }

    /**
     * 初始化jsonStorage
     * @param storeEntryJsonSrc 入口json文件的绝对路径，不是data.json的路径！！！
     * @param pwd 密码
     */
    public async init(storeEntryJsonSrc: string, encryptionEngine) {
        const EntryJson = JSON.parse((await VFS.readFile(storeEntryJsonSrc)).toString()) as EntryJson;
        switch (EntryJson.storeType) {
            case "local":
                this.opLock = new Lock();
                this.baseEngine = new KVPEngineFolder();
                break;
            case "remote":
                this.opLock = new NoopLock();
                this.baseEngine = new KVPEngineQiniuV3Readonly();
                break;
            default:
                throw new Error("KVPEngineHybrid::init::unknownStoreType: " + EntryJson.storeType);
        }
        this._register(this.baseEngine);
        await this.baseEngine.init(storeEntryJsonSrc, encryptionEngine);
        if (await this.baseEngine.hasData("@keyReferenceMap")) {
            this.keyReferenceMap = JSON.parse((await this.baseEngine.getData("@keyReferenceMap")).toString());
        }
        if (await this.baseEngine.hasData("@blockUsageMap")) {
            this.blockUsageMap = JSON.parse((await this.baseEngine.getData("@blockUsageMap")).toString());
        }
    }

    /**
     * 保存maps（相当于元数据）到本地磁盘
     */
    private async saveMaps() {
        await this.baseEngine.setData("@keyReferenceMap", Buffer.from(JSON.stringify(this.keyReferenceMap)));
        await this.baseEngine.setData("@blockUsageMap", Buffer.from(JSON.stringify(this.blockUsageMap)));
    }

    private async hasDataInBlock(blockKey: string, masterKey: string) {
        // TS2339: Property 'hasOwn' does not exist on type 'ObjectConstructor'.
        // eslint-disable-next-line dot-notation
        return Object["hasOwn"](JSON.parse((await this.baseEngine.getData(blockKey)).toString()), masterKey);
    }

    private async getDataInBlock(blockKey: string, masterKey: string): Promise<Buffer | null> {
        // console.log(blockKey, masterKey, (await this.baseEngine.getData(blockKey)).toString())
        const obj = JSON.parse((await this.baseEngine.getData(blockKey)).toString());
        if (!!obj && !!obj[masterKey]) {
            return Buffer.from(obj[masterKey], "binary");
        } else {
            // 还需判断obj[masterKey]是否为空字符串
            if (obj[masterKey] === "") {
                return Buffer.from("");
            }
            return null;
        }
    }

    /**
     *
     * @param blockKey Note：如果存储库没有指定的blockKey，那么就静默地新建一个，不会修改其他map
     * @param masterKey
     * @param value
     */
    private async setDataInBlock(blockKey: string, masterKey: string, value: Buffer): Promise<void> {
        let obj = null;
        let oldSize = 0;
        if (await this.baseEngine.hasData(blockKey)) {
            // 如果blockKey存在，那么读取blockKey对应的对象
            // 这样会导致读放大，但是没办法，这是为了数据完整性考虑
            obj = JSON.parse((await this.baseEngine.getData(blockKey)).toString());
            if (!!obj && !!obj[masterKey]) {
                oldSize = calcBufSize(Buffer.from(obj[masterKey], "binary")); // 计算旧值的大小
            }
        } else {
            obj = {};
        }

        // 修改对象，增加或改写键值对
        obj[masterKey] = value.toString("binary");
        // 已修改的对象写回本地磁盘
        await this.baseEngine.setData(blockKey, Buffer.from(JSON.stringify(obj)));
        // 更新使用量数据
        if (!this.blockUsageMap[blockKey]) {
            this.blockUsageMap[blockKey] = 0;
        }
        // 计算新值的大小
        // bug fix 2025-05-24
        // 问题：在 setDataInBlock 方法中，当更新已存在的 Key 时，未扣除旧值大小，导致 blockUsageMap 统计错误。
        // 修复：在更新 blockUsageMap 前，计算旧值大小并进行差值更新。
        this.blockUsageMap[blockKey] += calcBufSize(value) - oldSize;
        ASSERT(this.blockUsageMap[blockKey] >= 0); // 断言：block大小不应该为负数
        // 更新keyReferenceMap
        this.keyReferenceMap[masterKey] = blockKey;
        // 更新元数据
        await this.saveMaps();
    }

    private async deleteDataInBlock(blockKey: string, masterKey: string): Promise<void> {
        const obj = JSON.parse((await this.baseEngine.getData(blockKey)).toString());
        if (obj) {
            const size = calcBufSize(Buffer.from(obj[masterKey], "binary"));
            // 修改对象，删除键值对
            delete obj[masterKey];
            // 已修改的对象写回本地磁盘
            await this.baseEngine.setData(blockKey, Buffer.from(JSON.stringify(obj)));
            // 更新使用量数据
            ASSERT(this.blockUsageMap[blockKey] - size >= 0); // 断言：删除之后，block大小不应该为负数
            this.blockUsageMap[blockKey] -= size;
            // 如果blockKey对应的对象为空，那么删除blockKey
            if (Object.keys(obj).length === 0) {
                await this.baseEngine.deleteData(blockKey);
                delete this.blockUsageMap[blockKey];
            }
            // 更新keyReferenceMap
            delete this.keyReferenceMap[masterKey];
            // 更新元数据
            await this.saveMaps();
        } else {
            throw new Error("KVPEngineHybrid::deleteDataInBlock::noSuchKey: " + masterKey + "in block " + blockKey);
        }
    }

    /**
     * 获取适合存储数据的块键（blockKey）。
     * 该方法会遍历所有已有的块键，检查每个块的使用情况。
     * 如果找到一个使用量小于或等于配置的块大小阈值的块键，则返回该块键。
     * 如果没有找到合适的块键，则创建一个新的块键，并将其使用量初始化为0，然后返回该新块键。
     *
     * @returns {string} 适合存储数据的块键。
     */
    private getSuitableBlockKey(): string {
        const blockKeys = Object.keys(this.blockUsageMap);
        for (let i = 0; i < blockKeys.length; i++) {
            if (this.blockUsageMap[blockKeys[i]] <= config.blockSizeThreshold) {
                return blockKeys[i];
            }
        }
        // 运行到这里，说明没有找到合适的blockKey，那么创建新的blockKey
        const newBlockKey = sharedUtils.getHash();
        this.blockUsageMap[newBlockKey] = 0;
        return newBlockKey;
    }

    /**
     * 判断数据是否存在
     * @param key
     */
    public async hasData(key: string): Promise<boolean> {
        if (this.keyReferenceMap[key]) {
            return true;
        }
        return await this.baseEngine.hasData(key);
    }

    /**
     * 获取数据
     * @param key
     */
    public async getData(key: string): Promise<Buffer | null> {
        await this.opLock.lock();
        if (!(await this.hasData(key))) {
            this.opLock.unlock();
            return null;
        }
        // 若属于存在block内的小文件
        if (this.keyReferenceMap[key]) {
            const res = await this.getDataInBlock(this.keyReferenceMap[key], key);
            this.opLock.unlock();
            return res;
        } else {
            const res = await this.baseEngine.getData(key);
            this.opLock.unlock();
            return res;
        }
    }

    /**
     *
     * @param key 根据已有键去set数据
     * @param buf
     */
    public async setData(key: string, buf: Buffer) {
        await this.opLock.lock();

        // 小文件，从单独存放转移，再存block
        if (calcBufSize(buf) <= config.blockInclusionThreshold) {
            if (this.keyReferenceMap[key]) {
                // 本来就在block内，无需转移
                await this.setDataInBlock(this.keyReferenceMap[key], key, buf);
            } else {
                // 检测到不在block内（或者是新写入的文件），需要从单独存放转移至block内
                if (await this.baseEngine.hasData(key)) {
                    await this.baseEngine.deleteData(key);
                }
                await this.setDataInBlock(this.getSuitableBlockKey(), key, buf);
            }
        } else if (calcBufSize(buf) > config.blockInclusionThreshold && calcBufSize(buf) < config.blockExclusionThreshold) {
            // 介于大小之间的文件，需要维持原来的状态。这么设计是为了避免频繁地移动文件，提高性能
            if (this.keyReferenceMap[key]) {
                // 检测到在block内
                await this.setDataInBlock(this.keyReferenceMap[key], key, buf);
            } else {
                await this.baseEngine.setData(key, buf);
            }
        } else {
            // 大文件，移出block之后单独存放
            if (this.keyReferenceMap[key]) {
                // 检测到一定在block内（不可能是新写入的文件），需要转移至单独存放
                await this.deleteDataInBlock(this.keyReferenceMap[key], key);
                await this.baseEngine.setData(key, buf);
            } else {
                // 本来就是单独存放，无需转移
                await this.baseEngine.setData(key, buf);
            }
        }

        this.opLock.unlock();
    }

    /**
     *
     * @param key 根据已有键去delete数据
     * @param buf
     */
    public async deleteData(key: string) {
        await this.opLock.lock();
        if (this.keyReferenceMap[key]) {
            await this.deleteDataInBlock(this.keyReferenceMap[key], key);
        } else {
            await this.baseEngine.deleteData(key);
        }
        this.opLock.unlock();
    }
}

export default KVPEngineHybrid;
