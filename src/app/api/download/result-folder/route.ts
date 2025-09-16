import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import archiver from 'archiver';
import mime from 'mime-types';
// ...existing code...

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
    // Fetch the file contents and return as a binary download
    const fetched = await fetch(fileBlob.url);
    const buffer = Buffer.from(await fetched.arrayBuffer());
    const contentType = mime.lookup(fileName) || 'application/octet-stream';
    const response = new NextResponse(buffer);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    response.headers.set('Content-Length', String(buffer.length));
    return response;

  } else {
  const archive = archiver('zip', { zlib: { level: 9 } });

  // Collect archive data into buffers
  const chunks: Buffer[] = [];
  archive.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));

  for (const blob of blobs) {
    const fileUrl = blob.url;
    const response = await fetch(fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const name = blob.pathname.replace(blobPathPrefix, '');
    archive.append(buffer, { name });
  }

  await archive.finalize();

  const zipBuffer = Buffer.concat(chunks);

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${folderName}.zip"`,
      'Content-Length': String(zipBuffer.length),
    },
  });
  }
}