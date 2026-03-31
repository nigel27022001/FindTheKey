export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  date: string;
}

const LEADERBOARD_KEY = "spire_score_leaderboard";
const MAX_ENTRIES = 10;

/**
 * Get the current leaderboard sorted by highest score.
 */
export const getLeaderboard = (): LeaderboardEntry[] => {
  const storedData = localStorage.getItem(LEADERBOARD_KEY);
  if (!storedData) return [];

  try {
    const data: LeaderboardEntry[] = JSON.parse(storedData);
    // Sort descending (highest score first)
    return data.sort((a, b) => b.score - a.score);
  } catch (e) {
    console.error("Failed to parse leaderboard data", e);
    return [];
  }
};

/**
 * Saves a new score, returning the updated leaderboard.
 */
export const saveScore = (playerName: string, score: number): LeaderboardEntry[] => {
  const currentLeaderboard = getLeaderboard();
  
  const newEntry: LeaderboardEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    playerName: playerName.trim() || "Anonymous Hero",
    score: Math.floor(score), // Ensure integer
    date: new Date().toISOString(),
  };

  const updatedLeaderboard = [...currentLeaderboard, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updatedLeaderboard));
  
  return updatedLeaderboard;
};
