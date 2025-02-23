import Electron from "electron";
import { isElectron } from "../platform";
const ipcRenderer: Electron.IpcRenderer = window.require("electron").ipcRenderer;
const shell: Electron.Shell = window.require("electron").shell;
const nativeImage: Electron.NativeImage = window.require("electron").nativeImage;
const webFrame: Electron.WebFrame = window.require("electron").webFrame;

const electron = {
    ipcRenderer,
    shell,
    nativeImage,
    webFrame
};

// mock
if (!isElectron()) {
    electron.ipcRenderer = {}
    electron.ipcRenderer.send = () => {};
}

export default electron;
