import EncryptionEngineNoop from "@/backend/core/encryptionEngines/EncryptionEngineNoop";
import KVPEngineQiniuV3 from "@/backend/core/KVPEngines/remote/KVPEngineQiniuV3";

export default async function test() {
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

    const kvpe = new KVPEngineQiniuV3();
    kvpe.useMD5Hashing = false; // 关闭MD5哈希
    const encryptionEngine = new EncryptionEngineNoop();
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

    // 遍历所有测试key
    for (const [key, dataToSend] of TEST_DATA_TO_SEND_MAP) {
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
    }
}
