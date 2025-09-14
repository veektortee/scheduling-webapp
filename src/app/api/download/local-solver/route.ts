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
    // Path to the ZIP package in public directory. Prefer a source-build zip if present.
    const publicDir = join(process.cwd(), 'public');
    const preferredNames = ['local-solver-package-src.zip', 'local-solver-package.zip'];
    let zipPath: string | null = null;
    let filename = 'local-solver-package.zip';
    for (const name of preferredNames) {
      const p = join(publicDir, name);
      if (existsSync(p)) {
        zipPath = p;
        filename = name;
        break;
      }
    }
    
    // Check if ZIP package exists
    if (!zipPath) {
      console.error('Local solver package not found in public directory. Checked:', preferredNames.join(', '));
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

  console.log(`[INFO] Serving local solver package: ${zipPath} (${fileSize} bytes)`);

    // Read the ZIP file
    const buffer = await import('fs/promises').then(fs => fs.readFile(zipPath));

    // Return the ZIP file with appropriate headers
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        // Use the actual filename we found
        'Content-Disposition': `attachment; filename="${filename}"`,
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
    const publicDir = join(process.cwd(), 'public');
    const preferredNames = ['local-solver-package-src.zip', 'local-solver-package.zip'];
    let zipPath: string | null = null;
    for (const name of preferredNames) {
      const p = join(publicDir, name);
      if (existsSync(p)) { zipPath = p; break; }
    }
    if (!zipPath) {
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