import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    const { blobs } = await list({ prefix: 'solver_output/', mode: 'folded' }); 

    const folderData: Record<string, { name: string, path: string, created: string, fileCount: number }> = {};

    for (const blob of blobs) {
      const folderNameMatch = blob.pathname.match(/solver_output\/(Result_\d+)/);
      if (folderNameMatch) {
        const folderName = folderNameMatch[1];
        if (!folderData[folderName]) {
          folderData[folderName] = {
            name: folderName,
            path: blob.pathname,
            created: blob.uploadedAt.toISOString(),
            fileCount: 0
          };
        }
        folderData[folderName].fileCount++;
      }
    }

    const folders = Object.values(folderData);

    // Sort by numeric id desc
    folders.sort((a, b) => parseInt(b.name.split('_')[1], 10) - parseInt(a.name.split('_')[1], 10));

    return NextResponse.json({ folders });
  } catch (err) {
    console.error('Error listing result folders from Vercel Blob:', err);
    return NextResponse.json({ folders: [] }, { status: 500 });
  }
}
