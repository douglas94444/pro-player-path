import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LIMITE_POR_HORA = 8;

async function chaveRemetente(suffix: string) {
  const { getRequestIP } = await import("@tanstack/react-start/server");
  let ip = "";
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? "";
  } catch {
    ip = "";
  }
  const bytes = new TextEncoder().encode(`${ip}|${suffix.toLowerCase()}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function rateLimit(chave: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const janela = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
  const { data: atual } = await supabaseAdmin
    .from("sugestoes_rate_limit")
    .select("id, envios")
    .eq("chave", chave)
    .eq("janela", janela)
    .maybeSingle();

  if (atual && atual.envios >= LIMITE_POR_HORA) {
    throw new Error("Muitos envios seguidos. Tente novamente daqui a pouco.");
  }
  if (atual) {
    await supabaseAdmin
      .from("sugestoes_rate_limit")
      .update({ envios: atual.envios + 1 })
      .eq("id", atual.id);
  } else {
    await supabaseAdmin.from("sugestoes_rate_limit").insert({ chave, janela, envios: 1 });
  }
}

export const enviarEscolinhaLead = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        nome: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        telefone: z.string().trim().max(20).nullable(),
        escolinha: z.string().trim().max(160).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await rateLimit(await chaveRemetente(`escolinha|${data.email}`));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("escolinha_leads").insert({
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      escolinha: data.escolinha,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const registrarAffiliateClick = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ code: z.string().trim().regex(/^[A-Za-z0-9_-]{1,40}$/) }).parse(data),
  )
  .handler(async ({ data }) => {
    await rateLimit(await chaveRemetente(`aff|${data.code}`));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("affiliate_clicks").insert({ code: data.code });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
