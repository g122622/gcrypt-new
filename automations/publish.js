// 脚本功能：执行npm run build，然后把dist目录下的所有文件覆盖上传到指定cos存储桶的指定子目录下面
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const { spawn } = require('child_process');
const Logger = require('./Logger');

const config = {
    bucket: 'charwind-1319262409',
    region: 'ap-hongkong',
    subDir: 'gcrypt', // cos存储桶的指定子目录
}

// 排除的文件
const EXCLUDE_FILES = ['.DS_Store', 'Thumbs.db'];

// 工具函数：递归遍历指定目录下的所有文件
function traverseDirectory(basePath, callback) {
    fs.readdirSync(basePath).forEach(file => {
        const filePath = `${basePath}/${file}`;
        if (fs.statSync(filePath).isDirectory()) {
            traverseDirectory(filePath, callback);
        } else {
            callback(filePath);
        }
    });
}

// 工具函数
// 调用示例（替换参数）
// clearDirectory('examplebucket-1250000000', 'ap-beijing', 'target-dir/');
async function clearDirectory(cos, bucket, region, dirPath) {
    try {
        // 列出目录下所有对象
        const listResult = await cos.getBucket({
            Bucket: bucket,
            Region: region,
            Prefix: dirPath.endsWith('/') ? dirPath : dirPath + '/'
        });

        // 提取对象列表
        const objects = listResult.Contents.map(item => ({ Key: item.Key }));

        // 批量删除（每次最多1000个对象）
        if (objects.length > 0) {
            await cos.deleteMultipleObject({
                Bucket: bucket,
                Region: region,
                Objects: objects
            });
            Logger.success(`已删除${objects.length}个对象`);
        }
    } catch (err) {
        Logger.error('删除操作失败:', err);
    }
}

// 1. 执行npm run build
const buildProcess = spawn('npm', ['run', 'build']);

buildProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

buildProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

buildProcess.on('close', async (code) => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
        // 2. 上传dist目录下的所有文件到cos存储桶的指定子目录下面
        const cos = new COS({
            SecretId: require('./secret').secretId,
            SecretKey: require('./secret').secretKey,
        });
        Logger.bgGreen('cos实例化成功');
        // 清空cos存储桶的指定子目录下的所有文件
        Logger.info(`[info]开始清空cos存储桶${config.bucket}的指定子目录${config.subDir}下的所有文件`);
        await clearDirectory(cos, config.bucket, config.region, config.subDir);
        Logger.info(`[info]清空cos存储桶${config.bucket}的指定子目录${config.subDir}下的所有文件完成`);
        // 递归遍历dist目录下的所有文件
        let counter = 0;
        traverseDirectory('./dist', (filePath) => {
            Logger.info(`[info]开始遍历到文件${filePath}`);
            const relativePath = filePath.replace('./dist/', '');
            // 排除指定的文件
            const fileName = filePath.split('/').pop();
            if (EXCLUDE_FILES.includes(fileName)) {
                Logger.warning(`文件${relativePath}被排除`);
                return;
            }
            cos.putObject({
                Bucket: config.bucket,
                Region: config.region,
                Key: `${config.subDir}/${relativePath}`,
                Body: fs.readFileSync(filePath)
            }).then(data => {
                Logger.success(`[info] 第${++counter}个文件${relativePath}上传成功, 地址: ${data.Location}`);
            }).catch(err => {
                Logger.error(`[error] 第${++counter}个文件${relativePath}上传失败, 错误信息: ${err.message}`);
            });
        });
    } else {
        Logger.error('npm run build failed, exit code: ', code);
    }
});

// example：Promise异步上传
// cos.putObject({
//     Bucket: 'examplebucket-1250000000',
//     Region: 'ap-beijing',
//     Key: 'test.jpg',
//     Body: fs.readFileSync('./test.jpg')
// }).then(data => {
//     console.log(data.Location);
// }).catch(err => {
//     console.error(err);
// });
