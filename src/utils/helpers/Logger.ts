import dayjs from "dayjs";
import VFS from "@/utils/file/virtualFS";
import { isNodeJS } from "@/platform/platform";

/**
 * @class Logger
 * @description 将日志输出到本地log文件中
 * 每次开启app就会创建一个独立的log session， 每次关闭app就会关闭这个session，
 * 如果一个上下文环境拥有的session一致，则将日志输出到session对应的log文件中；
 * 这个session的生成算法：Logger实例化时的时间戳+进程ID+随机数
 */
class Logger {
    private session: string;
    private logFileName: string;
    private logFilePath: string;
    private logDirectory: string;
    private counter = 0;

    constructor(logDirectory: string) {
        this.session = `${Date.now()}-${process.pid}-${Math.floor(Math.random() * 1000000)}`;
        this.logFileName = `${this.session}.log`;
        this.logFilePath = `${logDirectory}/${this.logFileName}`;
        this.logDirectory = logDirectory;
    }

    /**
     * 日志输出
     * @param message 日志信息
     * @note 日志格式：`2024-12-01 15:31:43.161 [info] [编号]`
     */
    async log(message: string, level = "info") {
        const logContent = `[${++this.counter}] [${level}] [${dayjs().format("YYYY-MM-DD HH:mm:ss.SSS")}] ${message}`;
        // 写入日志文件
        try {
            await VFS.appendFile(this.logFilePath, logContent + "\n");
        } catch (error) {
            // 写入失败，尝试重新创建日志文件
            try {
                if (!isNodeJS()) {
                    await VFS.mkdir(this.logDirectory, { recursive: true });
                }
                await VFS.writeFile(this.logFilePath, logContent + "\n");
            } catch (error) {
                console.error(`Failed to write log to file ${this.logFilePath} \n reason: ${error}`);
            }
        }
    }

    resetCounter() {
        this.counter = 0;
    }

    setLogDirectory(logDirectory: string) {
        this.logFilePath = `${logDirectory}/${this.logFileName}`;
        this.logDirectory = logDirectory;
    }
}

const logger = isNodeJS() ? new Logger("logs") : new Logger("/IndexedDB/logs");

export default logger;
