const bcrypt = require('bcryptjs');
const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function main() {
  await pool.query(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));
  const migrationDirectory = path.join(__dirname, '..', 'migrations');
  const migrations = fs.readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql')).sort();
  for (const migration of migrations) {
    await pool.query(fs.readFileSync(path.join(migrationDirectory, migration), 'utf8'));
  }
  const email = process.env.PROVISION_ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Runtime administrator credentials are required');
  await pool.query(
    `INSERT INTO users (email, password, name)
     VALUES ($1, $2, 'Runtime Administrator')
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name`,
    [email, await bcrypt.hash(password, 10)],
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
