import { describe, expect, it } from "vitest";
import {
  collectForwardedIps,
  isPreferableIPv6,
  normalizarNomeMeta,
  normalizarTelefoneBr,
  partirNome,
  pickClientIp,
} from "./capi.ts";

describe("normalizarTelefoneBr", () => {
  it("vira E.164 BR sem duplicar 55", () => {
    expect(normalizarTelefoneBr("(11) 98888-7777")).toBe("5511988887777");
    expect(normalizarTelefoneBr("5511988887777")).toBe("5511988887777");
    expect(normalizarTelefoneBr("")).toBe("");
  });
});

describe("pickClientIp", () => {
  it("prefere IPv6 na cadeia x-forwarded-for", () => {
    const ips = collectForwardedIps(
      {
        get(name) {
          if (name === "x-forwarded-for") return "189.1.2.3, 2804:14d:1:0:1::1, 10.0.0.1";
          return null;
        },
      },
    );
    expect(pickClientIp(ips)).toBe("2804:14d:1:0:1::1");
  });

  it("usa Cloudflare quando só há IPv6 lá", () => {
    const ips = collectForwardedIps({
      get(name) {
        if (name === "cf-connecting-ip") return "2001:db8::1";
        if (name === "x-forwarded-for") return "203.0.113.10";
        return null;
      },
    });
    expect(pickClientIp(ips)).toBe("2001:db8::1");
  });

  it("não trata ::ffff: como IPv6 preferível", () => {
    expect(isPreferableIPv6("::ffff:192.0.2.1")).toBe(false);
    expect(pickClientIp(["::ffff:192.0.2.1", "198.51.100.2"])).toBe("198.51.100.2");
  });

  it("não inventa IP quando não há header", () => {
    expect(pickClientIp(collectForwardedIps({ get: () => null }))).toBeUndefined();
  });
});

describe("partirNome", () => {
  it("normaliza acento e pontuação", () => {
    expect(normalizarNomeMeta("João")).toBe("joao");
    expect(normalizarNomeMeta("D'Ávila")).toBe("davila");
  });

  it("separa fn/ln e ignora o placeholder Jogador", () => {
    expect(partirNome("João da Silva")).toEqual({ fn: "joao", ln: "dasilva" });
    expect(partirNome("Mateus")).toEqual({ fn: "mateus" });
    expect(partirNome("Jogador")).toEqual({});
    expect(partirNome("")).toEqual({});
  });
});
