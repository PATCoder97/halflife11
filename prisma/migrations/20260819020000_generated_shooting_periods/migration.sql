-- Move weapon selection from individual players to the whole match and allow
-- generated matches to exist before an admin records the result.
ALTER TABLE "GameSession" ADD COLUMN "plannedMatchCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Match" ADD COLUMN "weaponId" TEXT;
ALTER TABLE "MatchPlayer" ALTER COLUMN "result" DROP NOT NULL;

UPDATE "Match" AS m
SET "weaponId" = source."weaponId"
FROM (
  SELECT DISTINCT ON ("matchId") "matchId", "weaponId"
  FROM "MatchPlayer"
  WHERE "weaponId" IS NOT NULL
  ORDER BY "matchId", "createdAt"
) AS source
WHERE m."id" = source."matchId";

CREATE TABLE "GameSessionPlayer" (
  "gameSessionId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  CONSTRAINT "GameSessionPlayer_pkey" PRIMARY KEY ("gameSessionId", "playerId")
);

CREATE TABLE "GameSessionWeapon" (
  "gameSessionId" TEXT NOT NULL,
  "weaponId" TEXT NOT NULL,
  CONSTRAINT "GameSessionWeapon_pkey" PRIMARY KEY ("gameSessionId", "weaponId")
);

INSERT INTO "GameSessionPlayer" ("gameSessionId", "playerId")
SELECT DISTINCT m."gameSessionId", mp."playerId"
FROM "MatchPlayer" mp
JOIN "Match" m ON m."id" = mp."matchId";

INSERT INTO "GameSessionWeapon" ("gameSessionId", "weaponId")
SELECT DISTINCT "gameSessionId", "weaponId"
FROM "Match"
WHERE "weaponId" IS NOT NULL;

UPDATE "GameSession" AS gs
SET "plannedMatchCount" = source.match_count
FROM (
  SELECT "gameSessionId", COUNT(*)::INTEGER AS match_count
  FROM "Match"
  GROUP BY "gameSessionId"
) AS source
WHERE gs."id" = source."gameSessionId";

CREATE INDEX "Match_weaponId_idx" ON "Match"("weaponId");
CREATE INDEX "GameSessionPlayer_playerId_idx" ON "GameSessionPlayer"("playerId");
CREATE INDEX "GameSessionWeapon_weaponId_idx" ON "GameSessionWeapon"("weaponId");

ALTER TABLE "Match" ADD CONSTRAINT "Match_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "Weapon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GameSessionPlayer" ADD CONSTRAINT "GameSessionPlayer_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameSessionPlayer" ADD CONSTRAINT "GameSessionPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameSessionWeapon" ADD CONSTRAINT "GameSessionWeapon_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameSessionWeapon" ADD CONSTRAINT "GameSessionWeapon_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "Weapon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MatchPlayer" DROP CONSTRAINT "MatchPlayer_weaponId_fkey";
DROP INDEX "MatchPlayer_weaponId_idx";
ALTER TABLE "MatchPlayer" DROP COLUMN "weaponId";
