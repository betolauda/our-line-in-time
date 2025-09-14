import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import archiver from 'archiver';
import { pool } from '../config/database';
import { minioClient, BUCKET_NAME } from '../config/storage';
import { AuthenticatedRequest } from '../middleware/auth';

const execAsync = promisify(exec);

export const exportFamilyData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format = 'json', includeMedia = true } = req.query;
    const userId = req.user!.id;

    // Only admin users can export all family data
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can export family data' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = `/tmp/export-${userId}-${timestamp}`;
    const exportFile = `${exportDir}.zip`;

    await fs.mkdir(exportDir, { recursive: true });

    try {
      // Export database data
      await exportDatabaseData(exportDir, format as string);

      // Export media files if requested
      if (includeMedia === 'true') {
        await exportMediaFiles(exportDir);
      }

      // Create ZIP archive
      await createZipArchive(exportDir, exportFile);

      // Send file
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="our-line-in-time-export-${timestamp}.zip"`);

      const fileStream = createReadStream(exportFile);
      fileStream.pipe(res);

      // Cleanup after sending
      fileStream.on('end', async () => {
        try {
          await fs.rm(exportDir, { recursive: true, force: true });
          await fs.unlink(exportFile);
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });

    } catch (error) {
      // Cleanup on error
      await fs.rm(exportDir, { recursive: true, force: true }).catch(() => {});
      await fs.unlink(exportFile).catch(() => {});
      throw error;
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

export const exportUserData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format = 'json' } = req.query;
    const userId = req.user!.id;

    // Export only the current user's data
    const userData = await getUserData(userId);

    if (format === 'csv') {
      const csv = convertToCSV(userData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="my-memories.csv"');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="my-memories.json"');
      res.json(userData);
    }

  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
};

export const createBackup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only admin users can create full backups
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can create backups' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `/tmp/backup-${timestamp}`;
    const backupFile = `${backupDir}.tar.gz`;

    await fs.mkdir(backupDir, { recursive: true });

    try {
      // Create database backup
      const dbBackupFile = join(backupDir, 'database.sql');
      const dbUrl = process.env.DATABASE_URL;

      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      await execAsync(`pg_dump "${dbUrl}" > "${dbBackupFile}"`);

      // Create media backup
      const mediaBackupDir = join(backupDir, 'media');
      await fs.mkdir(mediaBackupDir, { recursive: true });

      // Download all media from MinIO
      await backupMinioData(mediaBackupDir);

      // Create configuration backup
      const configData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        backup_type: 'full',
        database_size: (await fs.stat(dbBackupFile)).size,
      };

      await fs.writeFile(
        join(backupDir, 'backup-info.json'),
        JSON.stringify(configData, null, 2)
      );

      // Create compressed archive
      await execAsync(`tar -czf "${backupFile}" -C "${backupDir}" .`);

      // Send backup file
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', `attachment; filename="our-line-in-time-backup-${timestamp}.tar.gz"`);

      const fileStream = createReadStream(backupFile);
      fileStream.pipe(res);

      // Cleanup after sending
      fileStream.on('end', async () => {
        try {
          await fs.rm(backupDir, { recursive: true, force: true });
          await fs.unlink(backupFile);
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });

    } catch (error) {
      // Cleanup on error
      await fs.rm(backupDir, { recursive: true, force: true }).catch(() => {});
      await fs.unlink(backupFile).catch(() => {});
      throw error;
    }

  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
};

// Helper functions

async function exportDatabaseData(exportDir: string, format: string) {
  const queries = {
    family_members: 'SELECT id, email, name, role, generation_level, is_active, preferences, created_at FROM family_members',
    memories: 'SELECT * FROM memories',
    media_items: 'SELECT * FROM media_items',
    memory_family_members: 'SELECT * FROM memory_family_members',
  };

  for (const [table, query] of Object.entries(queries)) {
    const result = await pool.query(query);

    if (format === 'csv') {
      const csv = convertToCSV({ [table]: result.rows });
      await fs.writeFile(join(exportDir, `${table}.csv`), csv);
    } else {
      await fs.writeFile(
        join(exportDir, `${table}.json`),
        JSON.stringify(result.rows, null, 2)
      );
    }
  }
}

async function exportMediaFiles(exportDir: string) {
  const mediaDir = join(exportDir, 'media');
  await fs.mkdir(mediaDir, { recursive: true });

  try {
    // List all objects in MinIO bucket
    const objectsList: any[] = [];

    return new Promise((resolve, reject) => {
      const objectStream = minioClient.listObjects(BUCKET_NAME, '', true);

      objectStream.on('data', (obj) => {
        objectsList.push(obj);
      });

      objectStream.on('end', async () => {
        try {
          // Download each object
          for (const obj of objectsList) {
            const localPath = join(mediaDir, obj.name!);
            const localDir = join(localPath, '..');
            await fs.mkdir(localDir, { recursive: true });

            await minioClient.fGetObject(BUCKET_NAME, obj.name!, localPath);
          }
          resolve(void 0);
        } catch (error) {
          reject(error);
        }
      });

      objectStream.on('error', reject);
    });
  } catch (error) {
    console.error('Media export error:', error);
    throw error;
  }
}

async function createZipArchive(sourceDir: string, outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function getUserData(userId: string) {
  const [userResult, memoriesResult, mediaResult] = await Promise.all([
    pool.query('SELECT id, email, name, role, preferences, created_at FROM family_members WHERE id = $1', [userId]),
    pool.query('SELECT * FROM memories WHERE created_by = $1 OR id IN (SELECT memory_id FROM memory_family_members WHERE family_member_id = $1)', [userId]),
    pool.query('SELECT * FROM media_items WHERE uploaded_by = $1', [userId])
  ]);

  return {
    user: userResult.rows[0],
    memories: memoriesResult.rows,
    media_items: mediaResult.rows,
    export_info: {
      timestamp: new Date().toISOString(),
      total_memories: memoriesResult.rows.length,
      total_media_items: mediaResult.rows.length,
    }
  };
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - in production, use a proper CSV library
  const lines: string[] = [];

  for (const [tableName, rows] of Object.entries(data)) {
    if (Array.isArray(rows) && rows.length > 0) {
      lines.push(`\n# ${tableName}`);

      // Header
      const headers = Object.keys(rows[0]);
      lines.push(headers.join(','));

      // Rows
      for (const row of rows) {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        });
        lines.push(values.join(','));
      }
    }
  }

  return lines.join('\n');
}

async function backupMinioData(backupDir: string) {
  // This is a simplified version - in production, consider using MinIO's mc mirror
  const objectsList: any[] = [];

  return new Promise((resolve, reject) => {
    const objectStream = minioClient.listObjects(BUCKET_NAME, '', true);

    objectStream.on('data', (obj) => {
      objectsList.push(obj);
    });

    objectStream.on('end', async () => {
      try {
        for (const obj of objectsList) {
          const localPath = join(backupDir, obj.name!);
          const localDir = join(localPath, '..');
          await fs.mkdir(localDir, { recursive: true });

          await minioClient.fGetObject(BUCKET_NAME, obj.name!, localPath);
        }
        resolve(void 0);
      } catch (error) {
        reject(error);
      }
    });

    objectStream.on('error', reject);
  });
}