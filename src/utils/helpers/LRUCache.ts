import { Disposable } from "@/utils/helpers/Disposable";

/**
 * LRUNode 是 LRUCache 中的节点。
 * 每个节点包含一个 key、一个 value 和一个 size，
 * 以及指向前一个节点和后一个节点的指针。
 */
class LRUNode {
    key: string;
    value: Buffer;
    size: number;
    prev: LRUNode | null;
    next: LRUNode | null;

    constructor(key: string, value: Buffer) {
        this.key = key;
        this.value = value;
        this.size = value.byteLength;
        this.prev = null;
        this.next = null;
    }
}

/**
 * LRUCache 是一个基于哈希表和双向链表的 LRU 缓存实现。
 * 它支持快速查找、插入和删除操作，并且可以根据缓存的大小自动删除最久未使用的节点。
 * 该缓存的最大容量和每个 key 对应的 buffer 最大容量都可以在初始化时指定。
 */
class LRUCache extends Disposable {
    private maxSizeInBytes: number; // 最大容量
    private maxPerKeySizeInBytes: number; // 每个 key 对应的 buffer 最大容量，超过该大小则无论如何都不会被缓存
    private currentSizeInBytes: number = 0; // 当前 key-value 的容量
    private hashMap: Map<string, LRUNode>; // 为了快速查找，使用哈希表存储节点
    private head: LRUNode;
    private tail: LRUNode;

    /**
     * constructor
     * @param maxSizeInBytes 最大容量
     * @param maxPerKeySizeInBytes 每个 key 对应的 buffer 最大容量，超过该大小则无论如何都不会被缓存
     */
    constructor(maxSizeInBytes: number, maxPerKeySizeInBytes?: number) {
        super();
        if (maxSizeInBytes < 0) {
            throw new Error("maxSizeInBytes must be a positive number or 0");
        }
        this.maxSizeInBytes = maxSizeInBytes;
        if (maxPerKeySizeInBytes < 0 || !maxPerKeySizeInBytes) {
            // default set to maxSizeInBytes
            this.maxPerKeySizeInBytes = maxSizeInBytes;
        } else {
            this.maxPerKeySizeInBytes = maxPerKeySizeInBytes;
        }
        this.hashMap = new Map();
        // 初始化虚拟头尾节点
        this.head = new LRUNode("", Buffer.alloc(0));
        this.tail = new LRUNode("", Buffer.alloc(0));
        this.head.next = this.tail;
        this.tail.prev = this.head;
        // 注册自身到 Disposable 管理器
        this._register({
            dispose: () => {
                this.hashMap.clear();
                this.head.next = null;
                this.tail.prev = null;
                this.head = null;
                this.tail = null;
                this.hashMap = null;
            }
        });
    }

    private addToHead(node: LRUNode): void {
        node.prev = this.head;
        node.next = this.head.next;
        this.head.next!.prev = node;
        this.head.next = node;
    }

    private removeNode(node: LRUNode): void {
        const prevNode = node.prev!;
        const nextNode = node.next!;
        prevNode.next = nextNode;
        nextNode.prev = prevNode;
    }

    private moveToHead(node: LRUNode): void {
        this.removeNode(node);
        this.addToHead(node);
    }

    public put(key: string, value: Buffer): void {
        if (value.byteLength > this.maxPerKeySizeInBytes) {
            // 超过最大容量则不缓存
            // 坑：为了确保使用者对于数据一致性的要求，key超过maxPerKeySizeInBytes的情况下需要删除key对应的数据（如果存在）
            this.remove(key);
            return;
        }
        if (this.hashMap.has(key)) {
            // 更新现有节点
            const node = this.hashMap.get(key)!;
            this.currentSizeInBytes -= node.size;
            node.value = value;
            node.size = value.byteLength;
            this.currentSizeInBytes += node.size;
            this.moveToHead(node);
        } else {
            // 创建新节点
            const newNode = new LRUNode(key, value);
            this.hashMap.set(key, newNode);
            this.addToHead(newNode);
            this.currentSizeInBytes += newNode.size;
        }

        // 淘汰最近最少使用的节点，直到容量符合要求
        while (this.currentSizeInBytes > this.maxSizeInBytes && this.hashMap.size > 0) {
            const lruNode = this.tail.prev!;
            this.removeNode(lruNode);
            this.hashMap.delete(lruNode.key);
            this.currentSizeInBytes -= lruNode.size;
        }

        // console.log(`当前已用容量: ${prettyBytes(this.currentSizeInBytes)}，最大容量: ${prettyBytes(this.maxSizeInBytes)}`);
    }

    public get(key: string): Buffer | undefined {
        if (!this.hashMap.has(key)) {
            return undefined;
        }
        const node = this.hashMap.get(key)!;
        this.moveToHead(node);
        return node.value;
    }

    /**
     * 对上层应用暴露，用于移除指定 key 的缓存
     * @param key 键
     * @note 由于LRUCache会自动管理缓存的淘汰，因此上层应用调用这个方法的目的不应该是为了释放内存，
     * 而是为了显式地移除数据（比如文件被删除时）
     */
    public remove(key: string): void {
        if (this.hashMap.has(key)) {
            const node = this.hashMap.get(key)!;
            this.removeNode(node);
            this.hashMap.delete(key);
            this.currentSizeInBytes -= node.size;
        }
    }

    // 获取当前缓存大小
    public getcurrentSizeInBytes(): number {
        return this.currentSizeInBytes;
    }

    // 获取缓存中的键数量
    public getKeyCount(): number {
        return this.hashMap.size;
    }

    /**
     * 清理过期数据
     * @note 不会改变缓存的现有配置
     */
    public clear(): void {
        this.hashMap.clear();
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.currentSizeInBytes = 0;
    }
}

// /**
//  * 类装饰器，为实现了IKVPEngine的类添加LRU缓存功能
//  * @param maxCacheSize 最大缓存大小（字节）
//  * @param maxPerKeySize 每个键的最大缓存大小（字节）
//  */
// function WithLRUCache(maxCacheSize: number, maxPerKeySize?: number) {
//     return function <T extends new (...args: any[]) => IKVPEngine>(target: T) {
//         return class extends target {
//             private cache: LRUCache;

//             constructor(...args: any[]) {
//                 super(...args);
//                 this.cache = new LRUCache(maxCacheSize, maxPerKeySize);

//                 // 注册缓存清理到Disposable
//                 const originalDispose = this.dispose.bind(this);
//                 this.dispose = () => {
//                     this.cache.dispose();
//                     originalDispose();
//                 };
//             }

//             async getData(key: string): Promise<Buffer | null> {
//                 // 先从缓存中获取
//                 const cachedData = this.cache.get(key);
//                 if (cachedData) {
//                     return cachedData;
//                 }

//                 // 缓存中没有，调用原始方法获取
//                 const data = await super.getData(key);
//                 if (data) {
//                     this.cache.put(key, data);
//                 }

//                 return data;
//             }

//             async setData(key: string, value: Buffer): Promise<void> {
//                 // 先更新缓存
//                 this.cache.put(key, value);

//                 // 调用原始方法持久化
//                 await super.setData(key, value);
//             }

//             async deleteData(key: string): Promise<void> {
//                 // 先删除缓存
//                 this.cache.remove(key);

//                 // 调用原始方法删除
//                 await super.deleteData(key);
//             }

//             async hasData(key: string): Promise<boolean> {
//                 // 先检查缓存
//                 if (this.cache.get(key)) {
//                     return true;
//                 }

//                 // 缓存中没有，调用原始方法检查
//                 return super.hasData(key);
//             }
//         };
//     };
// }

export default LRUCache;
// export { WithLRUCache };
