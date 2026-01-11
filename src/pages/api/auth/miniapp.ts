import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrCreateUserByFid, upsertFarcasterAccount } from '@/db/user';

/**
 * Authenticate user from Farcaster Mini App SDK context
 * This endpoint receives user data from the SDK's context.user and creates/updates the user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fid, username, displayName, pfpUrl } = req.body as {
      fid?: string;
      username?: string;
      displayName?: string;
      pfpUrl?: string;
    };

    if (!fid) {
      return res.status(400).json({ error: 'fid is required' });
    }

    console.log('🔐 [MINIAPP AUTH] Authenticating mini app user:', { fid, username, displayName });

    // Get or create user in database
    const user = await getOrCreateUserByFid(fid, {
      fid,
      username: username || undefined,
      displayName: displayName || undefined,
      pfpUrl: pfpUrl || undefined,
    });

    // Link/update Farcaster account
    if (username) {
      await upsertFarcasterAccount(user.id, {
        fid,
        username,
      });
    }

    // Set session cookie
    res.setHeader('Set-Cookie', `user_session=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`); // 24 hours

    console.log('✅ [MINIAPP AUTH] User authenticated successfully:', {
      userId: user.id,
      fid: user.fid,
      username: user.username,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error authenticating mini app user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
