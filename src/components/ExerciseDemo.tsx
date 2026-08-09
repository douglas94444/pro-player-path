import { cn } from "@/lib/utils";

const LABELS = {
  mobilidade: "Mobilidade",
  forca: "Força",
  cardio: "Cardio",
  core: "Core",
  bola: "Bola",
} as const;

export function ExerciseDemo({
  demo = "cardio",
  nome,
}: {
  demo?: keyof typeof LABELS;
  nome: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl border border-border",
        demo === "bola" && "bg-gradient-to-br from-emerald-500/25 via-card to-card",
        demo === "forca" && "bg-gradient-to-br from-orange-500/25 via-card to-card",
        demo === "core" && "bg-gradient-to-br from-sky-500/25 via-card to-card",
        demo === "mobilidade" && "bg-gradient-to-br from-violet-500/20 via-card to-card",
        demo === "cardio" && "bg-gradient-to-br from-primary/25 via-card to-card",
      )}
    >
      <span
        className={cn(
          "absolute h-28 w-28 rounded-full border-2 border-primary/40",
          demo === "cardio" || demo === "bola" ? "animate-ping" : "animate-pulse",
        )}
      />
      <span className="absolute h-20 w-20 animate-pulse rounded-full bg-primary/20" />
      <div className="relative z-10 px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{LABELS[demo]}</p>
        <p className="mt-2 text-xl font-extrabold text-foreground">{nome}</p>
        <div className="mx-auto mt-5 h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
