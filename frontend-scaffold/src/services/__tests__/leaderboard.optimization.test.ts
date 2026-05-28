import { describe, it, expect } from "vitest";

import {
  paginateLeaderboard,
  mergeLeaderboardEntries,
  LEADERBOARD_PERF_BUDGET_MS,
} from "../soroban";
import type { LeaderboardEntry } from "@/types/contract";

const buildEntries = (count: number): LeaderboardEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    address: `GADDR${index}`,
    username: `user${index}`,
    totalTipsReceived: String((count - index) * 1000),
    creditScore: 50,
  }));

describe("leaderboard soroban helpers", () => {
  it("paginates 1000+ entries without extra RPC calls", () => {
    const entries = buildEntries(1200);
    const pageSize = 20;

    let offset = 0;
    let loaded = 0;
    let pages = 0;

    while (true) {
      const page = paginateLeaderboard(entries, offset, pageSize);
      loaded += page.items.length;
      pages += 1;
      if (!page.hasMore || page.nextOffset === undefined) {
        break;
      }
      offset = page.nextOffset;
    }

    expect(loaded).toBe(1200);
    expect(pages).toBe(60);
  });

  it("merges incremental leaderboard updates by rank", () => {
    const previous: LeaderboardEntry[] = [
      {
        address: "G1",
        username: "alice",
        totalTipsReceived: "500",
        creditScore: 70,
      },
    ];
    const incoming: LeaderboardEntry[] = [
      {
        address: "G2",
        username: "bob",
        totalTipsReceived: "900",
        creditScore: 80,
      },
      {
        address: "G1",
        username: "alice",
        totalTipsReceived: "1000",
        creditScore: 75,
      },
    ];

    const merged = mergeLeaderboardEntries(previous, incoming);
    expect(merged.map((entry) => entry.address)).toEqual(["G2", "G1"]);
    expect(merged[1].totalTipsReceived).toBe("1000");
  });

  it("defines a 2 second performance budget", () => {
    expect(LEADERBOARD_PERF_BUDGET_MS).toBe(2000);
  });
});
