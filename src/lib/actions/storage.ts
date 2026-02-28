"use server"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
]

/**
 * 将文件转换为 Base64 字符串存储在数据库中
 * 适用于 Cloudflare 环境下无法使用本地存储且不想开通 R2 的场景
 */
export async function uploadToStorage(file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('文件大小不能超过 5MB')
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('只允许上传图片文件 (JPEG/PNG/GIF/WebP/HEIC)')
    }

    // 此时不再依赖 MY_BUCKET
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 图片压缩建议：由于 Base64 会让体积增大 33%，
    // 生产环境下建议在前端先进行 Canvas 压缩后再传回。
    const base64String = buffer.toString('base64')

    return `data:${file.type};base64,${base64String}`
}
