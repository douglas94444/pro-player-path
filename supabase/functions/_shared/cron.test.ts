import { describe, expect, it } from "vitest";
import { secretsEqual } from "./crypto.ts";

describe("cron secret gate", () => {
  it("401 conceitual: secret diferente ou vazio não passa", async () => {
    expect(await secretsEqual("cron-secret", "cron-secret")).toBe(true);
    expect(await secretsEqual("cron-secret", "other")).toBe(false);
    expect(await secretsEqual("", "cron-secret")).toBe(false);
  });
});
