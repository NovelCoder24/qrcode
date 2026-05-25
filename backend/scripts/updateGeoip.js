import { execSync } from 'child_process';

const licenseKey = process.env.GEOLITE2_LICENSE_KEY;

if (!licenseKey) {
  console.log('[GeoIP Update] GEOLITE2_LICENSE_KEY is missing. Skipping update and continuing build gracefully.');
  process.exit(0);
}

try {
  console.log('[GeoIP Update] License key found. Updating GeoIP databases...');
  execSync('node node_modules/geoip-lite/scripts/updatedb.js', { stdio: 'inherit' });
  console.log('[GeoIP Update] Database update completed successfully.');
} catch (error) {
  console.error('[GeoIP Update] Database update failed:', error.message);
  // Exit with 0 to prevent breaking the build pipeline on hosted platforms like Render
  process.exit(0);
}
