import { Client } from 'minio';

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost',
  port: parseInt(process.env.MINIO_ENDPOINT?.split(':')[1] || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'our-line-in-time';

export const initializeStorage = async () => {
  try {
    // Check if bucket exists, create if not
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME);
      console.log(`✅ Created MinIO bucket: ${BUCKET_NAME}`);
    } else {
      console.log(`✅ MinIO bucket exists: ${BUCKET_NAME}`);
    }

    // Set bucket policy for public read access to thumbnails
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/thumbnails/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log('✅ MinIO bucket policy configured');
  } catch (error) {
    console.error('❌ MinIO initialization failed:', error);
    throw error;
  }
};