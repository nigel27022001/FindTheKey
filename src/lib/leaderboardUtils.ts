export interface LeaderboardEntry {
  id: string;
  playerName: string;
  timeMs: number;
  date: string;
}

const LEADERBOARD_KEY = "spire_leaderboard";
const MAX_ENTRIES = 10;

/**
 * Get the current leaderboard sorted by fastest time (lowest ms).
 */
export const getLeaderboard = (): LeaderboardEntry[] => {
  const storedData = localStorage.getItem(LEADERBOARD_KEY);
  if (!storedData) return [];

  try {
    const data: LeaderboardEntry[] = JSON.parse(storedData);
    return data.sort((a, b) => a.timeMs - b.timeMs);
  } catch (e) {
    console.error("Failed to parse leaderboard data", e);
    return [];
  }
};

/**
 * Saves a new score, returning the updated leaderboard.
 */
export const saveScore = (playerName: string, timeMs: number): LeaderboardEntry[] => {
  const currentLeaderboard = getLeaderboard();
  
  const newEntry: LeaderboardEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    playerName: playerName.trim() || "Anonymous Hero",
    timeMs,
    date: new Date().toISOString(),
  };

  const updatedLeaderboard = [...currentLeaderboard, newEntry]
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, MAX_ENTRIES);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updatedLeaderboard));
  
  return updatedLeaderboard;
};

/**
 * Format milliseconds to MM:SS or MM:SS.ms (if requested).
 * For now we will return just MM:SS format rounding down.
 */
export const formatTimeMs = (timeMs: number): string => {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
