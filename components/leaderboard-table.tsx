import type { Standing } from "@/lib/scoring";

function signed(points: number) {
  return points > 0 ? `+${points}` : String(points);
}

export function LeaderboardTable({ standings }: { standings: Standing[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-ink/15 text-xs uppercase tracking-[0.15em] text-ink/55">
            <th className="px-3 py-4">Rank</th>
            <th className="px-3 py-4">Player</th>
            <th className="px-3 py-4 text-right">Points</th>
            <th className="px-3 py-4 text-right">Wins</th>
            <th className="px-3 py-4 text-right">Losses</th>
            <th className="px-3 py-4 text-right">Matches</th>
            <th className="px-3 py-4 text-right">Win rate</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => (
            <tr key={standing.playerId} className="border-b border-ink/10 last:border-0">
              <td className="px-3 py-4 font-serif text-xl font-black">{index + 1}</td>
              <td className="px-3 py-4 font-bold">{standing.name}</td>
              <td
                className={`px-3 py-4 text-right text-lg font-black ${
                  standing.points > 0
                    ? "text-leaf"
                    : standing.points < 0
                      ? "text-rust"
                      : "text-ink/50"
                }`}
              >
                {signed(standing.points)}
              </td>
              <td className="px-3 py-4 text-right">{standing.wins}</td>
              <td className="px-3 py-4 text-right">{standing.losses}</td>
              <td className="px-3 py-4 text-right">{standing.matches}</td>
              <td className="px-3 py-4 text-right">{standing.winRate.toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {standings.length === 0 && (
        <p className="py-10 text-center text-ink/60">Chưa có người chơi.</p>
      )}
    </div>
  );
}
