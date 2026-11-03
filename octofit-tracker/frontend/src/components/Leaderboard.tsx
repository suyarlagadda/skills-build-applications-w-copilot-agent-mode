import { CapabilityList } from './CapabilityList.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return (
    <CapabilityList<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      path="/api/leaderboard"
      responseKey="leaderboard"
      emptyText="No leaderboard scores yet."
      renderItem={(entry) => (
        <li className="list-group-item" key={entry.rank}>
          Rank {entry.rank}: {entry.teamName} - {entry.totalPoints} points
        </li>
      )}
    />
  );
}
