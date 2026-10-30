import { describe, expect, it } from "vitest";
import { ecoTier, milestoneStatus, pointsFor } from "./rewards";

describe("rewards", () => {
  it("awards action points plus 10 per kg CO2 saved", () => {
    expect(pointsFor("switchToAlternative", 2.5)).toBe(55);
  });
  it("unlocks a plant on reaching a milestone", () => {
    const s = milestoneStatus(100);
    expect(s.unlocked.map((m) => m.plant)).toEqual(["Tulsi (Holy Basil)"]);
    expect(s.next?.points).toBe(300);
  });
  it("treats scores under 50 as low eco (alternatives shown)", () => {
    expect(ecoTier(49)).toBe("low");
    expect(ecoTier(50)).toBe("mid");
  });
});
