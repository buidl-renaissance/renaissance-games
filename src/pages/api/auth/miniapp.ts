import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByUsernameOnly, getUserById, upsertFarcasterAccount } from '@/db/user';

/**
 * Authenticate user from Renaissance Mini App SDK context
 * Uses username as the primary identifier
 * If user not found by username, requires phone number entry
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fid, username, displayName, pfpUrl, renaissanceUserId, accountAddress } = req.body as {
      fid?: string;
      username?: string;
      displayName?: string;
      pfpUrl?: string;
      renaissanceUserId?: string;
      accountAddress?: string; // Wallet address (synced from SDK)
    };

    console.log('🔐 [MINIAPP AUTH] Authenticating mini app user:', { 
      fid, 
      username, 
      displayName, 
      renaissanceUserId, 
      accountAddress: accountAddress || '(not provided)',
    });

    // If no username provided, check if user has an existing valid session
    // This handles cases where SDK context isn't ready yet but user is already logged in
    if (!username) {
      console.log('⚠️ [MINIAPP AUTH] No username provided, checking existing session...');
      
      const cookies = req.headers.cookie || '';
      const sessionMatch = cookies.match(/user_session=([^;]+)/);
      
      if (sessionMatch && sessionMatch[1]) {
        const sessionUserId = sessionMatch[1];
        const existingUser = await getUserById(sessionUserId);
        
        if (existingUser) {
          console.log('✅ [MINIAPP AUTH] Found existing session user:', {
            userId: existingUser.id,
            accountAddress: existingUser.accountAddress,
            hasPhone: !!existingUser.phone,
          });
          
          // Return existing user - they're already authenticated
          return res.status(200).json({
            success: true,
            needsPhone: !existingUser.phone,
            user: {
              id: existingUser.id,
              fid: existingUser.fid,
              username: existingUser.username,
              phone: existingUser.phone,
              name: existingUser.name,
              pfpUrl: existingUser.pfpUrl,
              displayName: existingUser.displayName,
              profilePicture: existingUser.profilePicture,
              accountAddress: existingUser.accountAddress,
              hasPin: !!existingUser.pinHash,
              status: existingUser.status,
              role: existingUser.role,
            },
          });
        }
      }
      
      // No session and no username - need phone
      console.log('⚠️ [MINIAPP AUTH] No session found, requiring phone');
      return res.status(200).json({
        success: false,
        needsPhone: true,
        message: 'No username found. Please enter your phone number.',
        pendingUserData: {
          fid,
          username,
          displayName,
          pfpUrl,
        },
      });
    }

    // Look up user by username only (case-insensitive)
    console.log('🔍 [MINIAPP AUTH] Looking up user by username (case-insensitive):', username);
    const result = await getUserByUsernameOnly(username, {
      fid: fid || '',
      username: username || undefined,
      name: displayName || undefined,
      pfpUrl: pfpUrl || undefined,
      accountAddress: accountAddress || undefined,
    });

    if (!result) {
      // No user found with this username - require phone verification
      console.log('⚠️ [MINIAPP AUTH] No user found for username (case-insensitive lookup):', username);
      return res.status(200).json({
        success: false,
        needsPhone: true,
        message: 'Please enter your phone number to continue.',
        // Pass along the Renaissance data for later linking
        pendingUserData: {
          fid,
          username,
          displayName,
          pfpUrl,
          accountAddress,
        },
      });
    }

    const { user } = result;

    // Link/update Farcaster account if username provided
    if (username && fid) {
      await upsertFarcasterAccount(user.id, {
        fid,
        username,
      });
    }

    // Set session cookie
    res.setHeader('Set-Cookie', `user_session=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

    console.log('✅ [MINIAPP AUTH] User authenticated successfully:', {
      userId: user.id,
      username: user.username,
      accountAddress: user.accountAddress,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      needsPhone: !user.phone, // Still prompt to add phone if missing
      user: {
        id: user.id,
        fid: user.fid,
        username: user.username,
        phone: user.phone,
        name: user.name,
        pfpUrl: user.pfpUrl,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        accountAddress: user.accountAddress,
        hasPin: !!user.pinHash,
        status: user.status,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error authenticating mini app user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
