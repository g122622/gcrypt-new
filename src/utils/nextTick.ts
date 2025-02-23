export default function nextTick(cb: Function) {
    setTimeout(() => {
        cb();
    }, 0);
}
