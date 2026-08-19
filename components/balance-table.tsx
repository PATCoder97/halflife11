import type { Standing } from "@/lib/scoring";
import { settlementSettings } from "@/lib/settings";

function status(points: number) {
  if (points > 0) return `Được nhận ${points} ${settlementSettings.unitName}`;
  if (points < 0) return `Nợ ${Math.abs(points)} ${settlementSettings.unitName}`;
  return "Đã cân bằng";
}

export function BalanceTable({ standings }: { standings: Standing[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-ink/15 text-xs uppercase tracking-[0.15em] text-ink/55">
            <th className="px-3 py-4">Người chơi</th>
            <th className="px-3 py-4 text-right">Điểm</th>
            <th className="px-3 py-4">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((item) => (
            <tr key={item.playerId} className="border-b border-ink/10 last:border-0">
              <td className="px-3 py-4 font-bold">{item.name}</td>
              <td
                className={`px-3 py-4 text-right text-lg font-black ${
                  item.points > 0 ? "text-leaf" : item.points < 0 ? "text-rust" : "text-ink/50"
                }`}
              >
                {item.points > 0 ? `+${item.points}` : item.points}
              </td>
              <td className="px-3 py-4 text-ink/70">{status(item.points)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
