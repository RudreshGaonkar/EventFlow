/**
 * Migration: add receipt_pdf_url and receipt_public_id columns to event_registrations
 * Run once: node backend/scripts/add_receipt_columns.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Check which columns already exist
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_registrations'
         AND COLUMN_NAME IN ('receipt_pdf_url', 'receipt_public_id')`
    );
    const existing = cols.map(c => c.COLUMN_NAME);

    const toAdd = [];
    if (!existing.includes('receipt_pdf_url'))   toAdd.push('ADD COLUMN receipt_pdf_url   VARCHAR(500) NULL');
    if (!existing.includes('receipt_public_id')) toAdd.push('ADD COLUMN receipt_public_id VARCHAR(255) NULL');

    if (toAdd.length === 0) {
      console.log('[Migration] Columns already exist — skipping.');
    } else {
      await conn.execute(`ALTER TABLE event_registrations ${toAdd.join(', ')}`);
      console.log('[Migration] Added:', toAdd.map(s => s.split(' ')[2]).join(', '));
    }
  } catch (err) {
    console.error('[Migration] Error:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
    process.exit(0);
  }
}

run();
