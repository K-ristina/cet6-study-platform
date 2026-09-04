/**
 * Cloudflare R2 自动化静态资源上传与断点续传同步脚本
 *
 * 功能特性：
 * 1. 自动扫描 public/pdfs, public/answers, public/audio 目录下的所有文件；
 * 2. 智能对比 R2 存储桶中已有文件的大小（HeadObject），已上传的自动跳过（支持秒级断点续传）；
 * 3. 针对 30MB+ 的大音频和高清试卷使用 @aws-sdk/lib-storage 进行 5MB 分片流式上传，低内存占用且稳定；
 * 4. 设置永久 CDN 缓存控制（Cache-Control: public, max-age=31536000, immutable）；
 * 5. 5 线程并发上传，实时彩色进度日志。
 *
 * 使用方法：
 * 1. 复制 .env.r2.example 为 .env.r2 并填入真实凭证
 * 2. 运行: node scripts/upload-r2.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// 1. 读取环境配置文件
function loadEnv() {
  const candidateFiles = ['.env.r2', '.env.local', '.env'];
  for (const relPath of candidateFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'cet6-assets';
const ASSET_BASE_URL = process.env.VITE_ASSET_BASE_URL;

// 2. 验证凭证
if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error('\n❌ 缺少 Cloudflare R2 认证配置！');
  console.error('👉 请先将根目录下的 .env.r2.example 复制为 .env.r2，并填入以下必要参数：');
  console.error('   - R2_ACCOUNT_ID (Cloudflare 账户 ID)');
  console.error('   - R2_ACCESS_KEY_ID (R2 访问密钥 ID)');
  console.error('   - R2_SECRET_ACCESS_KEY (R2 秘密访问密钥)');
  console.error('   - R2_BUCKET_NAME (存储桶名称，默认: cet6-assets)\n');
  process.exit(1);
}

// 3. 初始化 S3 客户端（Cloudflare R2 兼容 AWS S3 协议）
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

// 4. 辅助函数：确定 MIME 类型
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.mp3': return 'audio/mpeg';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    default: return 'application/octet-stream';
  }
}

// 5. 辅助函数：格式化字节大小
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 6. 收集待上传的所有文件
const TARGET_FOLDERS = ['pdfs', 'answers', 'audio'];
const publicDir = path.resolve(process.cwd(), 'public');

const fileList = [];
let totalBytes = 0;

for (const folder of TARGET_FOLDERS) {
  const dirPath = path.join(publicDir, folder);
  if (!fs.existsSync(dirPath)) continue;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = path.join(dirPath, entry.name);
      const stat = fs.statSync(fullPath);
      const s3Key = `${folder}/${entry.name}`;
      fileList.push({
        fullPath,
        s3Key,
        folder,
        filename: entry.name,
        size: stat.size,
      });
      totalBytes += stat.size;
    }
  }
}

console.log('='.repeat(60));
console.log('🚀 开始准备同步静态资源到 Cloudflare R2');
console.log(`📦 目标存储桶: ${BUCKET_NAME}`);
console.log(`📂 待检查文件总数: ${fileList.length} 个`);
console.log(`💾 本地待同步总容量: ${formatBytes(totalBytes)}`);
console.log('='.repeat(60) + '\n');

// 7. 检查远端是否已有相同大小的文件（跳过已上传，实现断点续传）
async function checkExists(s3Key, size) {
  try {
    const head = await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    }));
    return head.ContentLength === size;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    return false;
  }
}

// 8. 执行单文件上传
async function uploadSingleFile(item) {
  const fileStream = fs.createReadStream(item.fullPath);
  const mime = getMimeType(item.filename);

  const uploader = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: item.s3Key,
      Body: fileStream,
      ContentType: mime,
      CacheControl: 'public, max-age=31536000, immutable',
    },
    partSize: 5 * 1024 * 1024, // 5MB 分片
    queueSize: 4, // 单文件内 4 分片并发
  });

  await uploader.done();
}

// 9. 并发执行调度器
const CONCURRENCY = 4; // 同时上传 4 个文件
let completedCount = 0;
let skippedCount = 0;
let uploadedCount = 0;
let uploadedBytes = 0;
let failedCount = 0;
const startTime = Date.now();

async function runWorker(iterator) {
  for (const [index, item] of iterator) {
    const prefix = `[${index + 1}/${fileList.length}]`;
    const percent = ((index / fileList.length) * 100).toFixed(1);

    try {
      // 检查远端是否存在
      const exists = await checkExists(item.s3Key, item.size);
      if (exists) {
        skippedCount++;
        completedCount++;
        console.log(`⏩ ${prefix} (${percent}%) 已在 R2 存在，跳过: ${item.s3Key} (${formatBytes(item.size)})`);
        continue;
      }

      // 上传
      console.log(`⏳ ${prefix} (${percent}%) 正在上传: ${item.s3Key} (${formatBytes(item.size)})...`);
      await uploadSingleFile(item);
      uploadedCount++;
      uploadedBytes += item.size;
      completedCount++;
      console.log(`✅ ${prefix} (${percent}%) 上传成功: ${item.s3Key}`);
    } catch (err) {
      failedCount++;
      completedCount++;
      console.error(`❌ ${prefix} 上传失败: ${item.s3Key} -> ${err.message}`);
    }
  }
}

async function main() {
  const entries = fileList.entries();
  const workers = Array(CONCURRENCY).fill(null).map(() => runWorker(entries));
  await Promise.all(workers);

  const durationSec = Math.round((Date.now() - startTime) / 1000);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 同步任务执行完毕！');
  console.log(`⏱️ 总计耗时: ${Math.floor(durationSec / 60)} 分 ${durationSec % 60} 秒`);
  console.log(`📊 总文件数: ${fileList.length} 个`);
  console.log(`✅ 新上传文件: ${uploadedCount} 个 (${formatBytes(uploadedBytes)})`);
  console.log(`⏩ 跳过已存在: ${skippedCount} 个`);
  if (failedCount > 0) {
    console.log(`❌ 失败文件: ${failedCount} 个（可重新运行本脚本自动重试失败项）`);
  }
  console.log('='.repeat(60));

  if (ASSET_BASE_URL) {
    console.log(`\n🔗 试卷 CDN 地址预览:`);
    console.log(`   ${ASSET_BASE_URL.replace(/\/+$/, '')}/pdfs/cet6_2024_06_set1.pdf`);
  }

  console.log(`\n💡 下一步：`);
  console.log(`   请确保部署平台（如 Vercel / Cloudflare Pages）的环境变量已添加：`);
  console.log(`   VITE_ASSET_BASE_URL = ${ASSET_BASE_URL || 'https://你的R2公开域名'}\n`);
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
