import type { NextApiRequest, NextApiResponse } from "next";
import { verifyMessage } from "ethers";
import {
  getUserByAccountAddress,
  getUserById,
} from "@/db/user";
import { sessions } from "./session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token, publicAddress, signature, userId } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Token is required" });
    }
    if (!publicAddress || typeof publicAddress !== "string") {
      return res.status(400).json({ error: "Public address is required" });
    }
    if (!signature || typeof signature !== "string") {
      return res.status(400).json({ error: "Signature is required" });
    }

    const session = sessions.get(token);
    if (!session) {
      return res.status(404).json({
        error: "Session not found or expired",
      });
    }
    if (session.expiresAt < Date.now()) {
      sessions.delete(token);
      return res.status(404).json({ error: "Session expired" });
    }

    const message = `Authenticate session: ${token}`;
    let recoveredAddress: string;
    try {
      recoveredAddress = verifyMessage(message, signature);
    } catch {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const normalizedRecovered = recoveredAddress.toLowerCase();
    const normalizedProvided = publicAddress.toLowerCase();
    if (normalizedRecovered !== normalizedProvided) {
      return res.status(401).json({
        error: "Signature does not match provided address",
      });
    }

    let user = await getUserByAccountAddress(publicAddress);
    if (!user && userId) {
      user = await getUserById(String(userId));
      if (
        user &&
        user.accountAddress?.toLowerCase() !== normalizedProvided
      ) {
        return res.status(401).json({
          error: "User ID does not match public address",
        });
      }
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    session.authenticated = true;
    session.userId = user.id;
    session.username = user.username ?? undefined;
    session.accountAddress = user.accountAddress ?? undefined;
    sessions.set(token, session);

    return res.status(200).json({
      success: true,
      message: "Session authenticated successfully",
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("[QR AUTH] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
