import getExtName from "./getExtName";

// 创建一个映射，关联文件扩展名和对应的 MIME 类型
const mimeTypeMap = {
    // images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    // texts
    txt: "text/plain",
    md: "text/markdown",
    // videos
    mp4: "video/mp4",
    webm: "video/webm",
    // audio
    mp3: "audio/mp3",
    wav: "audio/wav",
    // other
    pdf: "application/pdf",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",
    bz2: "application/x-bzip2"
};

// 根据文件名推测 MIME 类型
export default function getMimeType(fileName): string {
    const ext = getExtName(fileName);
    // 使用扩展名查找对应的 MIME 类型，如果没有找到，则返回默认类型
    return mimeTypeMap[ext.toLowerCase()] || "application/octet-stream";
}

