const fileTypes = {
    excel: ["xls", "xlsx"],
    word: ["doc", "docx"],
    ppt: ["ppt", "pptx"],
    audio: ["mp3", "ogg", "wav", "m4a", "aac", "flac"],
    code: [
        "js",
        "ts",
        "vue",
        "jsx",
        "css",
        "cpp",
        "h",
        "c",
        "java",
        "php",
        "sql",
        "sh",
        "bat",
        "ps1",
        "pl",
        "rb",
        "lua",
        "go",
        "swift",
        "scala",
        "erl",
        "clj",
        "cljs",
        "cljc",
        "ex",
        "exs",
        "rs",
        "r",
        "jl",
        "dart",
        "kt",
    ],
    video: ["mp4", "mkv", "webm", "avi", "flv", "mov"],
    link: ["html", "lnk"],
    img: ["heic", "jpg", "jpeg", "png", "webp", "ico", "bmp", "svg", "psd", "raw"],
    zip: ["7z", "zip", "rar", "gz", "iso", "dmg"],
    gif: ["gif"],
    exe: ["exe", "msi", "app", "apk"],
    pdf: ["pdf"],
    txt: ["txt", "md", "log"],
    db: ["db", "dat"],
    config: ["ini", "json", "cfg", "xml", "yaml", "yml"]
};

const toHashMapAndLowerCase = (obj: typeof fileTypes) => {
    const ret = {};
    Object.keys(obj).forEach(key => obj[key].forEach(v => (ret[v] = key.toLocaleLowerCase())));
    return ret;
};

const fileTypesHashMap = toHashMapAndLowerCase(fileTypes);

export { fileTypes, fileTypesHashMap };
