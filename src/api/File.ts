/* eslint-disable dot-notation */
import os from "os";
import path from "path";
import VFS from "@/utils/file/virtualFS";
import getExtName from "@/utils/file/getExtName";
import sharedUtils from "@/utils/sharedUtils";
import FileWatcher from "./FileWatcher";
import IAdapter from "./core/types/IAdapter";
import { useSettingsStore } from "@/store/settings";
import { useMainStore } from "@/store/main";
import emitter from "@/eventBus";
import Addr from "./core/common/Addr";
import { useTaskStore } from "@/store/task";
import Task from "./Task";
import { Buffer } from "buffer";
import { error, warn } from "@/utils/gyConsole";
import { isNodeJS } from "@/platform/platform";
import downloadBufferFile from "@/utils/shell/downloadBufferFile";
import openBufferFileInNewTab from "@/utils/shell/openBufferFileInNewTab";
import { Disposable } from "@/utils/helpers/Disposable";
import changeFavicon from "@/utils/DOM/changeFavicon";

let taskStore = null;
let settingsStore = null;
let mainStore = null;

enum FileType {
    RawData,
    Adapter,
    Ref
}

// 初始化过早会导致找不到活跃pinia实例
emitter.on("LifeCycle::finishedLoadingApp", () => {
    settingsStore = useSettingsStore(window["pinia"]);
    mainStore = useMainStore(window["pinia"]);
    taskStore = useTaskStore(window["pinia"]);
});

class File extends Disposable {
    private data;
    private adapter: IAdapter;
    private fileWatcher: FileWatcher = null;
    public filename: string;
    private fileguid: string;
    private fileType: FileType;
    private AdapterCWD: Addr;
    private tmpFilePath: string;

    constructor(fileguid = sharedUtils.getHash(16)) {
        super();
        this.fileguid = fileguid;
        mainStore.setFileActiveState(fileguid, "file", this);

        this._register({
            dispose: async () => {
                // 先销毁文件watcher，再删除临时文件，
                // 若顺序颠倒则会在删除的时候触动fileWatcher，造成死循环
                if (this.fileWatcher) {
                    await this.fileWatcher.dispose();
                }
                mainStore.activeFiles.delete(this.fileguid);
            }
        });
    }

    public fromRawData(arg) {
        this.data = arg;
        this.fileType = FileType.RawData;
    }

    public fromRef(arg) {
        this.data = arg;
        this.fileType = FileType.Ref;
    }

    public async fromAdapter(adapter: IAdapter, filename: string) {
        this.adapter = adapter;
        this.filename = filename;
        this.fileType = FileType.Adapter;
        this.AdapterCWD = adapter.getCurrentDirectory();
        if (this.fileguid) {
            mainStore.setFileActiveState(this.fileguid, "isOpen", true);
        }
    }

    /**
     * 将文件对象转为基于临时文件的文件对象，并返回临时文件的地址
     */
    public async toTempFile() {
        if (!isNodeJS()) {
            error("临时文件功能仅支持NodeJS环境");
            throw new Error("临时文件功能仅支持NodeJS环境");
        }
        // 不得重复操作
        if (this.tmpFilePath) {
            warn("文件已转为临时文件，请勿重复操作");
            return;
        }
        // 创建临时文件
        this.tmpFilePath = path.join(os.tmpdir(), sharedUtils.getHash(16) + "." + getExtName(this.filename));
        await VFS.writeFile(this.tmpFilePath, await this.read());

        // 注册dispose方法，删除临时文件
        this._register({
            dispose: async () => {
                if (this.tmpFilePath) {
                    await VFS.unlink(this.tmpFilePath);
                }
            }
        });

        // 创建filewatcher，监听临时文件修改
        this.fileWatcher = new FileWatcher(this.tmpFilePath, {
            minUpdateIntervalMs: Number(settingsStore.getSetting("tmp_file_sync_interval")),
            destroyIfNotOccupied: false
        });
        this.fileWatcher.onChange = async () => {
            const newTmpFile = await VFS.readFile(this.tmpFilePath);
            await this.write(newTmpFile);
        };
        this.fileWatcher.onDestroyed = () => {
            // 修改文件状态
            if (this.fileguid) {
                mainStore.setFileActiveState(this.fileguid, "isUsingTempFile", false);
            }
        };

        // 修改文件状态
        if (this.fileguid) {
            mainStore.setFileActiveState(this.fileguid, "isUsingTempFile", true);
        }

        return this.tmpFilePath;
    }

    public async download() {
        downloadBufferFile(await this.read(), this.filename);
    }

    public async openInNewTab() {
        console.log(changeFavicon);
        this._register(openBufferFileInNewTab(await this.read(), this.filename));
    }

    public async read() {
        switch (this.fileType) {
            case FileType.RawData:
                return this.data;

            case FileType.Adapter:
                return await this.adapter.readFile(this.filename, this.AdapterCWD);

            case FileType.Ref:
                return this.data.value;
        }
    }

    /**
     * 写入文件
     * @param arg 在adapter模式下会自动转为buffer
     */
    public async write(arg) {
        switch (this.fileType) {
            case FileType.RawData:
                this.data = arg;
                break;

            case FileType.Adapter:
                return await this.adapter.writeFile(this.filename, Buffer.from(arg), this.AdapterCWD);

            case FileType.Ref:
                this.data.value = arg;
                break;
        }
    }

    /**
     * 导出文件到外部（vfs）
     * @param path 不包含文件名称！
     */
    public async exportToExt(folderPath: string) {
        const destPath = path.join(folderPath, this.filename ?? sharedUtils.getHash(7));
        taskStore.addTask(
            new Task(
                async () => {
                    await VFS.writeFile(destPath, await this.read());
                },
                { name: `导出文件 ${destPath}` }
            ),
            { runImmediately: true }
        );
    }
}

export default File;
