import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// ─── S3 Client ────────────────────────────────────────────────────────────────
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'ecommerce-assets-dev';

/** Generates a unique S3 key for an uploaded file. */
const generateS3Key = (originalName: string, folder: string): string => {
  const ext = path.extname(originalName);
  const uniqueId = crypto.randomBytes(16).toString('hex');
  return `${folder}/${uniqueId}${ext}`;
};

/**
 * Uploads a file buffer to S3.
 * Returns the public URL of the uploaded file.
 */
export const uploadToS3 = async (
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'products'
): Promise<string> => {
  const key = generateS3Key(originalName, folder);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    })
  );

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};

/**
 * Deletes a file from S3 by its full URL.
 */
export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  const key = fileUrl.split('.amazonaws.com/')[1];
  if (!key) return;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
};

/**
 * Generates a pre-signed URL for temporary read access to a private S3 object.
 */
export const getPresignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

export { s3Client };
