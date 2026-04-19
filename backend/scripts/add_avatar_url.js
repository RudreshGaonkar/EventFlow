/**
 * Migration: Add avatar_url column to users table.
 * Run once with: node scripts/add_avatar_url.js
 */
require('dotenv').config();
const { getPool } = require('../src/config/db');

(async () => {
  const pool = getPool();
  try {
    // Check if column already exists before adding it
    const [cols] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'avatar_url'
    `);

    if (cols.length > 0) {
      console.log('[Migration] avatar_url column already exists — skipping.');
    } else {
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN avatar_url VARCHAR(1024) NULL DEFAULT NULL 
        AFTER home_state_id
      `);
      console.log('[Migration] avatar_url column added to users table ✓');
    }
  } catch (err) {
    console.error('[Migration] Failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
