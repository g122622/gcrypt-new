// This file is used to test the KVPEngineFolder class.
import { describe, expect, test, beforeEach } from "vitest";
import KVPEngineQiniuV3 from "../remote/KVPEngineQiniuV3";
import EncryptionEngineNoop from "../../encryptionEngines/EncryptionEngineNoop";

// 预先准备的测试数据
const TEST_DATA_TO_SEND_MAP = new Map([
    [
        "write-testKey1", // key
        Buffer.from("Hello, Qiniu!") // 数据
    ],
    [
        "write-testKey2", // key
        Buffer.from([114, 514, 191, 9810]) // 数据
    ],
    [
        "write-testKey3(empty)", // key
        Buffer.from("") // 数据
    ],
    [
        "write-testKey4(100KB)", // key
        Buffer.alloc(1024 * 100) // 数据
    ]
]);

describe("KVPEngineQiniuV3", () => {
    let kvpe: KVPEngineQiniuV3;
    let encryptionEngine: EncryptionEngineNoop;

    beforeEach(async () => {
        global.window = global;
        // 初始化引擎（使用真实测试配置）
        kvpe = new KVPEngineQiniuV3();
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

    test("setData should set data correctly", async () => {
        // 遍历所有测试key
        for (const [key, dataToSend] of TEST_DATA_TO_SEND_MAP) {
            // 设置数据
            await kvpe.setData(key, dataToSend);

            // 验证数据是否存在
            const exists = await kvpe.hasData(key);
            expect(exists).toBe(true); // 确保数据存在

            // 验证数据一致性
            const result = await kvpe.getData(key);
            expect(result).toEqual(dataToSend); // 验证数据内容

            // 删除数据
            await kvpe.deleteData(key); // 删除数据
            const existsAfterDelete = await kvpe.hasData(key);
            expect(existsAfterDelete).toBe(false); // 确保数据已被删除
        }
    }, 15000); // 延长超时时间
});
