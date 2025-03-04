import { Disposable } from "@/utils/helpers/Disposable";

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

class LRUCache extends Disposable {
    private maxSizeInBytes: number; // 最大容量
    private maxPerKeySizeInBytes: number; // 每个 key 对应的 buffer 最大容量，超过该大小则无论如何都不会被缓存
    private currentSizeInBytes: number = 0; // 当前 key-value 的容量
    private hashMap: Map<string, LRUNode>;
    private head: LRUNode;
    private tail: LRUNode;

    /**
     * constructor
     * @param maxSizeInBytes 最大容量
     * @param maxPerKeySizeInBytes 每个 key 对应的 buffer 最大容量，超过该大小则无论如何都不会被缓存
     */
    constructor(maxSizeInBytes: number, maxPerKeySizeInBytes?: number) {
        super();
        if (maxSizeInBytes <= 0) {
            throw new Error("maxSizeInBytes must be a positive number");
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

    private removeLRUNode(): void {
        const lruNode = this.tail.prev!;
        this.removeNode(lruNode);
        this.hashMap.delete(lruNode.key);
        this.currentSizeInBytes -= lruNode.size;
    }

    public put(key: string, value: Buffer): void {
        if (value.byteLength > this.maxPerKeySizeInBytes) {
            return; // 超过最大容量则不缓存
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
            this.removeLRUNode();
        }
    }

    public get(key: string): Buffer | undefined {
        if (!this.hashMap.has(key)) {
            return undefined;
        }
        const node = this.hashMap.get(key)!;
        this.moveToHead(node);
        return node.value;
    }

    // 获取当前缓存大小
    public getcurrentSizeInBytes(): number {
        return this.currentSizeInBytes;
    }

    // 获取缓存中的键数量
    public getKeyCount(): number {
        return this.hashMap.size;
    }
}

export default LRUCache;
