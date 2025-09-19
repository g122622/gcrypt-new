// This file is used to test the KVPEngineFolder class.
import { describe, expect, test, beforeEach } from "vitest";
import KVPEngineQiniuV3Readonly from "../remote/KVPEngineQiniuV3Readonly";
import EncryptionEngineNoop from "../../encryptionEngines/EncryptionEngineNoop";

// 预先准备的测试数据（需要提前上传到测试bucket）
const TEST_DATA_MAP = new Map([
    [
        "testKey1", // 原始key
        Buffer.from("Hello, Qiniu!") // 原始数据
    ]
]);

describe("KVPEngineQiniuV3Readonly", () => {
    let kvpe: KVPEngineQiniuV3Readonly;
    let encryptionEngine: EncryptionEngineNoop;

    beforeEach(async () => {
        // 初始化引擎（使用真实测试配置）
        kvpe = new KVPEngineQiniuV3Readonly();
        kvpe.useMD5Hashing = false; // 关闭MD5哈希
        encryptionEngine = new EncryptionEngineNoop();
        encryptionEngine.init("123");

        // 从环境变量读取测试配置（建议在CI/CD中配置）
        await kvpe.initWithConfig(
            {
                domain: "test.charwind.top",
                ACCESS_KEY: "xxx",
                SECRET_KEY: "xxx",
                isHttps: false,
                bucketName: "gcrypt-test"
            },
            encryptionEngine
        );
    });

    test("hasData should return true for existing keys", async () => {
        // 遍历所有测试key验证存在性
        for (const [key] of TEST_DATA_MAP) {
            const exists = await kvpe.hasData(key);
            expect(exists).toBe(true);
        }
    }, 15000); // 延长超时时间

    test("getData should return correct decrypted data", async () => {
        for (const [key, expectedData] of TEST_DATA_MAP) {
            // 获取并解密数据
            const result = await kvpe.getData(key);

            // 验证数据一致性
            expect(result).toEqual(expectedData);

            // 验证key转换逻辑
            expect(await kvpe.hasData(key)).toBe(true); // 确保使用原始key能查到hashedKey
        }
    }, 15000); // 延长超时时间

    test("hasData should handle non-existent keys properly", async () => {
        const nonExistingKey = "non_existent_key_" + Date.now();
        const exists = await kvpe.hasData(nonExistingKey);
        expect(exists).toBe(false);
    }, 15000);
});
