import { randomUUID } from "crypto";

type SessionData = { userId: string; email?: string; role?: string };

declare global {
  // allow attaching to globalThis across Next compiled bundles
  // eslint-disable-next-line no-var
  var __staff_sessions: Map<string, SessionData> | undefined;
}

const sessions: Map<string, SessionData> = globalThis.__staff_sessions || new Map();
if (!globalThis.__staff_sessions) globalThis.__staff_sessions = sessions;

export { sessions };

export function createSession(userId: string, email?: string, role?: string) {
  const token = randomUUID();
  sessions.set(token, { userId, email, role });
  return token;
}

export function getSession(token?: string) {
  if (!token) return undefined;
  return sessions.get(token);
}
