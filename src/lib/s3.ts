
'use server';

import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

function getPublicUrl(bucket: string, key: string) {
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `https://${bucket}.s3.amazonaws.com/${encodedKey}`;
}

/**
 * Uploads a file to a specified path in AWS S3.
 * @param fileBuffer The file content as a Buffer.
 * @param fileName The desired name of the file in S3.
 * @param mimeType The MIME type of the file.
 * @param path The nested folder path as an array of strings.
 * @returns The public URL of the uploaded file.
 */
export async function uploadFileToS3(fileBuffer: Buffer, fileName: string, mimeType: string, path: string[]) {
  if (!BUCKET_NAME) {
    throw new Error('S3 bucket name is not configured.');
  }
  
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const validPath = path.filter(segment => segment && segment.length > 0);
  const key = [...validPath, sanitizedFileName].join('/');
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read'
  });

  try {
    await s3Client.send(command);
    return getPublicUrl(BUCKET_NAME, key);
  } catch (error: any) {
    console.error(`Error uploading file "${fileName}" to S3. AWS-SDK-S3 Error:`, error);
    throw new Error(`File upload to AWS S3 failed: ${error.message}`);
  }
}

/**
 * Deletes a file from AWS S3.
 * @param key The full key of the object to delete.
 * @returns An object indicating success.
 */
export async function deleteFileFromS3(key: string) {
    if (!BUCKET_NAME) {
        throw new Error('S3 bucket name is not configured.');
    }

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        await s3Client.send(command);
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting file with key "${key}" from S3:`, error);
        throw new Error(`File deletion from AWS S3 failed: ${error.message}`);
    }
}


/**
 * Lists files from a specified folder path in AWS S3 and generates pre-signed URLs.
 * @param path The folder path as a single string, e.g., "VTU Assistant/2022/cse/3/22CS32".
 * @returns An array of file objects with name and a temporary, secure pre-signed url.
 */
export async function getFilesFromS3(path: string) {
  if (!BUCKET_NAME) {
    throw new Error('S3 bucket name is not configured.');
  }

  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: path.endsWith('/') ? path : path + '/',
  });

  try {
    const { Contents } = await s3Client.send(listCommand);
    if (!Contents) {
      return [];
    }

    const files = Contents.filter(file => file.Key && !file.Key.endsWith('/'));
    
    const signedUrls = await Promise.all(
        files.map(async (file) => {
            return {
                name: file.Key!.split('/').pop()!,
                url: getPublicUrl(BUCKET_NAME!, file.Key!),
                s3Key: file.Key!,
                summary: undefined
            };
        })
    );

    return signedUrls;

  } catch (error) {
    console.error(`Error listing files or signing URLs from S3 path "${path}":`, error);
    return [];
  }
}

/**
 * Checks for existing files in a specified S3 path.
 * @param path The nested folder path as an array of strings.
 * @returns The key of the first file found, or null if no files exist.
 */
export async function checkForExistingFile(path: string[]): Promise<string | null> {
    if (!BUCKET_NAME) {
        throw new Error('S3 bucket name is not configured.');
    }
    const keyPrefix = path.join('/');

    const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: keyPrefix + '/',
        MaxKeys: 1, // We only need to know if at least one file exists
    });

    try {
        const { Contents } = await s3Client.send(listCommand);
        if (Contents && Contents.length > 0 && Contents[0].Key) {
            return Contents[0].Key; // Return the key of the first existing file
        }
        return null; // No file found
    } catch (error: any) {
        console.error(`Error checking for existing file in S3 path "${keyPrefix}":`, error);
        // In case of error, we can assume no file exists to avoid blocking uploads.
        // A more robust solution might handle specific errors differently.
        return null;
    }
}
