import { describe, expect, it } from "vitest";
import { acessoProAtivo, asPlanoAssinatura } from "./acesso";

describe("acessoProAtivo", () => {
  it("bloqueia não-assinante", () => {
    expect(acessoProAtivo(false, new Date(Date.now() + 86400000).toISOString())).toBe(false);
  });

  it("respeita assinante_until no passado", () => {
    expect(acessoProAtivo(true, new Date(Date.now() - 1000).toISOString())).toBe(false);
  });

  it("bloqueia durante paused_until futuro", () => {
    expect(
      acessoProAtivo(true, new Date(Date.now() + 86400000).toISOString(), new Date(Date.now() + 3600000).toISOString()),
    ).toBe(false);
  });

  it("libera se pausa já venceu", () => {
    expect(
      acessoProAtivo(true, new Date(Date.now() + 86400000).toISOString(), new Date(Date.now() - 1000).toISOString()),
    ).toBe(true);
  });
});

describe("asPlanoAssinatura", () => {
  it("só aceita planos conhecidos", () => {
    expect(asPlanoAssinatura("semestral")).toBe("semestral");
    expect(asPlanoAssinatura("vip")).toBeNull();
  });
});
