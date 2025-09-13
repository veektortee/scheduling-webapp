import fs from 'fs';
import path from 'path';
import os from 'os';
import archiver from 'archiver';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  }

  // Search for the folder in multiple candidate locations: the app-level
  // solver_output and the workspace-level solver_output, and also search
  // nested run folders for directories named exactly as `name`.
  const candidates = [
    path.join(process.cwd(), 'solver_output'),
    path.join(process.cwd(), '..', 'solver_output')
  ];

  let foundFolder: string | null = null;

  const tryMatch = (baseDir: string) => {
    try {
      const p = path.join(baseDir, name);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
    } catch {
      // ignore
    }
    return null;
  };

  const searchNested = (baseDir: string) => {
    try {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const e of entries) {
        try {
          if (e.isDirectory()) {
            const candidate = path.join(baseDir, e.name, name);
            if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return candidate;
            // also check one level deeper in case of other layouts
            const deeper = path.join(baseDir, e.name);
            const subs = fs.readdirSync(deeper, { withFileTypes: true });
            for (const s of subs) {
              if (s.isDirectory() && s.name === name) {
                const full = path.join(deeper, s.name);
                if (fs.existsSync(full) && fs.statSync(full).isDirectory()) return full;
              }
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  for (const base of candidates) {
    if (!base) continue;
    const matched = tryMatch(base);
    if (matched) {
      foundFolder = matched;
      break;
    }
    const nested = searchNested(base);
    if (nested) {
      foundFolder = nested;
      break;
    }
  }

  if (!foundFolder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  // Create a temporary zip file in OS temp directory to avoid collisions
  const zipPath = path.join(os.tmpdir(), `${name}-${Date.now()}.zip`);
  try {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(foundFolder, false);
    await archive.finalize();

    // Wait for file to be written
    await new Promise<void>((res, rej) => {
      output.on('close', () => res());
      output.on('error', e => rej(e));
    });

    const data = fs.readFileSync(zipPath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}.zip"`
      }
    });
  } catch (err) {
    console.error('Error creating zip:', err);
    return NextResponse.json({ error: 'Failed to create zip' }, { status: 500 });
  } finally {
    try { if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath); } catch {}
  }
}
