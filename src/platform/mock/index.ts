import mockBuffer from "./buffer";
import mockNodeProcess from "./process";

mockNodeProcess();
mockBuffer();

export default function mock() {
    console.log("Mocking complete.");
    return 0;
}
