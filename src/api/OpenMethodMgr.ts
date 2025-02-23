import { error } from "@/utils/gyConsole";
import File from "./File";

declare interface IOpenMethod {
    name: string; // 必须唯一，不能重复
    icon: string;
    fileType: Array<string> | RegExp; // 可以用正则表达式
    onSelected: (file: File, extra) => void;
}

const formatFileType = (arg: string) => {
    return arg.replaceAll(".", "").toLowerCase();
};

class OpenMethodMgr {
    private methods: Array<IOpenMethod> = [];

    public getMatchedMethod(fileType: string) {
        // 空字符串表示没有扩展名的文件，这将匹配全部打开方法
        if (fileType === "") {
            return this.methods;
        }
        // 无效类型将不匹配任何方法
        if (!fileType) {
            error("传入的类型无效");
            return [];
        }
        return this.methods.filter(item => {
            if (item.fileType instanceof Array) {
                return item.fileType.includes(formatFileType(fileType));
            } else if (item.fileType instanceof RegExp) {
                return item.fileType.exec(fileType)?.length;
            }
            return false;
        });
    }

    public registerMethod = (openMethod: IOpenMethod) => {
        if (this.methods.find(item => item.name === openMethod.name)) {
            error("method name 重名了:" + openMethod.name);
            return;
        }
        this.methods.push(openMethod);
    };

    public getMethodByName = (name: string) => {
        return this.methods.find(item => item.name === name);
    };

    public removeMethodByName = (name: string) => {
        this.methods = this.methods.filter(item => item.name !== name);
    };
}

export { OpenMethodMgr };
export type { IOpenMethod };
