interface EntryJson {
    modifiedTime: number;
    createdTime: number;
    accessedTime: number;
    storageName: string;
    comment: string;
    storeType: "local" | "remote";
    config: {
        KVPEngine: string;
        adapter: string;
        encryptionEngine: string;
        remote?: {
            isHttps: boolean;
            domain: string;
            bucketName: string;
            ACCESS_KEY: string;
            SECRET_KEY: string;
        }
    };
}

export default EntryJson;
