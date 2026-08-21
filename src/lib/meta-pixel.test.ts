import { describe, expect, it } from "vitest";
import { fbcCookieAttrs, montarFbc } from "./meta-pixel";
import { phoneE164Br } from "./br-docs";

describe("fbc", () => {
  it("monta o formato Meta fb.1.<ts>.<fbclid>", () => {
    expect(montarFbc("abc123", 1700000000000)).toBe("fb.1.1700000000000.abc123");
  });

  it("grava cookie com SameSite=Lax e Secure em HTTPS", () => {
    expect(fbcCookieAttrs(true)).toBe("path=/; max-age=7776000; SameSite=Lax; Secure");
    expect(fbcCookieAttrs(false)).toBe("path=/; max-age=7776000; SameSite=Lax");
  });
});

describe("phoneE164Br", () => {
  it("envia dígitos com DDI 55", () => {
    expect(phoneE164Br("11988887777")).toBe("5511988887777");
  });
});
