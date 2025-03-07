const handler = event => {
    // Cancel the event as stated by the standard.
    event.preventDefault();
    // Chrome requires returnValue to be set.
    event.returnValue = "";
};

export function preventPageClose() {
    window.addEventListener("beforeunload", handler);
}

export function allowPageClose() {
    window.removeEventListener("beforeunload", handler);
}
