// // This file is used to test the KVPEngineFolder class.
// import { describe, expect, test, vi } from "vitest";
// import KVPEngineFolder from "@/api/core/KVPEngines/KVPEngineFolder";
// import VFS from "@/utils/file/virtualFS";
// import EncryptionEngineNoop from "../../encryptionEngines/EncryptionEngineNoop";
// import getDigest from "@/api/hash/getDigest";

// // Mock the external dependencies
// vi.mock("@/utils/file/virtualFS");
// vi.mock("@/api/hash/getDigest");

// describe("KVPEngineFolder", (beforeEach) => {
//     let kvpe: KVPEngineFolder;
//     let encryptionEngine: EncryptionEngineNoop;

//     beforeEach(async () => {
//         // Initialize the engine with mock dependencies
//         kvpe = new KVPEngineFolder();
//         encryptionEngine = new EncryptionEngineNoop();

//         // Reset all mocks before each test
//         vi.resetAllMocks();

//         // Setup a default mock implementation for getDigest
//         (getDigest as any).mockImplementation(data => Buffer.from(data.toString()).toString("hex"));

//         await kvpe.init("/path/to/entry.json", encryptionEngine);
//     });

//     test("hasData should return true when data exists", async () => {
//         const key = "existingKey";
//         const digest = getDigest(Buffer.from(key), "md5");
//         const dataFilePath = calcDataFileSrc("/path/to/entry.json", digest);

//         // Mock VFS.access to resolve without throwing an error
//         (VFS.access as any).mockResolvedValue(undefined);

//         const result = await kvpe.hasData(key);
//         expect(result).toBe(true);
//         expect(VFS.access).toHaveBeenCalledWith(dataFilePath);
//     });

//     test("getData should return decrypted buffer if data exists", async () => {
//         const key = "existingKey";
//         const data = Buffer.from("some encrypted data");
//         const decryptedData = Buffer.from("some decrypted data");

//         // Mock methods
//         (VFS.readFile as any).mockResolvedValue(data);
//         (encryptionEngine.decrypt as any).mockResolvedValue(decryptedData);

//         const result = await kvpe.getData(key);
//         expect(result).toEqual(decryptedData);
//     });

//     test("setData should write encrypted data to the correct path", async () => {
//         const key = "newKey";
//         const buf = Buffer.from("some data to encrypt");

//         // Mock methods
//         const encryptedData = Buffer.from("encrypted data");
//         (encryptionEngine.encrypt as any).mockResolvedValue(encryptedData);

//         await kvpe.setData(key, buf);
//         expect(VFS.writeFile).toHaveBeenCalledWith(expect.any(String), encryptedData);
//     });

//     test("deleteData should remove the file for the given key", async () => {
//         const key = "keyToDelete";

//         await kvpe.deleteData(key);
//         expect(VFS.unlink).toHaveBeenCalledWith(expect.any(String));
//     });
// });

// // Utility function to calculate data file source path
// function calcDataFileSrc(entryJsonSrc, dataFileName: string) {
//     let foo = entryJsonSrc.split("/");
//     foo.pop();
//     foo.push(dataFileName);
//     return foo.join("/");
// }
