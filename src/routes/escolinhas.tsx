import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageFrame } from "@/components/PageFrame";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";
import { safeWrite } from "@/lib/supabase-write";

export const Route = createFileRoute("/escolinhas")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  head: () => ({
    meta: [
      { title: "Jogador PRO para escolinhas" },
      {
        name: "description",
        content: "Leve o sistema de treinos guiados para sua escolinha ou pelada organizada.",
      },
    ],
  }),
  component: EscolinhasPage,
});

function EscolinhasPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [escolinha, setEscolinha] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (nome.trim().length < 2 || !email.includes("@")) {
      toast.message("Preencha nome e e-mail válidos");
      return;
    }
    setEnviando(true);
    try {
      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim() || null,
        escolinha: escolinha.trim() || null,
      };
      const ok = await safeWrite("seu interesse", () => supabase.from("escolinha_leads").insert(payload), {
        table: "escolinha_leads",
        op: "insert",
        payload,
      });
      if (!ok) return;
      toast.success("Recebemos seu interesse", { description: "Entraremos em contato em breve." });
      setNome("");
      setEmail("");
      setTelefone("");
      setEscolinha("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PageFrame max="sm" className="justify-center">
      <div className="w-full rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-soft-lg sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">B2B2C</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          Jogador PRO para escolinhas
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sistema diário para alunos treinarem sozinhos entre as aulas — com progresso e accountability.
        </p>
        <div className="mt-6 space-y-3">
          <div>
            <Label htmlFor="nome">Seu nome</Label>
            <Input id="nome" className="mt-1" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tel">WhatsApp</Label>
            <Input id="tel" className="mt-1" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="esc">Nome da escolinha / pelada</Label>
            <Input
              id="esc"
              className="mt-1"
              value={escolinha}
              onChange={(e) => setEscolinha(e.target.value)}
            />
          </div>
          <Button className="h-12 w-full font-extrabold" disabled={enviando} onClick={() => void enviar()}>
            {enviando ? "Enviando…" : "Quero parceria"}
          </Button>
        </div>
      </div>
    </PageFrame>
  );
}
