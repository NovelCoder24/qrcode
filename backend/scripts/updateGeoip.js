import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const dbFile = path.join(dataDir, 'GeoLite2-City.mmdb');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (fs.existsSync(dbFile) && fs.statSync(dbFile).size > 50000000) {
  console.log('[GeoIP Update] GeoLite2-City database already present and valid.');
  process.exit(0);
}

console.log('[GeoIP Update] Fetching GeoLite2-City database...');

function download(url, dest, cb) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return download(res.headers.location, dest, cb);
    }
    if (res.statusCode !== 200) {
      console.warn(`[GeoIP Update] Download failed with status ${res.statusCode}.`);
      return cb(new Error(`Status ${res.statusCode}`));
    }
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close(cb);
    });
  }).on('error', (err) => {
    cb(err);
  });
}

const downloadUrl = 'https://github.com/P3TERX/GeoLite.mmdb/releases/latest/download/GeoLite2-City.mmdb';

download(downloadUrl, dbFile, (err) => {
  if (err) {
    console.warn('[GeoIP Update] Could not update GeoLite2 database automatically:', err.message);
  } else {
    console.log('[GeoIP Update] GeoLite2-City database updated successfully.');
  }
  process.exit(0);
});
