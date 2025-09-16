import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import JSZip from 'jszip';

export async function POST(request: Request) {
  try {
    const { packaged_outputs_b64 } = await request.json();

    if (!packaged_outputs_b64) {
      return NextResponse.json({ error: 'Missing packaged_outputs_b64' }, { status: 400 });
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

    // Decode the base64 string and load the zip
    const zipBuffer = Buffer.from(packaged_outputs_b64, 'base64');
    const zip = await JSZip.loadAsync(zipBuffer);

    // Upload each file from the zip to Vercel Blob
    const uploadPromises = [];
    for (const [relativePath, file] of Object.entries(zip.files)) {
      if (!file.dir) {
        const content = await file.async('nodebuffer');
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
    console.error('Error uploading local results to Vercel Blob:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to upload local results', details: errorMessage }, { status: 500 });
  }
}
