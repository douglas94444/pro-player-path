import { describe, expect, it } from "vitest";
import { isLovablePreviewHost, securityHeadersFor } from "./security-headers";

describe("CSP frame-ancestors", () => {
  it("produção e host próprio só permitem self", () => {
    const prod = securityHeadersFor("jogadorprosystem.com")["content-security-policy"];
    expect(prod).toMatch(/frame-ancestors 'self'(;|$)/);
    expect(prod).not.toMatch(/frame-ancestors[^;]*lovable/);
  });

  it("preview Lovable mantém ancestors do editor", () => {
    expect(isLovablePreviewHost("foo.lovable.app")).toBe(true);
    const csp = securityHeadersFor("foo.lovable.app")["content-security-policy"];
    expect(csp).toContain("*.lovable.app");
  });
});
