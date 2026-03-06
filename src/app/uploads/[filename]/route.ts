import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    context: any
) {
    const filename = (await context.params)?.filename;

    if (!filename) {
        return new NextResponse('Filename is required', { status: 400 });
    }

    // Try to find the file in public/uploads 
    // This serves as a dynamic fallback for Next.js caching bug when files are added at runtime
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename as string);

    try {
        const stat = await fs.stat(filePath);

        if (!stat.isFile()) {
            return new NextResponse('Not found', { status: 404 });
        }

        // Determine content type
        const ext = path.extname(filename as string).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.webp') contentType = 'image/webp';
        if (ext === '.gif') contentType = 'image/gif';

        const fileBuffer = await fs.readFile(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (e) {
        return new NextResponse('Not found', { status: 404 });
    }
}
