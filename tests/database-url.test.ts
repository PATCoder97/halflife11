import { describe, expect, it } from "vitest";

import { normalizePrismaDatabaseUrl } from "@/lib/database-url";

describe("database URL normalization", () => {
  it("removes the Prisma schema query parameter", () => {
    expect(
      normalizePrismaDatabaseUrl(
        "postgresql://halflife:secret@halflife11-db:5432/halflife?schema=public",
      ),
    ).toBe("postgresql://halflife:secret@halflife11-db:5432/halflife");
  });

  it("keeps other connection parameters", () => {
    expect(
      normalizePrismaDatabaseUrl(
        "postgresql://halflife:secret@halflife11-db:5432/halflife?schema=public&connection_limit=5",
      ),
    ).toBe("postgresql://halflife:secret@halflife11-db:5432/halflife?connection_limit=5");
  });

  it("leaves URLs without schema untouched", () => {
    const url = "postgresql://halflife:secret@halflife11-db:5432/halflife";
    expect(normalizePrismaDatabaseUrl(url)).toBe(url);
  });
});
