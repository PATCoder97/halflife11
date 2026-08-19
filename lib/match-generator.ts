export type GeneratedMatch = {
  teamA: [string, string];
  teamB: [string, string];
};

export type ScheduledMatch = GeneratedMatch & {
  weaponId: string;
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

function pairKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

function shuffled<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function allDoublesCandidates(playerIds: string[]) {
  const candidates: GeneratedMatch[] = [];
  for (let a = 0; a < playerIds.length - 3; a += 1) {
    for (let b = a + 1; b < playerIds.length - 2; b += 1) {
      for (let c = b + 1; c < playerIds.length - 1; c += 1) {
        for (let d = c + 1; d < playerIds.length; d += 1) {
          const rotations = generateDoublesRotations([
            playerIds[a],
            playerIds[b],
            playerIds[c],
            playerIds[d],
          ]);
          rotations.forEach((rotation) => {
            candidates.push(rotation, {
              teamA: rotation.teamB,
              teamB: rotation.teamA,
            });
          });
        }
      }
    }
  }
  return candidates;
}

/**
 * Builds a fair 2-vs-2 schedule: appearances are balanced first, then repeated
 * teammates, opponents and consecutive-player overlap are minimized.
 */
export function generateBalancedMatches(
  playerIds: string[],
  matchCount: number,
  random: () => number = Math.random,
): GeneratedMatch[] {
  const uniquePlayerIds = [...new Set(playerIds)];
  if (uniquePlayerIds.length < 4) {
    throw new Error("Match generator requires at least 4 unique players");
  }
  if (!Number.isInteger(matchCount) || matchCount < 1 || matchCount > 100) {
    throw new Error("Match count must be an integer between 1 and 100");
  }

  const candidates = shuffled(allDoublesCandidates(uniquePlayerIds), random);
  const appearances = new Map(uniquePlayerIds.map((id) => [id, 0]));
  const alphaAppearances = new Map(uniquePlayerIds.map((id) => [id, 0]));
  const teammateCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  const schedule: GeneratedMatch[] = [];
  let previousPlayers = new Set<string>();

  for (let sequence = 0; sequence < matchCount; sequence += 1) {
    let best = candidates[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const selected = [...candidate.teamA, ...candidate.teamB];
      const projected = uniquePlayerIds.map((id) =>
        (appearances.get(id) ?? 0) + (selected.includes(id) ? 1 : 0),
      );
      const appearanceTotal = selected.reduce((total, id) => total + (appearances.get(id) ?? 0), 0);
      const spread = Math.max(...projected) - Math.min(...projected);
      const teammateRepeats =
        (teammateCounts.get(pairKey(...candidate.teamA)) ?? 0) +
        (teammateCounts.get(pairKey(...candidate.teamB)) ?? 0);
      const opponentRepeats = candidate.teamA.reduce(
        (total, alpha) => total + candidate.teamB.reduce(
          (subtotal, bravo) => subtotal + (opponentCounts.get(pairKey(alpha, bravo)) ?? 0),
          0,
        ),
        0,
      );
      const consecutiveOverlap = selected.filter((id) => previousPlayers.has(id)).length;
      const projectedAlpha = uniquePlayerIds.map((id) =>
        (alphaAppearances.get(id) ?? 0) + (candidate.teamA.includes(id) ? 1 : 0),
      );
      const alphaSpread = Math.max(...projectedAlpha) - Math.min(...projectedAlpha);
      const score =
        appearanceTotal * 10_000 +
        spread * 100_000 +
        teammateRepeats * 1_000 +
        alphaSpread * 500 +
        opponentRepeats * 100 +
        consecutiveOverlap * 10;

      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    schedule.push(best);
    const selected = [...best.teamA, ...best.teamB];
    selected.forEach((id) => appearances.set(id, (appearances.get(id) ?? 0) + 1));
    best.teamA.forEach((id) => alphaAppearances.set(id, (alphaAppearances.get(id) ?? 0) + 1));
    [best.teamA, best.teamB].forEach((team) => {
      const key = pairKey(...team);
      teammateCounts.set(key, (teammateCounts.get(key) ?? 0) + 1);
    });
    best.teamA.forEach((alpha) => best.teamB.forEach((bravo) => {
      const key = pairKey(alpha, bravo);
      opponentCounts.set(key, (opponentCounts.get(key) ?? 0) + 1);
    }));
    previousPlayers = new Set(selected);
  }

  return schedule;
}

export function generateShootingSchedule(
  playerIds: string[],
  weaponIds: string[],
  matchCount: number,
  random: () => number = Math.random,
): ScheduledMatch[] {
  const uniqueWeaponIds = [...new Set(weaponIds)];
  if (uniqueWeaponIds.length === 0) {
    throw new Error("Shooting schedule requires at least one weapon");
  }

  const matches = generateBalancedMatches(playerIds, matchCount, random);
  const assignedWeapons: string[] = [];
  while (assignedWeapons.length < matchCount) {
    assignedWeapons.push(...shuffled(uniqueWeaponIds, random));
  }

  return matches.map((match, index) => ({
    ...match,
    weaponId: assignedWeapons[index],
  }));
}
