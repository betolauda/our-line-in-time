import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // Read migration files
    const migrationFiles = [
      '001_initial_schema.sql',
    ];

    for (const filename of migrationFiles) {
      const version = filename.replace('.sql', '');

      // Check if migration has already been applied
      const existingMigration = await pool.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );

      if (existingMigration.rows.length > 0) {
        console.log(`⏭️  Migration ${version} already applied, skipping...`);
        continue;
      }

      // Read and execute migration
      const migrationPath = join(__dirname, '../../migrations', filename);
      const migrationSQL = readFileSync(migrationPath, 'utf8');

      console.log(`📄 Applying migration: ${version}`);
      await pool.query(migrationSQL);

      // Record migration as applied
      await pool.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [version]
      );

      console.log(`✅ Migration ${version} applied successfully`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };