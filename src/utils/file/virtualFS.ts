import nodeFS from "@/platform/nodejs/fs";
import { configure, InMemory, promises as zenFS_promises } from "@zenfs/core";
// import notification from "@/backend/notification";
import { isNodeJS } from "@/platform/platform";
import { IndexedDB, WebStorage } from "@zenfs/dom";
import { success } from "../gyConsole";

// interface VirtualFS {
//     readFileSync(path: string, options?: { encoding?: BufferEncoding | null; flag?: string }): Buffer | string;
//     writeFileSync(
//         path: string,
//         data: string | Buffer,
//         options?: { encoding?: "utf8" | "ascii" | "binary" | "base64" | "hex" | null }
//     ): void;
//     existsSync(path: string): boolean;
//     mkdirSync(path: string, options?: { recursive?: boolean; mode?: number }): void;

//     // async methods
//     // 函数重载：当 encoding 被指定时，返回 Promise<string>
//     readFile(path: string, options: { encoding: string; flag?: string }): Promise<string>;
//     // 函数重载：当 encoding 未被指定或为 null 时，返回 Promise<Buffer>
//     readFile(path: string, options?: { encoding?: null; flag?: string }): Promise<Buffer>;
//     writeFile(path: string, data: string | Buffer, options?: { encoding?: string; mode?: number; flag?: string }): Promise<void>;
//     mkdir(path: string, options?: { recursive?: boolean; mode?: number }): Promise<void>;
//     unlink(path: string): Promise<void>;
//     access(path: string): Promise<void>;
// }

// const handleException = (e: any, shouldThrow = true) => {
//     if (e.code === "ENOENT") {
//         notification.error("[fs]文件不存在：" + e.message);
//     } else if (e.code === "EACCES") {
//         notification.error("[fs]没有权限操作文件，请以管理员身份运行：" + e.message);
//     } else if (e.code === "EBUSY") {
//         notification.error("[fs]文件正在使用，请稍后重试：" + e.message);
//     } else {
//         notification.error("[fs]操作文件失败：" + e.message);
//     }
//     if (shouldThrow) {
//         throw e;
//     }
// };

// init
console.log("开始初始化虚拟文件系统");
const configureOptions = {
    mounts: {
        "/Mem": InMemory, // 内存存储
        "/IndexedDB": IndexedDB, // 持久化存储
        "/WebStorage": WebStorage // 本地存储
    }
};
configure(configureOptions).then(() => {
    success("虚拟文件系统初始化完成，挂载完毕");
});

// const VFS_Zen: VirtualFS = {
//     readFileSync: (path: string, options?: { encoding?: BufferEncoding | null; flag?: string }) => {
//         try {
//             return zenFS.readFileSync(path, options);
//         } catch (e) {
//             handleException(e);
//         }
//     },
//     writeFileSync: (
//         path: string,
//         data: string | Buffer,
//         options?: { encoding?: "utf8" | "ascii" | "binary" | "base64" | "hex" | null }
//     ) => {
//         try {
//             return zenFS.writeFileSync(path, data, { encoding: options.encoding });
//         } catch (e) {
//             handleException(e);
//         }
//     },
//     existsSync: (path: string) => {
//         try {
//             return zenFS.existsSync(path);
//         } catch (e) {
//             handleException(e);
//         }
//     },
//     mkdirSync: (path: string, options?: { recursive?: boolean; mode?: number }) => {
//         try {
//             return zenFS.mkdirSync(path, options);
//         } catch (e) {
//             handleException(e);
//         }
//     },
//     readFile: (path: string, options?: { encoding?: string; flag?: string }): Promise<string | Buffer> => {
//         return new Promise((resolve, reject) => {
//             try {
//                 zenFS.readFile(path, options, (err, data) => {
//                     if (err) {
//                         handleException(err, false);
//                         reject(err);
//                     } else {
//                         resolve(data);
//                     }
//                 });
//             } catch (e) {
//                 reject(e);
//             }
//         });
//     },
//     writeFile: (path: string, data: string | Buffer, options?: { encoding?: string; mode?: number; flag?: string }) => {
//         return new Promise((resolve, reject) => {
//             try {
//                 zenFS.writeFile(path, data, options, err => {
//                     if (err) {
//                         handleException(err, false);
//                         reject(err);
//                     } else {
//                         resolve();
//                     }
//                 });
//             } catch (e) {
//                 reject(e);
//             }
//         });
//     },
//     mkdir: (path: string, options?: { recursive?: boolean; mode?: number }) => {
//         return new Promise((resolve, reject) => {
//             try {
//                 zenFS.mkdir(path, options, err => {
//                     if (err) {
//                         handleException(err, false);
//                         reject(err);
//                     } else {
//                         resolve();
//                     }
//                 });
//             } catch (e) {
//                 reject(e);
//             }
//         });
//     },
//     unlink: (path: string) => {
//         return new Promise((resolve, reject) => {
//             try {
//                 zenFS.unlink(path, err => {
//                     if (err) {
//                         handleException(err, false);
//                         reject(err);
//                     } else {
//                         resolve();
//                     }
//                 });
//             } catch (e) {
//                 reject(e);
//             }
//         });
//     },
//     access: (path: string) => {
//         return new Promise((resolve, reject) => {
//             try {
//                 zenFS.access(path, err => {
//                     if (err) {
//                         handleException(err, false);
//                         reject(err);
//                     } else {
//                         resolve();
//                     }
//                 });
//             } catch (e) {
//                 reject(e);
//             }
//         });
//     }
// };

const VFS: typeof nodeFS = (isNodeJS() ? nodeFS : zenFS_promises) as typeof nodeFS;
export default VFS;
