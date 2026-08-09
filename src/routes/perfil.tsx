import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlayer } from "@/lib/player-store";
import { requestStreakReminderPermission, scheduleStreakReminder } from "@/lib/streak-reminder";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil do jogador — Jogador PRO System" },
      { name: "description", content: "Seu nome, nível atual, plano ativo e preferências da conta." },
      { property: "og:title", content: "Perfil do jogador" },
      { property: "og:description", content: "Gerencie seu nível, plano e dados de treino." },
    ],
  }),
  component: PerfilPage,
});

const MOTIVOS_CANCEL = [
  { id: "preco", label: "Está caro no momento" },
  { id: "tempo", label: "Não tenho tempo de treinar" },
  { id: "conteudo", label: "Não usei o suficiente" },
  { id: "outro", label: "Outro motivo" },
];

function PerfilPage() {
  const { state, nivel, totalTreinos, setNome, cancelar, reset, logado, email, sair, streak, isAdmin } =
    usePlayer();
  const [mostrarCancel, setMostrarCancel] = useState(false);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const confirmarCancelamento = async () => {
    if (!motivo) {
      toast.message("Escolha um motivo para continuar");
      return;
    }
    setCancelando(true);
    try {
      const r = await cancelar();
      if (r.error) toast.error("Não foi possível cancelar", { description: r.error });
      else {
        toast.message("Assinatura cancelada", {
          description: "Você mantém o histórico. Pode voltar quando quiser.",
        });
        setMostrarCancel(false);
        setMotivo(null);
      }
    } finally {
      setCancelando(false);
    }
  };

  return (
    <AppShell title="Perfil" subtitle={`Jogador ${nivel} · ${totalTreinos} treinos`}>
      <section className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-soft">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Conta</p>
        {logado ? (
          <>
            <p className="mt-2 text-sm font-semibold text-foreground">{email}</p>
            <p className="text-xs text-muted-foreground">Progresso sincronizado na nuvem.</p>
            {isAdmin ? (
              <Button asChild className="mt-4 w-full font-extrabold">
                <Link to="/admin">Painel admin</Link>
              </Button>
            ) : null}
            <Button variant="outline" className="mt-4 w-full" onClick={() => void sair()}>
              Sair da conta
            </Button>
          </>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              Você está como visitante. Crie sua conta para sincronizar treinos e streak em qualquer aparelho.
            </p>
            <Button asChild className="mt-4 h-12 w-full font-extrabold">
              <Link to="/auth" search={{}}>
                Entrar ou criar conta
              </Link>
            </Button>
          </>
        )}
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-soft">
        <Label htmlFor="nome" className="text-xs uppercase tracking-widest text-muted-foreground">
          Seu nome
        </Label>
        <Input id="nome" value={state.nome} onChange={(e) => setNome(e.target.value)} className="mt-2" />
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-soft">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Assinatura</p>
        <p className="mt-2 text-lg font-extrabold text-foreground">
          {state.assinante ? `Assinatura ${state.plano}` : "Gratuito (semanas 1–2)"}
        </p>

        {state.assinante ? (
          !mostrarCancel ? (
            <Button variant="outline" className="mt-4 w-full" onClick={() => setMostrarCancel(true)}>
              Cancelar assinatura
            </Button>
          ) : (
            <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <p className="text-sm font-bold text-foreground">Antes de sair…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Com PRO você mantém Semanas 3–4, biblioteca premium e o ritmo de evolução. Pode voltar quando
                quiser.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Por que está cancelando?
              </p>
              <div className="mt-2 grid gap-2">
                {MOTIVOS_CANCEL.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMotivo(m.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-sm font-medium",
                      motivo === m.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/60 bg-card text-muted-foreground",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  className="w-full font-extrabold"
                  onClick={() => {
                    setMostrarCancel(false);
                    setMotivo(null);
                    toast.success("Boa escolha", { description: "Sua assinatura PRO segue ativa." });
                  }}
                >
                  Manter PRO
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive"
                  disabled={cancelando}
                  onClick={() => void confirmarCancelamento()}
                >
                  {cancelando ? "Cancelando…" : "Confirmar cancelamento"}
                </Button>
              </div>
            </div>
          )
        ) : (
          <Button asChild className="mt-4 h-12 w-full font-extrabold">
            <Link to="/planos" search={{ from: "perfil" }}>
              Liberar acesso completo
            </Link>
          </Button>
        )}
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-soft">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Lembrete de streak</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Ative notificações locais para avisar quando o streak estiver em risco.
        </p>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => {
            void requestStreakReminderPermission().then((perm) => {
              if (perm === "granted") {
                scheduleStreakReminder(state.nome, streak);
                toast.success("Lembrete ativado", { description: "Avisaremos por volta das 20h." });
              } else if (perm === "denied") {
                toast.error("Notificações bloqueadas no navegador");
              } else {
                toast.message("Notificações não suportadas neste dispositivo");
              }
            });
          }}
        >
          Ativar lembrete
        </Button>
      </section>

      <section className="mt-4 rounded-[1.5rem] border border-destructive/25 bg-card p-5 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-widest text-destructive">Zona de perigo</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {logado
            ? "Zerar apaga o progresso local deste aparelho. O histórico na nuvem pode permanecer."
            : "Zerar apaga streak, treinos e dados salvos neste dispositivo. Não dá para desfazer."}
        </p>
        {!confirmReset ? (
          <Button variant="ghost" className="mt-3 w-full text-destructive" onClick={() => setConfirmReset(true)}>
            Zerar progresso
          </Button>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-destructive">Tem certeza? Isso não pode ser desfeito.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmReset(false)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                  toast.message("Progresso zerado");
                }}
              >
                Sim, zerar
              </Button>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
