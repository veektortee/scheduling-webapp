import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const { packaged_files } = await request.json();

    if (!packaged_files || typeof packaged_files !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid packaged_files' }, { status: 400 });
    }

    // Determine the next Result_N folder name
    const { blobs } = await list({ prefix: 'solver_output/Result_' });
    const existingNums = blobs.map(blob => {
      const match = blob.pathname.match(/^solver_output\/Result_(\d+)\//);
      return match ? parseInt(match[1], 10) : 0;
    });
    const nextNum = Math.max(0, ...existingNums) + 1;
    const folderName = `Result_${nextNum}`;
    const basePath = `solver_output/${folderName}`;

    // Decode the base64 content and upload each file to Vercel Blob
    const uploadPromises = [];
    for (const [relativePath, base64Content] of Object.entries(packaged_files)) {
      if (typeof base64Content === 'string') {
        const content = Buffer.from(base64Content, 'base64');
        const blobPath = `${basePath}/${relativePath}`;
        uploadPromises.push(put(blobPath, content, { access: 'public' }));
      }
    }

    await Promise.all(uploadPromises);

    return NextResponse.json({
      status: 'success',
      message: `Successfully uploaded ${uploadPromises.length} files to ${folderName}`,
      folderName: folderName,
    });

  } catch (error) {
    console.error('Error uploading packaged results to Vercel Blob:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to upload packaged results', details: errorMessage }, { status: 500 });
  }
}
