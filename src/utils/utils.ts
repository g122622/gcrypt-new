/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-var-requires */
// SPDX-License-Identifier: GPL-3.0-or-later
// License: GNU GPLv3 or later. See the license file in the project root for more information.
// Copyright © 2021 - present Aleksey Hoffman. All rights reserved.

const ColorUtils = require("./colorUtils.js");
const colorUtils = new ColorUtils();

// try { require(`dayjs/locale/${detectedLocale}`) } catch (error) { }

export default {
    env: process.env.NODE_ENV,
    platform: process.platform,
    unixHiddenFileRegex: /(^|[\/\\])\../,

    templateToString(templateLiteralString) {
        return templateLiteralString
            .split("\n")
            .map(line => {
                return line.replace(/^\s+/gm, "");
            })
            .join("")
            .trim();
    },
    getNumRange(startIndex, endIndex) {
        return [...Array(endIndex + 1).keys()].slice(startIndex);
    },
    getDataType(value) {
        const isArray = Array.isArray(value);
        const isObject =
            typeof value === "object" && value !== null && !Array.isArray(value) && value.constructor.name !== "Array";

        if (isObject) {
            return "object";
        } else if (isArray) {
            return "array";
        } else {
            return typeof value;
        }
    },
    objectsHaveSameKeys(...objects) {
        const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
        const union = new Set(allKeys);
        return objects.every(object => union.size === Object.keys(object).length);
    },
    // deepObjectsHaveSameKeys(o1, o2) {
    //     if (o1 === null && o2 === null) { return true }

    //     const o1keys = o1 === null ? new Set() : new Set(Object.keys(o1))
    //     const o2keys = o2 === null ? new Set() : new Set(Object.keys(o2))

    //     if (o1keys.size !== o2keys.size) { return false }

    //     for (const key of o1keys) {
    //         if (!o2keys.has(key)) { return false }
    //         const v1 = o1[key]
    //         const v2 = o2[key]
    //         const t1 = typeof v1
    //         const t2 = typeof v2
    //         if (t1 === 'object') {
    //             if (t2 === 'object' && !this.deepObjectsHaveSameKeys(v1, v2)) { return false }
    //         } else if (t2 === 'object') { return false }
    //     }
    //     return true
    // },
    capitalize(string) {
        return string.replace(/^\p{CWU}/u, char => char.toUpperCase());
    },
    toCamelCase(text) {
        const replacedText = text
            .toLowerCase()
            .replace(/[-_\s.]+(.)?/g, (_, character) => (character ? character.toUpperCase() : ""));
        return replacedText.substring(0, 1).toLowerCase() + replacedText.substring(1);
    },
    ensureArray(payload) {
        if (Array.isArray(payload)) {
            return payload;
        } else {
            return [payload];
        }
    },
    /**
     * @param {array} params.items
     * @param {string} params.value
     * @returns {number}
     */
    getObjectNumbersByKey(params) {
        const values = params.items.map(item => item[params.value]);
        const sanitizedValues = values.filter(item => !isNaN(item));
        return sanitizedValues;
    },
    /**
     * @param {array} params.items
     * @param {string} params.value
     * @returns {number}
     */
    getMinObjectNumber(params) {
        return Math.min(...this.getObjectNumbersByKey(params));
    },
    /**
     * @param {array} params.items
     * @param {string} params.value
     * @returns {number}
     */
    getMaxObjectNumber(params) {
        return Math.max(...this.getObjectNumbersByKey(params));
    },
    // isCursorInsideATextField() {
    //     const activeElement = document.activeElement
    //     const isInput = activeElement.tagName === 'INPUT'
    //     const isContenteditable = activeElement.attributes.contenteditable !== undefined
    //     return isInput || isContenteditable
    // },
    getAverage(array) {
        return array.reduce((a, b) => a + b, 0) / array.length;
    },
    /** Encode URL, replacing all URL-unsafe
     * characters (except slash) with hex representation
     * @param {string} path
     * @returns {string}
     */
    getUrlSafePath(path) {
        const colonCharPlacholder = `PLACEHOLDER-${this.getHash()}`;
        return path
            .replace(/\\/g, "/")
            .replace(/:/g, colonCharPlacholder)
            .split("/")
            .map(pathItem => encodeURIComponent(pathItem))
            .join("/")
            .replace(new RegExp(colonCharPlacholder, "g"), ":");
    },
    /** Returns the width of specified HTML node content (without padding)
     * @param {HTMLElement} node
     * @returns {Number}
     */
    getNodeContentWidth(node) {
        const styles = window.getComputedStyle(node);
        const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        return node.clientWidth - padding;
    },
    getContentAreaNode(routeName) {
        try {
            if (routeName === "navigator") {
                return document.querySelector("#navigator-route .main-content-container");
            } else if (routeName === "home") {
                return document.querySelector("#home-route.main-content-container .os-viewport");
            } else {
                return document.querySelector(".content-area");
            }
        } catch (error) {
            console.log(error);
        }
    },
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    getUnique(list, key) {
        return [...new Map(list.map(item => [item[key], item])).values()];
    },
    filterObject(obj, predicate) {
        return Object.fromEntries(Object.entries(obj).filter(predicate));
    },
    setDeepProperty(object, deepProperty, value) {
        if (typeof deepProperty === "string") {
            deepProperty = deepProperty.split(".");
        }
        if (deepProperty.length > 1) {
            const firstProperty = deepProperty.shift();
            if (object[firstProperty] === null || typeof object[firstProperty] !== "object") {
                object[firstProperty] = {};
            }
            this.setDeepProperty(object[firstProperty], deepProperty, value);
        } else {
            object[deepProperty[0]] = value;
        }
    },
    getDeepProperty(object, deepProperty) {
        return deepProperty.split(".").reduce((o, k) => {
            return (o || {})[k];
        }, object);
    },
    replaceHtmlContainerContent(container, element) {
        this.clearHtmlContainer(container);
        container.appendChild(element);
    },
    clearHtmlContainer(container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    },
    removeHtmlNodes(list) {
        list.forEach(node => node.remove());
    },
    // isPathValid(path, params = {}) {
    //     const defaultParams = {
    //         overwrite: false,
    //         canBeRootDir: true,
    //         currentPath: ''
    //     }
    //     params = { ...defaultParams, ...params }
    //     const parsedPath = PATH.parse(path)
    //     const pathLengthInBytes = (new TextEncoder().encode(path)).length
    //     const nameLengthInBytes = (new TextEncoder().encode(parsedPath.base)).length
    //     const pathIsEmpty = path === ''
    //     const nameIsEmpty = parsedPath.name === ''
    //     const nameBaseIncludesInvalidChars = systemRulesForPaths.invalidPathChars.some(char => parsedPath.base.includes(char))
    //     const pathIsInvalid = systemRulesForPaths.invalidPaths.some(invalidPath => invalidPath === path)
    //     const invalidPathEndChars = systemRulesForPaths.invalidPathEndChars.some(endChar => path.endsWith(endChar))
    //     const invalidPathLength = pathLengthInBytes > systemRulesForPaths.maxPathLength
    //     const invalidNameLength = nameLengthInBytes > systemRulesForPaths.maxNameLength
    //     if (pathIsEmpty) {
    //         return {
    //             isValid: false,
    //             list: [],
    //             error: 'Path cannot be empty'
    //         }
    //     } else if (nameIsEmpty) {
    //         return {
    //             isValid: false,
    //             list: [],
    //             error: 'Name cannot be empty'
    //         }
    //     }
    //     if (nameBaseIncludesInvalidChars) {
    //         const formattedList = systemRulesForPaths.invalidPathChars.join(' ')
    //         return {
    //             isValid: false,
    //             list: systemRulesForPaths.invalidPathChars,
    //             error: `Name includes invalid characters: ${formattedList}`
    //         }
    //     } else if (pathIsInvalid) {
    //         const formattedList = systemRulesForPaths.invalidPaths.join(' ')
    //         return {
    //             isValid: false,
    //             list: systemRulesForPaths.invalidPaths,
    //             error: `Name includes invalid words: ${formattedList}`
    //         }
    //     } else if (invalidPathEndChars) {
    //         const formattedList = ("'" + systemRulesForPaths.invalidPathEndChars.join("' , '") + "'")
    //             .replace(' ', 'space')
    //             .replace('.', 'dot')
    //         return {
    //             isValid: false,
    //             list: systemRulesForPaths.invalidPathEndChars,
    //             error: `Name cannot end with: ${formattedList}`
    //         }
    //     } else if (invalidPathLength) {
    //         return {
    //             isValid: false,
    //             list: systemRulesForPaths.maxPathLength,
    //             error: `Total path length cannot be more than ${systemRulesForPaths.maxPathLength} bytes`
    //         }
    //     } else if (invalidNameLength) {
    //         return {
    //             isValid: false,
    //             list: systemRulesForPaths.maxNameLength,
    //             error: `Name cannot be longer than ${systemRulesForPaths.maxNameLength} bytes`
    //         }
    //     } else if (!(params as any).overwrite) {
    //         // If path already exists
    //         try {
    //             fs.accessSync(PATH.normalize(path), fs.constants.F_OK)
    //             return {
    //                 isValid: false,
    //                 list: [],
    //                 error: 'Item with that name already exists'
    //             }
    //         } catch (error) {
    //             return {
    //                 isValid: true
    //             }
    //         }
    //     } else if (!(params as any).canBeRootDir) {
    //         const itemIsRootDir = PATH.parse((params as any).currentPath).base === ''
    //         // If dir is root
    //         if (itemIsRootDir) {
    //             return {
    //                 isValid: false,
    //                 error: 'Root directories cannot be renamed'
    //             }
    //         } else {
    //             return {
    //                 isValid: true
    //             }
    //         }
    //     } else {
    //         return {
    //             isValid: true
    //         }
    //     }
    // },
    toTitleCase(string) {
        return string.charAt(0).toLocaleUpperCase() + string.substr(1);
    },
    prettyBytes(bytes, decimals) {
        if (isNaN(parseInt(bytes))) return "unknown";
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const dm = decimals <= 0 ? 0 : decimals || 2;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
    getHash(length = 32) {
        let hashID = "";
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < length; i++) {
            hashID += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        return hashID;
    },
    prettyTime(seconds) {
        const min = Math.round(Math.floor(seconds / 60));
        const sec = Math.round(seconds - min * 60);
        if (min === 0) {
            return `${sec} sec`;
        } else if (sec === 0) {
            return `${min} min`;
        } else {
            return `${min} min ${sec} sec`;
        }
    },
    formatTime(milliseconds, from, to) {
        if (from === "ms" && to === "auto") {
            const minutes = Math.round(milliseconds / 60000);
            if (minutes < 60) {
                return `${minutes} minutes`;
            } else if (minutes === 60) {
                return `${minutes / 60} hour`;
            } else if (minutes > 60) {
                return `${minutes / 60} hours`;
            } else {
                return minutes;
            }
        }
    },
    // getFormattedTime(params) {
    //     return dayjs.duration(params.time, params.unit).format(params.format)
    // },
    getTimeDiff(newer, older, format) {
        const milliseconds = newer - older;
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);

        if (format === "ms") {
            return milliseconds;
        } else if (format === "seconds") {
            return seconds;
        } else if (format === "minutes") {
            return minutes;
        }
    },
    // getDateTime(format = 'HH:mm:ss:SSS') {
    //     return dayjs().locale(detectedLocale).format(format)
    // },
    // formatDateTime(date, format) {
    //     if (!date) { return 'unknown' }
    //     return dayjs(date).locale(detectedLocale).format(format)
    // },

    getCSSProperty(property, element = "#app") {
        const node = document.querySelector(element) as any;
        return node.computedStyleMap().get(property);
    },
    getCSSVar(varName) {
        const root = document.querySelector("#app");
        const value = getComputedStyle(root).getPropertyValue(varName);
        return value.trim();
    },
    getItemPermissions(item) {
        let type;
        let lstat;
        try {
            lstat = fs.lstatSync(item.path);
        } catch (error) {
            return { isReadOnly: "unknown", permissions: "unknown" };
        }

        if (lstat.isSymbolicLink() || item.path.endsWith(".lnk")) {
            type = "l";
        } else {
            type = item.type === "directory" ? "d" : "-";
        }
        const owner = item.stat.mode >> 6;
        const group = (item.stat.mode << 3) >> 6;
        const others = (item.stat.mode << 6) >> 6;

        const result = {
            owner: {
                read: owner & 4 ? "r" : "-",
                write: owner & 2 ? "w" : "-",
                execute: owner & 1 ? "x" : "-"
            },
            group: {
                read: group & 4 ? "r" : "-",
                write: group & 2 ? "w" : "-",
                execute: group & 1 ? "x" : "-"
            },
            others: {
                read: others & 4 ? "r" : "-",
                write: others & 2 ? "w" : "-",
                execute: others & 1 ? "x" : "-"
            }
        };

        const isReadOnly = result.owner.write === "-";
        const permissions = `
      ${type}

      ${result.owner.read}
      ${result.owner.write}
      ${result.owner.execute}

      ${result.group.read}
      ${result.group.write}
      ${result.group.execute}

      ${result.others.read}
      ${result.others.write}
      ${result.others.execute}
    `
            .replace(/[\n\s]/g, "")
            .toUpperCase();

        return { isReadOnly, permissions };
    }
    // getFileType(path, type = 'file') {
    //     if (type === 'file' || type === 'extension') {
    //         if (type === 'extension') {
    //             path = `file.${path}`
    //         }
    //         const ext = PATH.extname(path)
    //         const mime = MIME.lookup(ext) || ''
    //         const isImage = mime.includes('image/')
    //         const isVideo = mime.includes('video/')
    //         const isAudio = mime.includes('audio/')
    //         const isText = mime.includes('text/')
    //         const isArchive = supportedFormats.includes({ type: 'archive', ext })
    //         let mimeDescription
    //         if (isImage) { mimeDescription = 'image' } else if (isVideo) { mimeDescription = 'video' } else if (isAudio) { mimeDescription = 'audio' } else if (isText) { mimeDescription = 'text' } else if (isArchive) { mimeDescription = 'archive' } else {
    //             mimeDescription = mime.length === 0
    //                 ? ext.replace('.', '')
    //                 : mime
    //         }
    //         return { mime, mimeDescription }
    //     } else {
    //         return { mime: '', mimeDescription: '' }
    //     }
    // }
};
