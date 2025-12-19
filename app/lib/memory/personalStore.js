// In-memory personal preference store (per user/session)
// Safe baseline. We can persist later.

const personalMemory = new Map();

/**
 * Save a personal preference
 */
export function setPersonalMemory(userId, content) {
  if (!userId) return;
  personalMemory.set(userId, content);
}

/**
 * Get a personal preference
 */
export function getPersonalMemory(userId) {
  if (!userId) return null;
  return personalMemory.get(userId) || null;
}

/**
 * Forget a personal preference
 */
export function clearPersonalMemory(userId) {
  if (!userId) return;
  personalMemory.delete(userId);
}
