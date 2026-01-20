import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// DigitalOcean Spaces configuration
const spacesEndpoint = process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com';
const spacesRegion = process.env.DO_SPACES_REGION || 'nyc3';
const spacesBucket = process.env.DO_SPACES_BUCKET || '';
const spacesKey = process.env.DO_SPACES_KEY || '';
const spacesSecret = process.env.DO_SPACES_SECRET || '';

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${spacesEndpoint}`,
  region: spacesRegion,
  credentials: {
    accessKeyId: spacesKey,
    secretAccessKey: spacesSecret,
  },
  forcePathStyle: false,
});

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Upload a file to DigitalOcean Spaces
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  if (!spacesBucket || !spacesKey || !spacesSecret) {
    throw new Error('DigitalOcean Spaces credentials not configured');
  }

  const command = new PutObjectCommand({
    Bucket: spacesBucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await s3Client.send(command);

  // Construct the public URL (non-CDN, works without CDN enabled)
  // DO Spaces URLs are: https://{bucket}.{region}.digitaloceanspaces.com/{key}
  const url = `https://${spacesBucket}.${spacesRegion}.digitaloceanspaces.com/${key}`;

  return { url, key };
}

/**
 * Delete a file from DigitalOcean Spaces
 */
export async function deleteFile(key: string): Promise<void> {
  if (!spacesBucket || !spacesKey || !spacesSecret) {
    throw new Error('DigitalOcean Spaces credentials not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: spacesBucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a unique key for tournament image uploads
 */
export function generateTournamentImageKey(tournamentId: string, extension: string): string {
  const timestamp = Date.now();
  return `tournament-images/${tournamentId}/${timestamp}.${extension}`;
}

/**
 * Extract the key from a DO Spaces URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // URL format: https://{bucket}.{region}.digitaloceanspaces.com/{key}
    // or with CDN: https://{bucket}.{region}.cdn.digitaloceanspaces.com/{key}
    // Only extract from our spaces domain
    if (!urlObj.hostname.endsWith('digitaloceanspaces.com')) {
      return null;
    }
    const pathname = urlObj.pathname;
    // Remove leading slash
    return pathname.startsWith('/') ? pathname.slice(1) : pathname;
  } catch {
    return null;
  }
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(spacesBucket && spacesKey && spacesSecret);
}
