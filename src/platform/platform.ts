function isNodeJS() {
    return !!(typeof process === "object" && typeof require === "function" && process.versions && process.versions.node);
}

function isElectron() {
    return !!(typeof process === "object" && process.versions && process.versions.electron);
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export { isNodeJS, isElectron, isMobile };
