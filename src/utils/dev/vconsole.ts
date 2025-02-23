import VConsole from "vconsole";
import { useSettingsStore } from "@/store/settings";

let vConsole: VConsole = null;

function enableVConsole() {
    const settingsStore = useSettingsStore(window["pinia"]);
    vConsole = new VConsole({ theme: settingsStore.getSetting("is_dark") ? "dark" : "light" });
}

function disableVConsole() {
    if (vConsole) {
        vConsole.destroy();
        vConsole = null;
    }
}

function toggleVConsole() {
    if (vConsole) {
        disableVConsole();
    } else {
        enableVConsole();
    }
}

export { enableVConsole, disableVConsole, toggleVConsole };
