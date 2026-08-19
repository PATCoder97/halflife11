export type ResultValue = "WIN" | "LOSS";

export type ScoreRow = {
  matchId: string;
  playerId: string;
  result: ResultValue | null;
};

export type PlayerSeed = {
  id: string;
  name: string;
};

export type Standing = {
  playerId: string;
  name: string;
  points: number;
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
};

export function deriveStandings(players: PlayerSeed[], rows: ScoreRow[]): Standing[] {
  const standings = new Map<string, Standing>(
    players.map((player) => [
      player.id,
      {
        playerId: player.id,
        name: player.name,
        points: 0,
        wins: 0,
        losses: 0,
        matches: 0,
        winRate: 0,
      },
    ]),
  );

  for (const row of rows) {
    if (row.result === null) continue;
    const standing = standings.get(row.playerId);
    if (!standing) continue;

    standing.matches += 1;
    if (row.result === "WIN") {
      standing.wins += 1;
      standing.points += 1;
    } else {
      standing.losses += 1;
      standing.points -= 1;
    }
  }

  return [...standings.values()]
    .map((standing) => ({
      ...standing,
      winRate: standing.matches === 0 ? 0 : (standing.wins / standing.matches) * 100,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.wins - a.wins ||
        a.matches - b.matches ||
        a.name.localeCompare(b.name, "vi"),
    );
}
