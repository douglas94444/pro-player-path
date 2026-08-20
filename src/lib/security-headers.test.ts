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

describe("CSP script-src do editor", () => {
  it("preview libera cdn.gpteng.co", () => {
    const csp = securityHeadersFor("preview--foo.lovable.app")["content-security-policy"]!;
    expect(csp).toMatch(/script-src[^;]*https:\/\/cdn\.gpteng\.co/);
  });

  it("produção não libera cdn.gpteng.co", () => {
    const csp = securityHeadersFor("jogadorprosystem.com")["content-security-policy"]!;
    expect(csp).not.toContain("cdn.gpteng.co");
  });
});
