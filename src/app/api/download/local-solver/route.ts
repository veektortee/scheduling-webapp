import { NextResponse } from 'next/server';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

/**
 * API endpoint for downloading the complete local solver package
 * GET /api/download/local-solver
 * 
 * Returns the local-solver-package.zip file for user download
 */
export async function GET() {
  try {
    // Path to the ZIP package in public directory
    const zipPath = join(process.cwd(), 'public', 'local-solver-package.zip');
    
    // Check if ZIP package exists
    if (!existsSync(zipPath)) {
      console.error('Local solver package not found at:', zipPath);
      return NextResponse.json(
        { 
          error: 'Local solver package not available',
          details: 'The ZIP package has not been generated yet. Please contact support.',
          path: zipPath
        },
        { status: 404 }
      );
    }

    // Get file stats for content length
    const stats = statSync(zipPath);
    const fileSize = stats.size;

    console.log(`📦 Serving local solver package: ${zipPath} (${fileSize} bytes)`);

    // Read the ZIP file
    const buffer = await import('fs/promises').then(fs => fs.readFile(zipPath));

    // Return the ZIP file with appropriate headers
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="local-solver-package.zip"',
        'Content-Length': fileSize.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error serving local solver package:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to serve local solver package',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Get package information without downloading
 * Useful for checking if package is available and getting metadata
 */
export async function HEAD() {
  try {
    const zipPath = join(process.cwd(), 'public', 'local-solver-package.zip');
    
    if (!existsSync(zipPath)) {
      return new NextResponse(null, { status: 404 });
    }

    const stats = statSync(zipPath);
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': stats.size.toString(),
        'Last-Modified': stats.mtime.toUTCString()
      }
    });
    
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}