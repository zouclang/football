"use server"

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
]

export async function uploadFile(formData: FormData): Promise<string | null> {
    const file = formData.get('file') as File
    if (!file) {
        return null
    }

    // #5: 文件大小验证
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('文件大小不能超过 5MB')
    }

    // #5: 文件类型验证
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('只允许上传图片文件 (JPEG/PNG/GIF/WebP/HEIC)')
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const extension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${extension}`
    const uploadDir = join(process.cwd(), 'public/uploads')

    try {
        await mkdir(uploadDir, { recursive: true })
        const path = join(uploadDir, filename)
        await writeFile(path, buffer)
        return `/uploads/${filename}`
    } catch (e) {
        console.error('Error uploading file:', e)
        return null
    }
}
