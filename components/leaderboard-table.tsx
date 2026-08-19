import type { Standing } from "@/lib/scoring";

function signed(points: number) {
  return points > 0 ? `+${points}` : String(points);
}

export function LeaderboardTable({ standings }: { standings: Standing[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] border-collapse text-left">
        <thead>
          <tr className="border-b border-leaf/40 text-[10px] uppercase tracking-[0.18em] text-concrete">
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
            <tr key={standing.playerId} className="border-b border-cream/10 transition hover:bg-leaf/5 last:border-0">
              <td className="px-3 py-4 font-serif text-xl font-black text-leaf">{String(index + 1).padStart(2, "0")}</td>
              <td className="px-3 py-4 font-bold">{standing.name}</td>
              <td
                className={`px-3 py-4 text-right text-lg font-black ${
                  standing.points > 0
                    ? "text-leaf"
                    : standing.points < 0
                      ? "text-rust"
                      : "text-concrete"
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
        <p className="py-10 text-center text-concrete">NO PLAYER DATA</p>
      )}
    </div>
  );
}
