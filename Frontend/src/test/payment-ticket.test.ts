import { describe, expect, it } from "vitest";
import { ticketMotion } from "@/lib/motion";

describe("payment celebration", () => {
  it("ends the one-shot sparks after 1.5 seconds", () => {
    expect(ticketMotion.sparks).toBe(1.5);
  });
});