import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadFile, generateTournamentImageKey, isStorageConfigured, extractKeyFromUrl, deleteFile } from '@/lib/storage';
import { getTournamentById, updateTournament } from '@/db/tournament';

// Disable body parsing to handle raw file data
export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  imageUrl?: string;
  error?: string;
};

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Parse multipart form data manually
async function parseFormData(req: NextApiRequest): Promise<{ 
  buffer: Buffer; 
  contentType: string; 
  filename: string;
  tournamentId: string | null;
} | null> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > MAX_FILE_SIZE + 10000) { // Add some buffer for form overhead
        reject(new Error('File too large'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';
        
        // Handle multipart/form-data
        if (contentType.includes('multipart/form-data')) {
          const boundary = contentType.split('boundary=')[1];
          if (!boundary) {
            resolve(null);
            return;
          }

          const boundaryBuffer = Buffer.from(`--${boundary}`);
          const parts = splitBuffer(buffer, boundaryBuffer);

          let fileData: { buffer: Buffer; contentType: string; filename: string } | null = null;
          let tournamentId: string | null = null;

          for (const part of parts) {
            const partStr = part.toString('utf-8', 0, Math.min(part.length, 1000));
            
            // Check if this part contains the tournamentId field
            if (partStr.includes('name="tournamentId"') && !partStr.includes('filename=')) {
              const headerEndIndex = part.indexOf(Buffer.from('\r\n\r\n'));
              if (headerEndIndex !== -1) {
                let valueData = part.slice(headerEndIndex + 4);
                // Remove trailing \r\n if present
                if (valueData.length >= 2 && valueData[valueData.length - 2] === 13 && valueData[valueData.length - 1] === 10) {
                  valueData = valueData.slice(0, -2);
                }
                tournamentId = valueData.toString('utf-8').trim();
              }
              continue;
            }
            
            // Check if this part contains the file
            if (partStr.includes('Content-Disposition') && partStr.includes('filename=')) {
              // Extract content type from part headers
              const typeMatch = partStr.match(/Content-Type:\s*([^\r\n]+)/i);
              const fileContentType = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';
              
              // Extract filename
              const filenameMatch = partStr.match(/filename="([^"]+)"/);
              const filename = filenameMatch ? filenameMatch[1] : 'upload';

              // Find the start of file data (after \r\n\r\n)
              const headerEndIndex = part.indexOf(Buffer.from('\r\n\r\n'));
              if (headerEndIndex === -1) {
                continue;
              }

              // Extract file data (skip headers and trailing \r\n)
              let fileBuffer = part.slice(headerEndIndex + 4);
              // Remove trailing \r\n if present
              if (fileBuffer.length >= 2 && fileBuffer[fileBuffer.length - 2] === 13 && fileBuffer[fileBuffer.length - 1] === 10) {
                fileBuffer = fileBuffer.slice(0, -2);
              }

              fileData = {
                buffer: fileBuffer,
                contentType: fileContentType,
                filename,
              };
            }
          }

          if (fileData) {
            resolve({
              ...fileData,
              tournamentId,
            });
            return;
          }
        }

        resolve(null);
      } catch (err) {
        reject(err);
      }
    });

    req.on('error', reject);
  });
}

// Helper to split buffer by boundary
function splitBuffer(buffer: Buffer, boundary: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  let index = buffer.indexOf(boundary, start);

  while (index !== -1) {
    if (start !== index) {
      parts.push(buffer.slice(start, index));
    }
    start = index + boundary.length;
    index = buffer.indexOf(boundary, start);
  }

  if (start < buffer.length) {
    parts.push(buffer.slice(start));
  }

  return parts;
}

// Get file extension from content type
function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[contentType] || 'jpg';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if storage is configured
  if (!isStorageConfigured()) {
    return res.status(500).json({ error: 'File storage not configured' });
  }

  try {
    // Parse the uploaded file
    const fileData = await parseFormData(req);
    
    if (!fileData) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { buffer, contentType, filename, tournamentId } = fileData;

    // Validate content type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ 
        error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
      });
    }

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
    }

    // If tournamentId is provided, verify tournament exists and handle old image
    let existingTournament = null;
    if (tournamentId) {
      existingTournament = await getTournamentById(tournamentId);
      if (!existingTournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      // Delete old tournament image if it exists and is from our storage
      if (existingTournament.imageUrl) {
        const oldKey = extractKeyFromUrl(existingTournament.imageUrl);
        if (oldKey && oldKey.startsWith('tournament-images/')) {
          try {
            await deleteFile(oldKey);
          } catch (err) {
            console.warn('Failed to delete old tournament image:', err);
            // Continue anyway
          }
        }
      }
    }

    // Generate unique key for the file
    // Use tournamentId if available, otherwise generate a temp ID
    const extension = getExtension(contentType);
    const imageId = tournamentId || `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const key = generateTournamentImageKey(imageId, extension);
    
    console.log(`📁 Uploading tournament image - tournamentId: ${tournamentId || 'new'}, key: ${key}, contentType: ${contentType}`);

    // Upload to DigitalOcean Spaces
    const uploadResult = await uploadFile(buffer, key, contentType);
    
    console.log(`📁 Upload result - url: ${uploadResult.url}`);

    // Update tournament with new image URL only if we have a tournament ID
    if (tournamentId && existingTournament) {
      await updateTournament(tournamentId, {
        imageUrl: uploadResult.url,
      });
      console.log(`✅ Tournament image uploaded for tournament ${tournamentId}: ${filename} -> ${uploadResult.url}`);
    } else {
      console.log(`✅ Tournament image uploaded (pre-creation): ${filename} -> ${uploadResult.url}`);
    }

    return res.status(200).json({
      imageUrl: uploadResult.url,
    });
  } catch (error) {
    console.error('Error uploading tournament image:', error);
    
    if (error instanceof Error) {
      if (error.message === 'File too large') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
      }
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
