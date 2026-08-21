import { describe, expect, it } from "vitest";
import {
  indiceLiberado,
  planoKeyLiberada,
  posicaoPlano,
  treinouPlanoHoje,
} from "./liberacao";

const HOJE = "2026-08-20";
const ONTEM = "2026-08-19";
const HA_5_DIAS = "2026-08-15";

describe("posicaoPlano", () => {
  it("Dia 1 e Dia 2 da jornada são 1-1 e 1-2", () => {
    expect(posicaoPlano("1-1")).toBe(1);
    expect(posicaoPlano("1-2")).toBe(2);
  });
});

describe("indiceLiberado", () => {
  it("sem sessões libera só o Dia 1", () => {
    expect(indiceLiberado([], HOJE)).toBe(1);
    expect(planoKeyLiberada("1-1", [], HOJE)).toBe(true);
    expect(planoKeyLiberada("1-2", [], HOJE)).toBe(false);
  });

  it("após concluir 1-1 no mesmo dia, 1-2 fica bloqueado até a virada", () => {
    const sessoes = [{ data: HOJE, planoKey: "1-1" }];
    expect(treinouPlanoHoje(sessoes, HOJE)).toBe(true);
    expect(planoKeyLiberada("1-1", sessoes, HOJE)).toBe(true);
    expect(planoKeyLiberada("1-2", sessoes, HOJE)).toBe(false);
  });

  it("N dias de calendário sem treinar libera o próximo pendente (1 por dia)", () => {
    const sessoes = [{ data: HA_5_DIAS, planoKey: "1-1" }];
    expect(indiceLiberado(sessoes, HOJE)).toBe(6);
    expect(planoKeyLiberada("1-2", sessoes, HOJE)).toBe(true);
    expect(planoKeyLiberada("1-3", sessoes, HOJE)).toBe(false);
  });

  it("chave já concluída continua acessível (replay)", () => {
    const sessoes = [
      { data: ONTEM, planoKey: "1-1" },
      { data: HOJE, planoKey: "1-2" },
    ];
    expect(planoKeyLiberada("1-1", sessoes, HOJE)).toBe(true);
    expect(planoKeyLiberada("1-2", sessoes, HOJE)).toBe(true);
    expect(planoKeyLiberada("1-3", sessoes, HOJE)).toBe(false);
  });
});
