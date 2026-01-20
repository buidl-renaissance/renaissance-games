import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, getUserByPhone } from '@/db/user';
import { getGameById } from '@/db/game';
import {
  getTournamentById,
  registerParticipant,
  createTeam,
  addTeamMember,
  getTeamMembers,
  updateTeamComplete,
  getUserTeamInTournament,
} from '@/db/tournament';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/tournaments/[id]/register-with-partner
 * Register for a team tournament with a partner
 * 
 * Body: {
 *   teamName: string - required
 *   partnerId?: string - ID of existing user to add as partner
 *   partnerPhone?: string - Phone number to create new partner account
 *   partnerName?: string - Display name for new partner
 * }
 * 
 * Either partnerId OR (partnerPhone + partnerName) must be provided
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: tournamentId } = req.query;

  if (!tournamentId || typeof tournamentId !== 'string') {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  try {
    // Get user from session cookie
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await getUserById(sessionCookie);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Check if registration is open
    if (tournament.status !== 'registration' && tournament.status !== 'ready') {
      return res.status(400).json({
        error: 'Registration is not currently open for this tournament',
      });
    }

    // Check registration deadline
    if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    const game = await getGameById(tournament.gameId);
    if (!game) {
      return res.status(500).json({ error: 'Game not found' });
    }

    if (!game.isTeamGame) {
      return res.status(400).json({ error: 'This endpoint is only for team games' });
    }

    // Check if user is already on a team in this tournament
    const existingTeam = await getUserTeamInTournament(tournament.id, user.id);
    if (existingTeam) {
      return res.status(400).json({
        error: 'You are already on a team in this tournament',
        team: existingTeam,
      });
    }

    const { teamName, partnerId, partnerPhone, partnerName } = req.body as {
      teamName: string;
      partnerId?: string;
      partnerPhone?: string;
      partnerName?: string;
    };

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    // Validate partner info
    if (!partnerId && (!partnerPhone || !partnerName)) {
      return res.status(400).json({ 
        error: 'Either partnerId or (partnerPhone + partnerName) is required' 
      });
    }

    let partnerUserId: string;

    if (partnerId) {
      // Using existing user as partner
      const partnerUser = await getUserById(partnerId);
      if (!partnerUser) {
        return res.status(404).json({ error: 'Partner user not found' });
      }

      // Check if partner is already on a team
      const partnerExistingTeam = await getUserTeamInTournament(tournament.id, partnerId);
      if (partnerExistingTeam) {
        return res.status(400).json({
          error: 'Your selected partner is already on a team in this tournament',
        });
      }

      partnerUserId = partnerId;
    } else {
      // Creating new user for partner
      const normalizedPhone = partnerPhone!.replace(/[\s\-\(\)]/g, '');
      
      // Check if phone already exists
      const existingPartner = await getUserByPhone(normalizedPhone);
      if (existingPartner) {
        // Check if they're already on a team
        const partnerExistingTeam = await getUserTeamInTournament(tournament.id, existingPartner.id);
        if (partnerExistingTeam) {
          return res.status(400).json({
            error: 'A user with this phone number is already on a team in this tournament',
          });
        }
        partnerUserId = existingPartner.id;
      } else {
        // Create new user without PIN (they'll set it on first login)
        const newPartnerId = uuidv4();
        const now = new Date();
        
        // Generate a username from the name
        const baseUsername = partnerName!.toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 20);
        const username = `${baseUsername}_${newPartnerId.slice(0, 4)}`;

        await db.insert(users).values({
          id: newPartnerId,
          phone: normalizedPhone,
          username,
          displayName: partnerName!.trim(),
          pinHash: null, // No PIN - they'll set it on first login
          failedPinAttempts: 0,
          lockedAt: null,
          status: 'active',
          role: 'user',
          createdAt: now,
          updatedAt: now,
        });

        console.log('✅ Created new partner account:', {
          id: newPartnerId,
          phone: normalizedPhone,
          displayName: partnerName,
        });

        partnerUserId = newPartnerId;
      }
    }

    // Prevent self-partnering
    if (partnerUserId === user.id) {
      return res.status(400).json({ error: 'You cannot be your own partner' });
    }

    // Create the team with current user as captain
    const team = await createTeam(tournament.id, teamName.trim(), user.id);

    // Add the partner to the team
    await addTeamMember(team.id, partnerUserId);

    // Check if team is now complete
    const members = await getTeamMembers(team.id);
    const isNowComplete = members.length >= game.playersPerTeam;

    if (isNowComplete) {
      await updateTeamComplete(team.id, true);

      // Register the complete team as a participant
      const participant = await registerParticipant(tournament.id, undefined, team.id);

      console.log('✅ Team created with partner and registered:', {
        tournamentId: tournament.id,
        teamId: team.id,
        teamName: teamName.trim(),
        captainId: user.id,
        partnerId: partnerUserId,
        participantId: participant.id,
      });

      return res.status(201).json({
        success: true,
        team: { ...team, isComplete: true },
        participant,
        message: `Team "${teamName}" created and registered!`,
      });
    }

    // Team not yet complete (shouldn't happen for 2-player teams)
    console.log('✅ Team created with partner (not yet complete):', {
      tournamentId: tournament.id,
      teamId: team.id,
      teamName: teamName.trim(),
      captainId: user.id,
      partnerId: partnerUserId,
    });

    return res.status(201).json({
      success: true,
      team,
      message: `Team "${teamName}" created. Waiting for more teammates.`,
    });
  } catch (error) {
    console.error('Error registering with partner:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
