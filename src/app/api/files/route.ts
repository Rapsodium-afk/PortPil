import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'images' | 'documents' | 'backups';
  const name = searchParams.get('name');

  if (!type || !name) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  try {
    // Read config to get the path
    const configPath = path.join(process.cwd(), 'src', 'data', 'config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    const defaultPaths = {
        images: path.join(process.cwd(), 'public', 'uploads', 'images'),
        documents: path.join(process.cwd(), 'public', 'uploads', 'documents'),
        backups: path.join(process.cwd(), 'public', 'uploads', 'backups')
    };

    const targetDir = config.storagePaths?.[type] || defaultPaths[type];
    const filePath = path.join(targetDir, name);

    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (name.endsWith('.png')) contentType = 'image/png';
    else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (name.endsWith('.pdf')) contentType = 'application/pdf';
    else if (name.endsWith('.gif')) contentType = 'image/gif';
    else if (name.endsWith('.svg')) contentType = 'image/svg+xml';

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
