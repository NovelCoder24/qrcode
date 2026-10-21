import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

const cityDbFile = path.join(dataDir, 'GeoLite2-City.mmdb');
const asnDbFile = path.join(dataDir, 'GeoLite2-ASN.mmdb');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function download(url, dest, cb) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return download(res.headers.location, dest, cb);
    }
    if (res.statusCode !== 200) {
      console.warn(`[GeoIP Update] Download failed for ${path.basename(dest)} with status ${res.statusCode}.`);
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

const cityDownloadUrl = 'https://github.com/P3TERX/GeoLite.mmdb/releases/latest/download/GeoLite2-City.mmdb';
const asnDownloadUrl = 'https://github.com/P3TERX/GeoLite.mmdb/releases/latest/download/GeoLite2-ASN.mmdb';

async function updateDatabases() {
  const tasks = [];

  // 1. GeoLite2-City check
  const needCity = !fs.existsSync(cityDbFile) || fs.statSync(cityDbFile).size < 50000000;
  if (needCity) {
    console.log('[GeoIP Update] Fetching GeoLite2-City database...');
    tasks.push(new Promise((resolve) => {
      download(cityDownloadUrl, cityDbFile, (err) => {
        if (err) {
          console.warn('[GeoIP Update] Could not update GeoLite2-City database:', err.message);
        } else {
          console.log('[GeoIP Update] GeoLite2-City database updated successfully.');
        }
        resolve();
      });
    }));
  } else {
    console.log('[GeoIP Update] GeoLite2-City database already present and valid.');
  }

  // 2. GeoLite2-ASN check
  const needAsn = !fs.existsSync(asnDbFile) || fs.statSync(asnDbFile).size < 3000000;
  if (needAsn) {
    console.log('[GeoIP Update] Fetching GeoLite2-ASN database...');
    tasks.push(new Promise((resolve) => {
      download(asnDownloadUrl, asnDbFile, (err) => {
        if (err) {
          console.warn('[GeoIP Update] Could not update GeoLite2-ASN database:', err.message);
        } else {
          console.log('[GeoIP Update] GeoLite2-ASN database updated successfully.');
        }
        resolve();
      });
    }));
  } else {
    console.log('[GeoIP Update] GeoLite2-ASN database already present and valid.');
  }

  await Promise.all(tasks);
  process.exit(0);
}

updateDatabases();
