import emitter from "@/eventBus";

const changeGlobalOperationState = (state: string) => {
    emitter.emit("globalOperationStateChanged", state);
};

const resetGlobalOperationState = () => {
    changeGlobalOperationState("就绪");
};

export { changeGlobalOperationState, resetGlobalOperationState };
