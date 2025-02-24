/**
 * File: \src\utils\image\generateThumbnail.ts
 * Project: Gcrypt
 * Created Date: 2024-01-21 20:56:52
 * Author: Guoyi
 * -----
 * Last Modified: 2024-01-21 22:00:07
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

interface ThumbnailOptions {
    width?: number; // 缩略图宽度（默认根据高度保持比例）
    height?: number; // 缩略图高度（默认根据宽度保持比例）
    keepAspectRatio?: boolean; // 是否保持宽高比例（默认true）
    quality?: number; // 图片质量（0-1，默认0.8）
    mimeType?: string; // 输出格式（默认'image/jpeg'）
    mode?: "cover" | "contain" | "stretch"; // 图片填充模式（默认'cover'）
    outputType?: "blob" | "dataURL" | "imageBitmap" | "base64"; // 输出类型（默认'blob'）
    crossOrigin?: string; // 跨域属性（默认匿名）
    backgroundColor?: string; // 背景填充颜色（默认透明）
}

/**
 * 使用Canvas生成缩略图
 * @param source 图片源（支持多种输入类型），若为string，则为图片URL；若为File，则为图片文件；若为HTMLImageElement，则为图片对象
 * @param options 参见ThumbnailOptions
 * @returns 输出结果（Blob或DataURL或ImageBitmap）
 */
async function generateThumbnailUsingCanvas(
    source: string | File | HTMLImageElement,
    options: ThumbnailOptions = {}
): Promise<Blob | string | ImageBitmap> {
    // 参数合并默认值
    const {
        width = 100,
        height,
        keepAspectRatio = true,
        quality = 0.8,
        mimeType = "image/jpeg",
        mode = "cover",
        outputType = "blob",
        crossOrigin = "anonymous",
        backgroundColor = "transparent"
    } = options;

    // 加载图片资源
    const img = await loadImage(source, crossOrigin);

    // 创建画布
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // 计算目标尺寸
    const [targetWidth, targetHeight] = calcTargetSize(
        img.width,
        img.height,
        width,
        height || (keepAspectRatio ? width * (img.height / img.width) : width),
        keepAspectRatio,
        mode
    );

    // 设置画布尺寸
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 填充背景
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 绘制图片
    const [dx, dy, dWidth, dHeight] = calcDrawPosition(img.width, img.height, targetWidth, targetHeight, mode);

    ctx.drawImage(img, dx, dy, dWidth, dHeight);

    // 输出结果
    return outputResult(canvas, mimeType, quality, outputType);
}

// 加载图片（支持多种输入类型）
async function loadImage(source: string | File | HTMLImageElement, crossOrigin: string): Promise<HTMLImageElement> {
    if (source instanceof HTMLImageElement) {
        if (!source.complete) {
            await new Promise((resolve, reject) => {
                source.onload = resolve;
                source.onerror = reject;
            });
        }
        return source;
    }

    const img = new Image();
    img.crossOrigin = crossOrigin;

    if (typeof source === "string") {
        img.src = source;
    } else if (source instanceof File) {
        img.src = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(source);
        });
    }

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    return img;
}

// 计算目标尺寸
function calcTargetSize(
    srcWidth: number,
    srcHeight: number,
    targetWidth: number,
    targetHeight: number,
    keepAspect: boolean,
    mode: string
): [number, number] {
    if (!keepAspect) return [targetWidth, targetHeight];

    const srcRatio = srcWidth / srcHeight;
    const targetRatio = targetWidth / targetHeight;

    if (mode === "cover") {
        return targetRatio < srcRatio ? [targetWidth, targetWidth / srcRatio] : [targetHeight * srcRatio, targetHeight];
    }

    if (mode === "contain") {
        return targetRatio > srcRatio ? [targetWidth, targetWidth / srcRatio] : [targetHeight * srcRatio, targetHeight];
    }

    return [targetWidth, targetHeight];
}

// 计算绘制位置和尺寸
function calcDrawPosition(
    srcWidth: number,
    srcHeight: number,
    targetWidth: number,
    targetHeight: number,
    mode: string
): [number, number, number, number] {
    if (mode === "stretch") return [0, 0, targetWidth, targetHeight];

    const scale =
        mode === "cover"
            ? Math.max(targetWidth / srcWidth, targetHeight / srcHeight)
            : Math.min(targetWidth / srcWidth, targetHeight / srcHeight);

    const scaledWidth = srcWidth * scale;
    const scaledHeight = srcHeight * scale;

    return [(targetWidth - scaledWidth) / 2, (targetHeight - scaledHeight) / 2, scaledWidth, scaledHeight];
}

// 输出结果
async function outputResult(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number,
    outputType: string
): Promise<Blob | string | ImageBitmap> {
    switch (outputType) {
        case "dataURL":
            return canvas.toDataURL(mimeType, quality);
        case "imageBitmap":
            return await createImageBitmap(canvas);
        case "base64":
            return canvas.toDataURL(mimeType, quality).split(",")[1];
        default:
            return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), mimeType, quality));
    }
}

export default generateThumbnailUsingCanvas;
