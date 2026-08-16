import { MessageSquareQuote, ShieldCheck } from "lucide-react";
import { CAMPANHA } from "@/data/campanha-copy";

/**
 * Resumo honesto da prova social: usa apenas dados reais (quantidade de
 * mensagens transcritas). Sem nota média nem contagem inventada.
 */
export function AvaliacoesWidget() {
  const total = CAMPANHA.depoimentos.itens.length;
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-[1.25rem] border border-border/60 bg-card/70 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <MessageSquareQuote className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-black leading-none text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground">mensagens de alunos transcritas na íntegra</p>
        </div>
      </div>
      <p className="flex items-start gap-2 text-xs text-muted-foreground sm:max-w-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        {CAMPANHA.depoimentos.selo}
      </p>
    </div>
  );
}
