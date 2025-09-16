import { NextResponse } from 'next/server';
import { list, head } from '@vercel/blob';
import archiver from 'archiver';
import mime from 'mime-types';
import { Readable } from 'stream';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const folderName = url.searchParams.get('name');
  const fileName = url.searchParams.get('file');

  if (!folderName) {
    return NextResponse.json({ error: 'Missing folder name' }, { status: 400 });
  }

  const blobPathPrefix = `solver_output/${folderName}/`;
  const { blobs } = await list({ prefix: blobPathPrefix });

  if (blobs.length === 0) {
    return NextResponse.json({ error: `Folder '${folderName}' not found` }, { status: 404 });
  }

  if (fileName) {
    const fileBlob = blobs.find(b => b.pathname === `${blobPathPrefix}${fileName}`);
    if (!fileBlob) {
      return NextResponse.json({ error: `File '${fileName}' not found in '${folderName}'` }, { status: 404 });
    }
    const blob = await head(fileBlob.url);
    const contentType = mime.lookup(fileName) || 'application/octet-stream';
    const response = new NextResponse(blob.body);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    return response;

  } else {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = new Readable({
        read() {}
    });
    archive.pipe(stream);

    for (const blob of blobs) {
        const fileUrl = blob.url;
        const response = await fetch(fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const name = blob.pathname.replace(blobPathPrefix, '');
        archive.append(buffer, { name });
    }

    archive.finalize();

    return new NextResponse(stream as any, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${folderName}.zip"`,
        },
    });
  }
}