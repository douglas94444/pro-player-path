import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Bug, ThumbsUp, Lightbulb } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { RouteError, RouteNotFound } from "@/components/RouteBoundary";
import { listarSugestoes } from "@/lib/sugestoes.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/sugestoes")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: SugestoesPage,
});

const tipoBadge: Record<
  string,
  { label: string; icon: React.ElementType; className: string } | undefined
> = {
  sugestao: { label: "Sugestão", icon: Lightbulb, className: "bg-primary/10 text-primary" },
  bug: { label: "Bug", icon: Bug, className: "bg-destructive/10 text-destructive" },
  elogio: { label: "Elogio", icon: ThumbsUp, className: "bg-accent/40 text-accent-foreground" },
};

const defaultBadge = tipoBadge["sugestao"]!;

type Sugestao = Awaited<ReturnType<typeof listarSugestoes>>[number];

function SugestoesPage() {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void listarSugestoes()
      .then((data) => setSugestoes(data))
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar"))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <AdminShell title="Sugestões" subtitle={`${sugestoes.length} mensagens recebidas`}>
      {erro ? <p className="mb-4 text-sm text-destructive">{erro}</p> : null}

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : sugestoes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">Nenhuma sugestão ainda</p>
          <p className="text-xs text-muted-foreground">
            As mensagens enviadas pelos usuários aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sugestoes.map((s) => {
            const badge = tipoBadge[s.tipo] ?? defaultBadge;
            const Icon = badge.icon;
            return (
              <div
                key={s.id}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", badge.className)}>
                    <Icon className="h-3 w-3" /> {badge.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {s.nome} {s.email ? <span className="font-normal text-muted-foreground">· {s.email}</span> : null}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{s.mensagem}</p>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
