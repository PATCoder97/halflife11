export type GeneratedMatch = {
  teamA: [string, string];
  teamB: [string, string];
};

/** Generates every unique 2-vs-2 partition for exactly four players. */
export function generateDoublesRotations(playerIds: string[]): GeneratedMatch[] {
  if (playerIds.length !== 4 || new Set(playerIds).size !== 4) {
    throw new Error("Match generator requires exactly 4 unique players");
  }

  const [a, b, c, d] = playerIds;
  return [
    { teamA: [a, b], teamB: [c, d] },
    { teamA: [a, c], teamB: [b, d] },
    { teamA: [a, d], teamB: [b, c] },
  ];
}
