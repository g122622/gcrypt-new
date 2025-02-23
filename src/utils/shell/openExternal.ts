import electron from "@/platform/electron/electronAPI";
import { isElectron } from "@/platform/platform";
import revealInBuiltinFileMgr from "./revealInBuiltinFileMgr";

export default function openExternal(str: string) {
    if (isElectron()) {
        return electron.shell.openExternal(str);
    } else {
        revealInBuiltinFileMgr(str);
    }
}
