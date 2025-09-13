import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runDirParam = url.searchParams.get('runDir') || url.searchParams.get('runId');
  if (!runDirParam) return NextResponse.json({ error: 'Missing runDir or runId' }, { status: 400 });

  try {
    const base = path.join(process.cwd(), 'solver_output');
    // Accept either full path or just folder name
    const candidate = runDirParam.includes('solver_output') ? runDirParam : path.join(base, runDirParam);
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) {
      return NextResponse.json({ error: 'Run folder not found' }, { status: 404 });
    }

    // Find next Result_N
    const existing = fs.readdirSync(base).filter(f => /^Result_\d+$/i.test(f));
    const nums = existing.map(f => parseInt(f.split('_')[1], 10)).filter(n => !isNaN(n));
    const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    const folderName = `Result_${next}`;
    const outDir = path.join(base, folderName);
    fs.mkdirSync(outDir, { recursive: true });

    // Copy files
    const files = fs.readdirSync(candidate);
    files.forEach(f => {
      const src = path.join(candidate, f);
      const dst = path.join(outDir, f);
      if (fs.statSync(src).isFile()) fs.copyFileSync(src, dst);
    });

    // Return mapping
    return NextResponse.json({ folderName });
  } catch (err) {
    console.error('convert run-to-result error', err);
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
}
