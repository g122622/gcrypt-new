/**
 * File: \src\api\core\types\KVPEngineBase.ts
 * Project: Gcrypt
 * Created Date: 2023-11-26 17:14:30
 * Author: Guoyi
 * -----
 * Last Modified: 2024-02-14 21:18:46
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

import EncryptionEngineBase from "./EncryptionEngineBase";

/**
 * 这是KVPEngine的抽象类，是所有KVPEngine的实现标准
 *
 */
abstract class KVPEngineBase {
    /**
     * 初始化KVPEngine。
     * @param entryFileSrc 入口文件路径
     * @param encryptionEngine 加密引擎
     */
    public abstract init(entryFileSrc: string, encryptionEngine: EncryptionEngineBase): Promise<void>;
    /**
     * 传入配置而不是文件路径来初始化KVPEngine。与上面的init方法只能二选一，不能同时调用。
     * @param config 配置对象
     * @param encryptionEngine
     */
    public abstract initWithConfig?(config: any, encryptionEngine: EncryptionEngineBase): Promise<void>;
    public abstract hasData(key: string): Promise<boolean>;
    /**
     * 获取数据。如果数据不存在，返回null。
     * @param key 键
     * @returns 返回值是Buffer或null
     */
    public abstract getData(key: string): Promise<Buffer | null>;
    /**
     * 设置数据。允许覆盖已有数据。
     * @param key
     * @param valve
     */
    public abstract setData(key: string, valve: Buffer): Promise<void>;
    public abstract deleteData(key: string): Promise<void>;
}

export default KVPEngineBase;
