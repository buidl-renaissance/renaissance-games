import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";

interface AuthSession {
  createdAt: number;
  expiresAt: number;
  userId?: string;
  username?: string;
  accountAddress?: string;
  authenticated: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var authSessions: Map<string, AuthSession> | undefined;
}

if (!global.authSessions) {
  global.authSessions = new Map<string, AuthSession>();
}

const sessions = global.authSessions;
const SESSION_DURATION_MS = 5 * 60 * 1000;

const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cleanupExpiredSessions();

  if (req.method === "POST") {
    try {
      const token = randomBytes(32).toString("hex");
      const now = Date.now();
      const session: AuthSession = {
        createdAt: now,
        expiresAt: now + SESSION_DURATION_MS,
        authenticated: false,
      };
      sessions.set(token, session);

      return res.status(200).json({
        success: true,
        token,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      console.error("[AUTH SESSION] Error creating session:", error);
      return res.status(500).json({ error: "Failed to create session" });
    }
  }

  if (req.method === "GET") {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Token is required" });
    }

    const session = sessions.get(token);
    if (!session) {
      return res.status(404).json({
        error: "Session not found or expired",
        expired: true,
      });
    }

    if (session.expiresAt < Date.now()) {
      sessions.delete(token);
      return res.status(404).json({
        error: "Session expired",
        expired: true,
      });
    }

    if (session.authenticated && session.userId) {
      res.setHeader(
        "Set-Cookie",
        `user_session=${session.userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      );
      sessions.delete(token);

      return res.status(200).json({
        authenticated: true,
        userId: session.userId,
        username: session.username,
        user: { id: session.userId, username: session.username },
      });
    }

    return res.status(200).json({
      authenticated: false,
      expiresAt: session.expiresAt,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export { sessions, type AuthSession };
