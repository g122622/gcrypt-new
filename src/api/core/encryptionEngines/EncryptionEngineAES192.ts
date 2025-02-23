/**
 * File: \src\api\core\encryptionEngines\EncryptionEngineAES192.ts
 * Project: Gcrypt
 * Created Date: 2023-11-26 17:14:30
 * Author: Guoyi
 * -----
 * Last Modified: 2024-02-15 16:36:16
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

import ASSERT from "@/utils/ASSERT";
import { error } from "@/utils/gyConsole";
import crypto from "crypto";
import EncryptionEngineBase from "../types/EncryptionEngineBase";
import { Buffer } from "buffer";
import scrypt from "scrypt-js";
import { isNodeJS } from "@/platform/platform";

const EncryptConfig = {
    algorithm: "aes-192-cbc",
    iv: new Uint8Array([86, 215, 125, 103, 83, 172, 176, 47, 18, 209, 131, 206, 48, 61, 70, 196]),
    cost: 2, // 默认：16384,
    salt: "gcrypt",
    keyLength: 24
};

class EncryptionEngineAES192 implements EncryptionEngineBase {
    private currentPwd: string = null;

    public init(pwd) {
        this.currentPwd = pwd;
    }

    /**
     * 加密数据
     * @param rawData
     */
    private encryptNode(rawData: Buffer): Promise<Buffer> {
        return new Promise(resolve => {
            ASSERT(!!this.currentPwd);
            try {
                crypto.scrypt(
                    this.currentPwd,
                    EncryptConfig.salt,
                    EncryptConfig.keyLength,
                    { cost: EncryptConfig.cost },
                    (err, key) => {
                        if (err) throw err;

                        const cipher = crypto.createCipheriv(EncryptConfig.algorithm, key, EncryptConfig.iv);
                        let encrypted = "";
                        cipher.setEncoding("binary");
                        cipher.on("data", chunk => {
                            encrypted += chunk;
                        });
                        cipher.on("end", () => {
                            resolve(Buffer.from(encrypted, "binary"));
                        });
                        cipher.write(rawData);
                        cipher.end();
                    }
                );
            } catch (e) {
                error("加密失败" + e.toString());
                throw e;
            }
        });
    }

    public encrypt(rawData: Buffer): Promise<Buffer> {
        if (isNodeJS()) {
            return this.encryptNode(rawData);
        } else {
            return this.encryptNode(rawData);
        }
    }

    /**
     * 解密数据
     * @param rawBufData 被加密的原始数据
     */
    private decryptNode(rawBufData: Buffer): Promise<Buffer> {
        return new Promise(resolve => {
            ASSERT(!!this.currentPwd);
            try {
                crypto.scrypt(
                    this.currentPwd,
                    EncryptConfig.salt,
                    EncryptConfig.keyLength,
                    { cost: EncryptConfig.cost },
                    (err, key) => {
                        if (err) throw err;

                        const decipher = crypto.createDecipheriv(EncryptConfig.algorithm, key, EncryptConfig.iv);
                        let decrypted = Buffer.from("");
                        decipher.on("readable", () => {
                            let chunk;
                            while ((chunk = decipher.read()) !== null) {
                                decrypted = Buffer.concat([decrypted, chunk]);
                            }
                        });
                        decipher.on("end", () => {
                            resolve(decrypted);
                        });
                        decipher.write(rawBufData, "binary");
                        decipher.end();
                    }
                );
            } catch (e) {
                error("解密失败" + e.toString());
                throw e;
            }
        });
    }

    private decryptBrowser(rawBufData: Buffer): Promise<Buffer> {
        return new Promise(resolve => {
            ASSERT(!!this.currentPwd);
            try {
                scrypt
                    .scrypt(
                        Buffer.from(this.currentPwd),
                        Buffer.from(EncryptConfig.salt),
                        EncryptConfig.cost,
                        8,
                        1,
                        EncryptConfig.keyLength
                    )
                    .then(key => {
                        const decipher = crypto.createDecipheriv(EncryptConfig.algorithm, key, EncryptConfig.iv);
                        let decrypted = Buffer.from("");
                        decipher.on("readable", () => {
                            let chunk;
                            while ((chunk = decipher.read()) !== null) {
                                decrypted = Buffer.concat([decrypted, chunk]);
                            }
                        });
                        decipher.on("end", () => {
                            resolve(decrypted);
                        });
                        decipher.write(rawBufData, "binary");
                        decipher.end();
                    });
            } catch (e) {
                error("解密失败" + e.toString());
                throw e;
            }
        });
    }

    public decrypt(rawData: Buffer): Promise<Buffer> {
        if (isNodeJS()) {
            return this.decryptNode(rawData);
        } else {
            return this.decryptBrowser(rawData);
        }
    }
}

export default EncryptionEngineAES192;
