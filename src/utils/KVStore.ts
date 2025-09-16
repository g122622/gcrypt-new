import ElectronStore from "@/platform/electron/electronStore";
import { isElectron } from "@/platform/platform";

// 定义 IKVStore 接口
interface IKVStore {
    // 获取存储项，如果不存在则返回默认值
    get(key: string, defaultValue?: any): any;

    // 设置存储项
    set(key: string, value: any): void;

    // 删除存储项
    delete(key: string): void;

    // 清除所有存储项
    clear(): void;

    // 检查是否存在某个键
    has(key: string): boolean;
}

class KVStoreElectron implements IKVStore {
    private store: ElectronStore;
    constructor(config: { name: string; fileExtension?: string; encryptionKey?: string; clearInvalidConfig?: boolean }) {
        this.store = new ElectronStore({
            name: config.name,
            fileExtension: config.fileExtension || "json",
            encryptionKey: config.encryptionKey || "gcrypt",
            clearInvalidConfig: config.clearInvalidConfig || false
        });
    }

    get(key: string, defaultValue?: any) {
        return this.store.get(key, defaultValue);
    }

    set(key: string, value: any) {
        this.store.set(key, value);
    }

    delete(key: string) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }

    has(key: string) {
        return this.store.has(key);
    }
}

class KVStoreWeb implements IKVStore {
    private name: string;
    private encryptionKey: string;
    private clearInvalidConfig: boolean;

    constructor(config) {
        this.name = config.name;
        this.encryptionKey = config.encryptionKey || "gcrypt";
        this.clearInvalidConfig = config.clearInvalidConfig || false;

        // Initialize the store with an empty object if it doesn't exist
        if (!localStorage.getItem(this.name)) {
            localStorage.setItem(this.name, JSON.stringify({}));
        }
    }

    get(key, defaultValue?) {
        try {
            const store = JSON.parse(localStorage.getItem(this.name));
            return key in store ? store[key] : defaultValue;
        } catch (error) {
            console.error("Error reading from localStorage:", error);
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            let store = JSON.parse(localStorage.getItem(this.name)) || {};
            store[key] = value;
            localStorage.setItem(this.name, JSON.stringify(store));
        } catch (error) {
            console.error("Error writing to localStorage:", error);
            throw error;
        }
    }

    delete(key) {
        try {
            let store = JSON.parse(localStorage.getItem(this.name));
            if (key in store) {
                delete store[key];
                localStorage.setItem(this.name, JSON.stringify(store));
            }
        } catch (error) {
            console.error("Error deleting from localStorage:", error);
            throw error;
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.name);
        } catch (error) {
            console.error("Error clearing localStorage:", error);
        }
    }

    has(key) {
        try {
            const store = JSON.parse(localStorage.getItem(this.name));
            return key in store;
        } catch (error) {
            console.error("Error checking key in localStorage:", error);
            return false;
        }
    }
}

const KVStore = isElectron() ? KVStoreElectron : KVStoreWeb;

export default KVStore;
