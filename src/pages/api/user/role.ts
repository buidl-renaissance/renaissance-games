import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getUserById, 
  getUserByUsername,
  isAdmin, 
  promoteToOrganizer, 
  demoteToUser,
  promoteToAdmin,
} from '@/db/user';
import { UserRole } from '@/db/schema';

/**
 * PATCH /api/user/role - Update a user's role (admin only)
 * Body: { userId?: string, username?: string, role: 'user' | 'organizer' | 'admin' }
 * 
 * GET /api/user/role?username=xxx - Check a user's role
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'PATCH') {
    return handlePatch(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { username, userId } = req.query;

    let targetUser;
    if (userId && typeof userId === 'string') {
      targetUser = await getUserById(userId);
    } else if (username && typeof username === 'string') {
      targetUser = await getUserByUsername(username);
    } else {
      return res.status(400).json({ error: 'userId or username is required' });
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get current user from session
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUser = await getUserById(sessionCookie);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Only admins can change roles
    if (!isAdmin(currentUser)) {
      return res.status(403).json({
        error: 'Only administrators can manage user roles',
      });
    }

    const { userId, username, role } = req.body as {
      userId?: string;
      username?: string;
      role: UserRole;
    };

    if (!role || !['user', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Valid role is required (user, organizer, or admin)',
      });
    }

    // Find target user
    let targetUser;
    if (userId) {
      targetUser = await getUserById(userId);
    } else if (username) {
      targetUser = await getUserByUsername(username);
    } else {
      return res.status(400).json({ error: 'userId or username is required' });
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent demoting yourself if you're the only admin
    if (targetUser.id === currentUser.id && role !== 'admin') {
      return res.status(400).json({
        error: 'You cannot demote yourself',
      });
    }

    // Update role
    let updatedUser;
    switch (role) {
      case 'admin':
        updatedUser = await promoteToAdmin(targetUser.id);
        break;
      case 'organizer':
        updatedUser = await promoteToOrganizer(targetUser.id);
        break;
      case 'user':
        updatedUser = await demoteToUser(targetUser.id);
        break;
    }

    console.log('✅ User role updated:', {
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
      newRole: role,
      updatedBy: currentUser.username,
    });

    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser?.id,
        username: updatedUser?.username,
        displayName: updatedUser?.displayName,
        role: updatedUser?.role,
      },
      message: `${targetUser.username || targetUser.id} is now ${role === 'admin' ? 'an' : 'a'} ${role}`,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
