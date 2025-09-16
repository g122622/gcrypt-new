import File from "@/backend/File";

export default interface FileActiveState {
    isOpen: boolean;
    isUsingTempFile: boolean;
    file: File;
}
