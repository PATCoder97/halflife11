export type MatchSide = "A" | "B";

export function validateDoublesMatch(teamA: string[], teamB: string[]) {
  if (teamA.length !== 2 || teamB.length !== 2) {
    throw new Error("Mỗi đội phải có đúng 2 người chơi");
  }

  const allPlayers = [...teamA, ...teamB];
  if (new Set(allPlayers).size !== 4 || allPlayers.some((id) => !id)) {
    throw new Error("Một trận phải có 4 người chơi khác nhau");
  }
}

export function resultForTeam(team: MatchSide, winner: MatchSide) {
  return team === winner ? ("WIN" as const) : ("LOSS" as const);
}
