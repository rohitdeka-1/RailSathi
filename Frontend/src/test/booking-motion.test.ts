import { describe, expect, it } from "vitest";
import { bookingMotion, bookingProgress } from "@/lib/motion";

describe("booking-flow motion", () => {
  it("staggers train cards by 60ms", () => { expect(bookingMotion.cardStagger).toBe(0.06); });
  it("fills the progress line across four steps", () => { expect([0, 1, 2, 3].map(bookingProgress)).toEqual([0, 1 / 3, 2 / 3, 1]); });
});