import { describe, expect, it } from "vitest";
import { acessoProAtivo, asPlanoAssinatura, estaPausado } from "./acesso";

describe("acessoProAtivo", () => {
  it("bloqueia não-assinante", () => {
    expect(acessoProAtivo(false, new Date(Date.now() + 86400000).toISOString())).toBe(false);
  });

  it("respeita assinante_until no passado", () => {
    expect(acessoProAtivo(true, new Date(Date.now() - 1000).toISOString())).toBe(false);
  });

  it("mantém acesso durante pausa (alívio de ritmo, não lockout)", () => {
    expect(
      acessoProAtivo(true, new Date(Date.now() + 86400000).toISOString(), new Date(Date.now() + 3600000).toISOString()),
    ).toBe(true);
  });

  it("libera se pausa já venceu", () => {
    expect(
      acessoProAtivo(true, new Date(Date.now() + 86400000).toISOString(), new Date(Date.now() - 1000).toISOString()),
    ).toBe(true);
  });
});

describe("estaPausado", () => {
  it("é true só com paused_until no futuro", () => {
    expect(estaPausado(new Date(Date.now() + 3600000).toISOString())).toBe(true);
    expect(estaPausado(new Date(Date.now() - 1000).toISOString())).toBe(false);
    expect(estaPausado(null)).toBe(false);
  });
});

describe("asPlanoAssinatura", () => {
  it("só aceita planos conhecidos", () => {
    expect(asPlanoAssinatura("semestral")).toBe("semestral");
    expect(asPlanoAssinatura("vip")).toBeNull();
  });
});
