import { getJson } from '../api/client.js';
import { CapabilityList } from './CapabilityList.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

async function loadLeaderboard() {
  const response = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
  return response.leaderboard;
}

export default function Leaderboard() {
  return (
    <CapabilityList<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      loadItems={loadLeaderboard}
      emptyText="No leaderboard scores yet."
      renderItem={(entry) => (
        <li className="list-group-item" key={entry.rank}>
          Rank {entry.rank}: {entry.teamName} - {entry.totalPoints} points
        </li>
      )}
    />
  );
}
