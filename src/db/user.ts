import { v4 as uuidv4 } from 'uuid';
import { eq, count } from 'drizzle-orm';
import { db } from './drizzle';
import { users, farcasterAccounts, UserRole } from './schema';

export interface User {
  id: string;
  fid: string;
  username?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarcasterAccount {
  id: string;
  userId: string;
  fid: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarcasterUserData {
  fid: string;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

export async function getUserByFid(fid: string): Promise<User | null> {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.fid, fid))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    username: row.username,
    displayName: row.displayName,
    pfpUrl: row.pfpUrl,
    role: row.role,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}

export async function getUserById(userId: string): Promise<User | null> {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    username: row.username,
    displayName: row.displayName,
    pfpUrl: row.pfpUrl,
    role: row.role,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    username: row.username,
    displayName: row.displayName,
    pfpUrl: row.pfpUrl,
    role: row.role,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}


// Admin usernames - these users are always admins
const ADMIN_USERNAMES = ['wiredInsamurai', 'wiredinsamurai', 'WiredInSamurai'];

export async function getOrCreateUserByFid(
  fid: string,
  userData?: FarcasterUserData
): Promise<User> {
  const existing = await getUserByFid(fid);
  
  // Check if this user should be an admin based on username
  const shouldBeAdmin = userData?.username && 
    ADMIN_USERNAMES.some(admin => admin.toLowerCase() === userData.username?.toLowerCase());
  
  if (existing) {
    // Update user if new data is provided
    if (userData) {
      const now = new Date();
      const updateData: {
        username?: string | null;
        displayName?: string | null;
        pfpUrl?: string | null;
        role?: UserRole;
        updatedAt: Date;
      } = { updatedAt: now };
      
      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.displayName !== undefined) updateData.displayName = userData.displayName;
      if (userData.pfpUrl !== undefined) updateData.pfpUrl = userData.pfpUrl;
      
      // Auto-promote to admin if username matches admin list
      if (shouldBeAdmin && existing.role !== 'admin') {
        updateData.role = 'admin';
      }
      
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existing.id));
      
      return {
        ...existing,
        ...updateData,
      } as User;
    }
    
    return existing;
  }
  
  // Check if this is the first user - if so, make them admin
  const userCount = await db.select({ count: count() }).from(users);
  const isFirstUser = userCount[0].count === 0;
  
  // Determine role: admin username takes priority, then first user, then regular user
  let role: UserRole = 'user';
  if (shouldBeAdmin || isFirstUser) {
    role = 'admin';
  }
  
  // Create new user
  const id = uuidv4();
  const now = new Date();
  const newUser = {
    id,
    fid,
    username: userData?.username || null,
    displayName: userData?.displayName || null,
    pfpUrl: userData?.pfpUrl || null,
    role,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.insert(users).values(newUser);
  
  return newUser as User;
}

export async function upsertFarcasterAccount(
  userId: string,
  farcasterData: { fid: string; username: string }
): Promise<FarcasterAccount> {
  const existing = await db
    .select()
    .from(farcasterAccounts)
    .where(eq(farcasterAccounts.fid, farcasterData.fid))
    .limit(1);
  
  const now = new Date();
  
  if (existing.length > 0) {
    const existingAccount = existing[0];
    await db
      .update(farcasterAccounts)
      .set({
        userId,
        username: farcasterData.username,
        updatedAt: now,
      })
      .where(eq(farcasterAccounts.id, existingAccount.id));
    
    return {
      id: existingAccount.id,
      userId,
      fid: farcasterData.fid,
      username: farcasterData.username,
      createdAt: existingAccount.createdAt || now,
      updatedAt: now,
    } as FarcasterAccount;
  }
  
  const id = uuidv4();
  const record = {
    id,
    userId,
    fid: farcasterData.fid,
    username: farcasterData.username,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.insert(farcasterAccounts).values(record);
  return record as FarcasterAccount;
}

export async function getFarcasterAccountByFid(
  fid: string
): Promise<FarcasterAccount | null> {
  const results = await db
    .select()
    .from(farcasterAccounts)
    .where(eq(farcasterAccounts.fid, fid))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    userId: row.userId,
    fid: row.fid,
    username: row.username,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as FarcasterAccount;
}

// ============================================
// ROLE MANAGEMENT
// ============================================

export async function updateUserRole(userId: string, role: UserRole): Promise<User | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  
  const now = new Date();
  await db
    .update(users)
    .set({ role, updatedAt: now })
    .where(eq(users.id, userId));
  
  return { ...user, role, updatedAt: now };
}

export async function promoteToOrganizer(userId: string): Promise<User | null> {
  return updateUserRole(userId, 'organizer');
}

export async function promoteToAdmin(userId: string): Promise<User | null> {
  return updateUserRole(userId, 'admin');
}

export async function demoteToUser(userId: string): Promise<User | null> {
  return updateUserRole(userId, 'user');
}

// Access control helpers
export function canCreateTournament(user: User): boolean {
  return user.role === 'admin' || user.role === 'organizer';
}

export function canManageUsers(user: User): boolean {
  return user.role === 'admin';
}

export function isOrganizer(user: User): boolean {
  return user.role === 'admin' || user.role === 'organizer';
}

export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}
