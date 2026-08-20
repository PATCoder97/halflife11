CREATE TABLE "WaterDebt" (
  "id" TEXT NOT NULL,
  "fromPlayerId" TEXT NOT NULL,
  "toPlayerId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WaterDebt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WaterDebt_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "WaterDebt_players_check" CHECK ("fromPlayerId" <> "toPlayerId")
);

CREATE INDEX "WaterDebt_createdAt_idx" ON "WaterDebt"("createdAt");
CREATE INDEX "WaterDebt_fromPlayerId_idx" ON "WaterDebt"("fromPlayerId");
CREATE INDEX "WaterDebt_toPlayerId_idx" ON "WaterDebt"("toPlayerId");

ALTER TABLE "WaterDebt" ADD CONSTRAINT "WaterDebt_fromPlayerId_fkey" FOREIGN KEY ("fromPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaterDebt" ADD CONSTRAINT "WaterDebt_toPlayerId_fkey" FOREIGN KEY ("toPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
