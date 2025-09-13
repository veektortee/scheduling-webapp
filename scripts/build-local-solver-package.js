const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

(async function build() {
  try {
    const root = process.cwd();
    const publicDir = path.join(root, 'public');
    const sourceDir = path.join(root, 'public', 'local-solver-package');
    const outZip = path.join(publicDir, 'local-solver-package.zip');

    if (!fs.existsSync(sourceDir)) {
      console.error('Source package directory not found:', sourceDir);
      process.exit(1);
    }

    // Ensure destination directory exists
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    const output = fs.createWriteStream(outZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Created ${outZip} (${archive.pointer()} total bytes)`);
    });

    archive.on('warning', err => { if (err.code !== 'ENOENT') console.warn(err); });
    archive.on('error', err => { throw err; });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    await archive.finalize();

  } catch (err) {
    console.error('Failed to build package:', err);
    process.exit(2);
  }
})();
