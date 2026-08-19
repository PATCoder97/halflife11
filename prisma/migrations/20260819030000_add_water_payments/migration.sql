CREATE TABLE "WaterPayment" (
  "id" TEXT NOT NULL,
  "fromPlayerId" TEXT NOT NULL,
  "toPlayerId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WaterPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WaterPayment_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "WaterPayment_players_check" CHECK ("fromPlayerId" <> "toPlayerId")
);

CREATE INDEX "WaterPayment_createdAt_idx" ON "WaterPayment"("createdAt");
CREATE INDEX "WaterPayment_fromPlayerId_idx" ON "WaterPayment"("fromPlayerId");
CREATE INDEX "WaterPayment_toPlayerId_idx" ON "WaterPayment"("toPlayerId");

ALTER TABLE "WaterPayment" ADD CONSTRAINT "WaterPayment_fromPlayerId_fkey" FOREIGN KEY ("fromPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaterPayment" ADD CONSTRAINT "WaterPayment_toPlayerId_fkey" FOREIGN KEY ("toPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
