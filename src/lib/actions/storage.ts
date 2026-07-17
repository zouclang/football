"use server"

import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 增加到 10MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
]

/**
 * 将文件保存到本地服务器的 public/uploads 目录
 * 适用于非 Cloudflare Pages 部署场景
 */
export async function uploadToStorage(file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('文件大小不能超过 10MB')
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('只允许上传图片文件')
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 确保上传目录存在于真实的根目录，防止 standalone 模式写进随时会被清空的 .next 文件夹
    const isStandalone = process.cwd().includes('.next');
    const projectRoot = isStandalone ? path.join(process.cwd(), '../..') : process.cwd();
    const uploadDir = path.join(projectRoot, 'public', 'uploads');
    try {
        await fs.access(uploadDir)
    } catch {
        await fs.mkdir(uploadDir, { recursive: true })
    }

    // 生成唯一文件名
    const extension = file.type.split('/')[1] || 'jpg'
    const fileName = `${randomUUID()}.${extension}`
    const filePath = path.join(uploadDir, fileName)

    // 写入文件
    await fs.writeFile(filePath, buffer)

    // 返回 Web 访问路径
    return `/uploads/${fileName}`
}
