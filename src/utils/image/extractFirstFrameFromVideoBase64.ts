/**
 * 从视频的 Base64 Data URL 中提取第一帧图像，并返回该帧的 Base64 Data URL
 * @param videoBase64DataUrl - 视频文件的 Base64 Data URL（例如：'data:video/mp4;base64,xxxx'）
 * @param outputType - 输出图像的 MIME 类型，默认为 'image/png'
 * @param quality - 当输出为 'image/jpeg' 或 'image/webp' 时，可指定质量（0-1），默认 0.92
 * @returns Promise<string> - 第一帧图像的 Base64 Data URL
 * @throws 若视频加载失败或无法绘制帧，将抛出错误
 */
export async function extractFirstFrameFromVideoBase64(
    videoBase64DataUrl: string,
    outputType: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
    quality: number = 0.92
): Promise<string> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.style.display = 'none'; // 不显示在页面上

        // 设置视频源
        video.src = videoBase64DataUrl;

        // 监听元数据加载完成
        video.addEventListener('loadedmetadata', () => {
            // 设置当前时间为第一帧
            video.currentTime = 0;
        }, { once: true });

        // 监听 seek 完成（跳转到第0秒后）
        video.addEventListener('seeked', () => {
            // 确保画面已渲染，使用 requestAnimationFrame 提高稳定性
            requestAnimationFrame(() => {
                try {
                    // 创建 canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('无法获取 Canvas 2D 上下文');
                    }

                    // 绘制当前视频帧
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // 导出为 Base64
                    let base64: string;
                    if (outputType === 'image/jpeg' || outputType === 'image/webp') {
                        base64 = canvas.toDataURL(outputType, quality);
                    } else {
                        base64 = canvas.toDataURL(outputType); // image/png 不支持质量参数
                    }

                    // 清理：移除元素，释放 URL（虽然 data URL 不需要 revoke，但保持习惯）
                    if (video.parentNode) {
                        video.parentNode.removeChild(video);
                    }

                    resolve(base64);
                } catch (err) {
                    reject(new Error(`绘制或导出帧失败: ${err instanceof Error ? err.message : String(err)}`));
                }
            });
        }, { once: true });

        // 监听错误
        video.addEventListener('error', () => {
            reject(new Error('视频加载失败，请检查视频格式或数据是否有效'));
        }, { once: true });

        // 开始加载视频
        video.load();
    });
}
