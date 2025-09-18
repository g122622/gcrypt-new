import EncryptionEngineAES192 from "@/backend/core/encryptionEngines/EncryptionEngineAES192";
import KVPEngineQiniuV3 from "@/backend/core/KVPEngines/remote/KVPEngineQiniuV3";
import { log, success } from "@/utils/gyConsole";

export default async function test() {
    // 预先准备的测试数据
    const TEST_DATA_TO_SEND_MAP = new Map([
        [
            "write-testKey1", // key
            Buffer.from("Hello, Qiniu!") // 数据
        ],
        [
            "write-testKey2(empty)", // key
            Buffer.from("") // 数据
        ],
        [
            "write-testKey3(100KB)", // key
            Buffer.alloc(1024 * 100) // 数据
        ]
    ]);

    const kvpe = new KVPEngineQiniuV3();
    kvpe.useMD5Hashing = true; // 关闭MD5哈希
    const encryptionEngine = new EncryptionEngineAES192();
    encryptionEngine.init("123");

    // 从环境变量读取测试配置（建议在CI/CD中配置）
    await kvpe.initWithConfig(
        {
            domain: "test.charwind.top",
            ACCESS_KEY: "amGAGNk2frQQ4-jnKe2WjC2dNzUQ7SD65TBSInKl",
            SECRET_KEY: "9JMkKikNQv_I4kAh_lsMP8qZ09-heaqqi2u3rbcg",
            isHttps: false,
            bucketName: "gcrypt-test"
        },
        encryptionEngine
    );

    // 测试读取一个不存在的key
    const nonExistentKey = "non-existent-key";
    const nonExistentData = await kvpe.getData(nonExistentKey);
    console.log(nonExistentData === null);
    const nonExistentData2 = await kvpe.hasData(nonExistentKey);
    console.log(nonExistentData2 === false);

    // 遍历所有测试key
    for (const [key, dataToSend] of TEST_DATA_TO_SEND_MAP) {
        log(`[KVPEQiniuUnit] 测试key: ${key}`);

        // 设置数据
        await kvpe.setData(key, dataToSend);

        // 验证数据是否存在
        const exists = await kvpe.hasData(key);
        console.log(exists === true);

        // 验证数据一致性
        const result = await kvpe.getData(key);
        console.log(result.equals(dataToSend));

        // 删除数据
        await kvpe.deleteData(key); // 删除数据
        const existsAfterDelete = await kvpe.hasData(key);
        console.log(existsAfterDelete === false);
        const foo = await kvpe.getData(key);
        console.log(foo === null);

        // 重复删除数据
        await kvpe.deleteData(key); // 删除数据
        const existsAfterDelete2 = await kvpe.hasData(key);
        console.log(existsAfterDelete2 === false);
        const foo2 = await kvpe.getData(key);
        console.log(foo2 === null);

        // 测试删除后是否可以重新设置数据
        // 设置数据
        await kvpe.setData(key, dataToSend);

        // 验证数据是否存在
        const exists2 = await kvpe.hasData(key);
        console.log(exists2 === true);

        // 验证数据一致性
        const result2 = await kvpe.getData(key);
        console.log(result2.equals(dataToSend));

        success(`[KVPEQiniuUnit] 测试key: ${key} 测试完成!`);
    }
}
