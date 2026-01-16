import { v4 as uuidv4 } from 'uuid';
import { eq, count, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from './drizzle';
import { users, farcasterAccounts, UserRole, UserStatus, USER_STATUSES } from './schema';

const BCRYPT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 3;

export { USER_STATUSES };
export type { UserStatus };

export interface User {
  id: string;
  fid?: string | null; // Legacy field - kept for backwards compatibility
  phone?: string | null; // Primary login method
  email?: string | null; // Optional
  username?: string | null;
  name?: string | null; // Display name
  pfpUrl?: string | null; // Profile picture URL
  displayName?: string | null; // App-specific name (editable)
  profilePicture?: string | null; // App-specific profile picture (editable)
  accountAddress?: string | null; // Wallet address
  pinHash?: string | null; // bcrypt hash of 4-digit PIN
  failedPinAttempts: number; // Failed PIN attempts counter (defaults to 0)
  lockedAt?: Date | null; // Timestamp when account was locked
  status?: UserStatus | null; // User status: active, inactive, banned (null treated as active)
  role: UserRole;
  hasPin?: boolean; // Convenience field (derived from pinHash)
  createdAt: Date;
  updatedAt: Date;
}

// Helper to get failedPinAttempts, treating null as 0
function getFailedAttempts(value: number | null | undefined): number {
  return value ?? 0;
}

// Legacy types - kept for backwards compatibility
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
  name?: string;
  displayName?: string;
  pfpUrl?: string;
  accountAddress?: string;
}

// ============================================
// USER LOOKUP FUNCTIONS
// ============================================

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
    phone: row.phone,
    email: row.email,
    username: row.username,
    name: row.name,
    pfpUrl: row.pfpUrl,
    displayName: row.displayName,
    profilePicture: row.profilePicture,
    accountAddress: row.accountAddress,
    pinHash: row.pinHash,
    failedPinAttempts: getFailedAttempts(row.failedPinAttempts),
    lockedAt: row.lockedAt || null,
    status: (row.status as UserStatus | null),
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
    phone: row.phone,
    email: row.email,
    username: row.username,
    name: row.name,
    pfpUrl: row.pfpUrl,
    displayName: row.displayName,
    profilePicture: row.profilePicture,
    accountAddress: row.accountAddress,
    pinHash: row.pinHash,
    failedPinAttempts: getFailedAttempts(row.failedPinAttempts),
    lockedAt: row.lockedAt || null,
    status: (row.status as UserStatus | null),
    role: row.role,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    phone: row.phone,
    email: row.email,
    username: row.username,
    name: row.name,
    pfpUrl: row.pfpUrl,
    displayName: row.displayName,
    profilePicture: row.profilePicture,
    accountAddress: row.accountAddress,
    pinHash: row.pinHash,
    failedPinAttempts: getFailedAttempts(row.failedPinAttempts),
    lockedAt: row.lockedAt || null,
    status: (row.status as UserStatus | null),
    role: row.role,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  // Use case-insensitive comparison for username lookup
  const results = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    phone: row.phone,
    email: row.email,
    username: row.username,
    name: row.name,
    pfpUrl: row.pfpUrl,
    displayName: row.displayName,
    profilePicture: row.profilePicture,
    accountAddress: row.accountAddress,
    pinHash: row.pinHash,
    failedPinAttempts: getFailedAttempts(row.failedPinAttempts),
    lockedAt: row.lockedAt || null,
    status: (row.status as UserStatus | null),
    role: row.role,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}

export async function getUserByAccountAddress(accountAddress: string): Promise<User | null> {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.accountAddress, accountAddress))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    phone: row.phone,
    email: row.email,
    username: row.username,
    name: row.name,
    pfpUrl: row.pfpUrl,
    displayName: row.displayName,
    profilePicture: row.profilePicture,
    accountAddress: row.accountAddress,
    pinHash: row.pinHash,
    failedPinAttempts: getFailedAttempts(row.failedPinAttempts),
    lockedAt: row.lockedAt || null,
    status: (row.status as UserStatus | null),
    role: row.role,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}

// ============================================
// USER CREATION & UPDATE FUNCTIONS
// ============================================

export interface CreateUserWithPhoneData {
  username: string;
  displayName: string; // name
  phone: string;
  email?: string;
  pin: string; // 4-digit PIN (will be hashed before storage)
  // Optional Renaissance/Farcaster data
  accountAddress?: string;
  fid?: string;
  pfpUrl?: string;
}

export async function createUserWithPhone(data: CreateUserWithPhoneData): Promise<User> {
  const id = uuidv4();
  const now = new Date();
  
  // Hash the PIN before storing
  const pinHash = await bcrypt.hash(data.pin, BCRYPT_ROUNDS);
  
  // Check if this is the first user - if so, make them admin
  const userCount = await db.select({ count: count() }).from(users);
  const isFirstUser = userCount[0].count === 0;
  
  // Check if this user should be an admin based on username
  const shouldBeAdmin = data.username && 
    ADMIN_USERNAMES.some(admin => admin.toLowerCase() === data.username?.toLowerCase());
  
  const role: UserRole = (shouldBeAdmin || isFirstUser) ? 'admin' : 'user';
  
  const newUser = {
    id,
    fid: data.fid || null,
    phone: data.phone,
    email: data.email || null,
    username: data.username,
    displayName: data.displayName,
    pfpUrl: data.pfpUrl || null,
    profilePicture: data.pfpUrl || null, // Initialize with pfpUrl if provided
    accountAddress: data.accountAddress || null, // From Renaissance auth
    pinHash,
    failedPinAttempts: 0,
    lockedAt: null,
    status: 'active' as UserStatus,
    role,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.insert(users).values(newUser);
  
  console.log('🆕 [CREATE USER] Created user with phone:', {
    userId: id,
    username: data.username,
    phone: data.phone,
    accountAddress: data.accountAddress,
    role,
  });
  
  return {
    ...newUser,
    lockedAt: null,
  } as User;
}

export interface UpdateUserProfileData {
  displayName?: string;
  profilePicture?: string | null; // App-specific profile picture (editable)
  phone?: string;
}

export async function updateUserProfile(userId: string, data: UpdateUserProfileData): Promise<User | null> {
  const existing = await getUserById(userId);
  if (!existing) return null;

  const now = new Date();
  const updateData: { displayName?: string; profilePicture?: string | null; phone?: string; updatedAt: Date } = { updatedAt: now };

  if (data.displayName !== undefined) {
    updateData.displayName = data.displayName;
  }
  if (data.profilePicture !== undefined) {
    updateData.profilePicture = data.profilePicture;
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId));

  return {
    ...existing,
    ...updateData,
  } as User;
}

// ============================================
// USERNAME/ACCOUNT ADDRESS LOOKUP (for Renaissance flow)
// ============================================

/**
 * Look up a user by accountAddress only (for Renaissance app users)
 * Returns null if no user found - caller should prompt for phone number
 */
export async function getUserByAccountAddressOnly(
  accountAddress: string,
  userData?: FarcasterUserData
): Promise<{ user: User; isNewUser: false } | null> {
  const existing = await getUserByAccountAddress(accountAddress);
  
  if (!existing) {
    console.log('🔍 [USER LOOKUP] No user found for accountAddress:', accountAddress);
    return null;
  }
  
  console.log('🔍 [USER LOOKUP] Found user by accountAddress:', accountAddress);
  
  // Update user if new data is provided - sync Renaissance data
  if (userData) {
    const now = new Date();
    const updateData: {
      fid?: string | null;
      username?: string | null;
      name?: string | null;
      pfpUrl?: string | null;
      updatedAt: Date;
    } = { updatedAt: now };
    
    // Sync username, name, pfpUrl from Renaissance
    // displayName and profilePicture are app-specific and won't be affected
    if (userData.fid) updateData.fid = userData.fid;
    if (userData.username !== undefined) updateData.username = userData.username;
    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.pfpUrl !== undefined) updateData.pfpUrl = userData.pfpUrl;
    
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, existing.id));
    
    return {
      user: {
        ...existing,
        ...updateData,
      } as User,
      isNewUser: false,
    };
  }
  
  return { user: existing, isNewUser: false };
}

/**
 * Look up a user by username only (for Renaissance app users)
 * Returns null if no user found - caller should prompt for phone number
 */
export async function getUserByUsernameOnly(
  username: string,
  userData?: FarcasterUserData
): Promise<{ user: User; isNewUser: false } | null> {
  // Case-insensitive username lookup
  const existing = await getUserByUsername(username);
  
  if (!existing) {
    console.log('🔍 [USER LOOKUP] No user found for username (case-insensitive):', username);
    return null;
  }
  
  console.log('✅ [USER LOOKUP] Found user by username (case-insensitive):', username, '-> DB username:', existing.username);
  
  // Update user if new data is provided - sync Renaissance data
  if (userData) {
    const now = new Date();
    const updateData: {
      fid?: string | null;
      name?: string | null;
      pfpUrl?: string | null;
      accountAddress?: string | null;
      updatedAt: Date;
    } = { updatedAt: now };
    
    // Sync fid, name, pfpUrl, accountAddress from Renaissance
    // displayName and profilePicture are app-specific and won't be affected
    if (userData.fid) updateData.fid = userData.fid;
    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.pfpUrl !== undefined) updateData.pfpUrl = userData.pfpUrl;
    if (userData.accountAddress !== undefined) updateData.accountAddress = userData.accountAddress;
    
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, existing.id));
    
    return {
      user: {
        ...existing,
        ...updateData,
      } as User,
      isNewUser: false,
    };
  }
  
  return { user: existing, isNewUser: false };
}

/**
 * Link an accountAddress to an existing user (found by phone)
 * Called after user enters phone number and is found/created
 */
export async function linkAccountAddressToUser(
  userId: string,
  accountAddress: string,
  userData?: FarcasterUserData
): Promise<User | null> {
  const existing = await getUserById(userId);
  if (!existing) return null;
  
  const now = new Date();
  const updateData: {
    fid?: string | null;
    username?: string | null;
    name?: string | null;
    pfpUrl?: string | null;
    accountAddress: string;
    updatedAt: Date;
  } = { 
    accountAddress,
    updatedAt: now,
  };
  
  // Also sync other Renaissance data if provided
  if (userData?.fid) updateData.fid = userData.fid;
  if (userData?.username) updateData.username = userData.username;
  if (userData?.name) updateData.name = userData.name;
  if (userData?.pfpUrl) updateData.pfpUrl = userData.pfpUrl;
  
  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId));
  
  console.log('🔗 [USER LOOKUP] Linked accountAddress to user:', { userId, accountAddress });
  
  return {
    ...existing,
    ...updateData,
  };
}

// ============================================
// FARCASTER ACCOUNT MANAGEMENT
// ============================================

// Admin usernames - these users are always admins
const ADMIN_USERNAMES = ['wiredInsamurai', 'wiredinsamurai', 'WiredInSamurai'];

export async function getOrCreateUserByFid(
  fid: string,
  userData?: FarcasterUserData
): Promise<User> {
  // Try accountAddress lookup first
  if (userData?.accountAddress) {
    const result = await getUserByAccountAddressOnly(userData.accountAddress, userData);
    if (result) {
      return result.user;
    }
  }
  
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
        name?: string | null;
        displayName?: string | null;
        pfpUrl?: string | null;
        accountAddress?: string | null;
        role?: UserRole;
        updatedAt: Date;
      } = { updatedAt: now };
      
      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.displayName !== undefined) updateData.displayName = userData.displayName;
      if (userData.pfpUrl !== undefined) updateData.pfpUrl = userData.pfpUrl;
      if (userData.accountAddress !== undefined) updateData.accountAddress = userData.accountAddress;
      
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
    name: userData?.name || null,
    displayName: userData?.displayName || null,
    pfpUrl: userData?.pfpUrl || null,
    profilePicture: userData?.pfpUrl || null,
    accountAddress: userData?.accountAddress || null,
    status: 'active' as UserStatus,
    role,
    createdAt: now,
    updatedAt: now,
  };
  
  console.log('🆕 [USER LOOKUP] Creating new user:', { fid, accountAddress: userData?.accountAddress, username: userData?.username, role });
  
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
// PIN SECURITY FUNCTIONS
// ============================================

/**
 * Check if a user account is currently locked
 */
export function isUserLocked(user: User): boolean {
  return user.lockedAt !== null && user.lockedAt !== undefined;
}

/**
 * Check if a user has a PIN set
 */
export function hasPin(user: User): boolean {
  return user.pinHash !== null && user.pinHash !== undefined;
}

/**
 * Verify a user's PIN
 * Returns true if PIN is correct, false otherwise
 */
export async function verifyUserPin(user: User, pin: string): Promise<boolean> {
  if (!user.pinHash) return false;
  return bcrypt.compare(pin, user.pinHash);
}

/**
 * Increment failed PIN attempts for a user
 * Returns the updated user and whether the account was locked
 */
export async function incrementFailedAttempts(userId: string): Promise<{ user: User; wasLocked: boolean }> {
  const existing = await getUserById(userId);
  if (!existing) throw new Error('User not found');

  const now = new Date();
  const newAttempts = existing.failedPinAttempts + 1;
  const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

  await db
    .update(users)
    .set({
      failedPinAttempts: newAttempts,
      lockedAt: shouldLock ? now : existing.lockedAt,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  return {
    user: {
      ...existing,
      failedPinAttempts: newAttempts,
      lockedAt: shouldLock ? now : existing.lockedAt,
      updatedAt: now,
    },
    wasLocked: shouldLock,
  };
}

/**
 * Reset failed PIN attempts (called on successful login)
 */
export async function resetFailedAttempts(userId: string): Promise<void> {
  const now = new Date();
  await db
    .update(users)
    .set({
      failedPinAttempts: 0,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
}

/**
 * Lock a user account
 */
export async function lockUser(userId: string): Promise<User | null> {
  const existing = await getUserById(userId);
  if (!existing) return null;

  const now = new Date();
  await db
    .update(users)
    .set({
      lockedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  return {
    ...existing,
    lockedAt: now,
    updatedAt: now,
  };
}

/**
 * Unlock a user account (admin function)
 * Also resets failed PIN attempts
 */
export async function unlockUser(userId: string): Promise<User | null> {
  const existing = await getUserById(userId);
  if (!existing) return null;

  const now = new Date();
  await db
    .update(users)
    .set({
      lockedAt: null,
      failedPinAttempts: 0,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  return {
    ...existing,
    lockedAt: null,
    failedPinAttempts: 0,
    updatedAt: now,
  };
}

/**
 * Set a user's PIN (for users who don't have one yet)
 */
export async function setUserPin(userId: string, pin: string): Promise<User | null> {
  const existing = await getUserById(userId);
  if (!existing) return null;

  const now = new Date();
  const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);

  await db
    .update(users)
    .set({
      pinHash,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  return {
    ...existing,
    pinHash,
    updatedAt: now,
  };
}

/**
 * Update a user's PIN (requires verification of current PIN first)
 * This should be called after verifyUserPin succeeds
 */
export async function updateUserPin(userId: string, newPin: string): Promise<User | null> {
  const existing = await getUserById(userId);
  if (!existing) return null;

  const now = new Date();
  const pinHash = await bcrypt.hash(newPin, BCRYPT_ROUNDS);

  await db
    .update(users)
    .set({
      pinHash,
      failedPinAttempts: 0, // Reset failed attempts on successful PIN change
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  return {
    ...existing,
    pinHash,
    failedPinAttempts: 0,
    updatedAt: now,
  };
}

// ============================================
// USER STATUS FUNCTIONS
// ============================================

/**
 * Update a user's status (admin function)
 * @param userId - The user ID to update
 * @param status - The new status: 'active', 'inactive', or 'banned'
 */
export async function updateUserStatus(userId: string, status: UserStatus): Promise<User | null> {
  const existing = await getUserById(userId);
  if (!existing) return null;

  const now = new Date();
  await db
    .update(users)
    .set({
      status,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  console.log('🔄 [USER STATUS] Updated user status:', { userId, status });

  return {
    ...existing,
    status,
    updatedAt: now,
  };
}

/**
 * Check if a user is active (not inactive or banned)
 * Note: null status is treated as active
 */
export function isUserActive(user: User): boolean {
  return user.status === 'active' || user.status === null;
}

/**
 * Check if a user is banned
 */
export function isUserBanned(user: User): boolean {
  return user.status === 'banned';
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

// ============================================
// RENAISSANCE ID FUNCTIONS
// ============================================

export async function getUserByRenaissanceId(renaissanceId: string): Promise<User | null> {
  // Use fid field to store renaissanceUserId
  const results = await db
    .select()
    .from(users)
    .where(eq(users.fid, renaissanceId))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    phone: row.phone,
    email: row.email,
    username: row.username,
    name: row.name,
    pfpUrl: row.pfpUrl,
    displayName: row.displayName,
    profilePicture: row.profilePicture,
    accountAddress: row.accountAddress,
    pinHash: row.pinHash,
    failedPinAttempts: getFailedAttempts(row.failedPinAttempts),
    lockedAt: row.lockedAt || null,
    status: (row.status as UserStatus | null),
    role: row.role,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}

export interface RenaissanceUserData {
  renaissanceUserId: string;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  publicAddress?: string;
}

export async function getOrCreateUserByRenaissanceId(
  renaissanceUserId: string,
  userData?: RenaissanceUserData
): Promise<User> {
  // First try to find existing user by renaissanceUserId (stored in fid)
  const existing = await getUserByRenaissanceId(renaissanceUserId);
  
  if (existing) {
    // Update user with any new data
    if (userData) {
      const now = new Date();
      const updateData: Record<string, unknown> = { updatedAt: now };
      
      if (userData.username) updateData.username = userData.username;
      if (userData.displayName) updateData.name = userData.displayName;
      if (userData.pfpUrl) updateData.pfpUrl = userData.pfpUrl;
      if (userData.publicAddress) updateData.accountAddress = userData.publicAddress;
      
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existing.id));
      
      return { ...existing, ...updateData, updatedAt: now } as User;
    }
    return existing;
  }
  
  // Try to find by username if provided
  if (userData?.username) {
    const existingByUsername = await getUserByUsername(userData.username);
    if (existingByUsername) {
      // Link renaissanceUserId to existing user
      const now = new Date();
      const updateData: Record<string, unknown> = {
        fid: renaissanceUserId,
        updatedAt: now,
      };
      
      if (userData.displayName) updateData.name = userData.displayName;
      if (userData.pfpUrl) updateData.pfpUrl = userData.pfpUrl;
      if (userData.publicAddress) updateData.accountAddress = userData.publicAddress;
      
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existingByUsername.id));
      
      console.log('🔗 [RENAISSANCE] Linked renaissanceUserId to existing user:', {
        userId: existingByUsername.id,
        renaissanceUserId,
        username: userData.username,
      });
      
      return { ...existingByUsername, ...updateData, updatedAt: now } as User;
    }
  }
  
  // Create new user
  const shouldBeAdmin = userData?.username && 
    ADMIN_USERNAMES.some(admin => admin.toLowerCase() === userData.username?.toLowerCase());
  
  // Check if this is the first user - if so, make them admin
  const userCount = await db.select({ count: count() }).from(users);
  const isFirstUser = userCount[0].count === 0;
  
  const role: UserRole = (shouldBeAdmin || isFirstUser) ? 'admin' : 'user';
  const id = uuidv4();
  const now = new Date();
  
  const newUser = {
    id,
    fid: renaissanceUserId,
    username: userData?.username || null,
    name: userData?.displayName || null,
    displayName: userData?.displayName || null,
    pfpUrl: userData?.pfpUrl || null,
    profilePicture: userData?.pfpUrl || null,
    accountAddress: userData?.publicAddress || null,
    status: 'active' as UserStatus,
    role,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.insert(users).values(newUser);
  
  console.log('🆕 [RENAISSANCE] Created new user from context:', {
    userId: id,
    renaissanceUserId,
    username: userData?.username,
    role,
  });
  
  return newUser as User;
}
