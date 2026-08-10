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
  videoUrl,
}: {
  demo?: keyof typeof LABELS;
  nome: string;
  videoUrl?: string;
}) {
  if (videoUrl) {
    const isYoutube = /youtube\.com|youtu\.be/.test(videoUrl);
    return (
      <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-card">
        {isYoutube ? (
          <iframe
            title={nome}
            src={videoUrl.includes("embed") ? videoUrl : videoUrl.replace("watch?v=", "embed/")}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video className="h-full w-full object-cover" src={videoUrl} controls playsInline preload="metadata" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl border border-border",
        demo === "bola" && "bg-secondary",
        demo === "forca" && "bg-secondary",
        demo === "core" && "bg-secondary",
        demo === "mobilidade" && "bg-secondary",
        demo === "cardio" && "bg-secondary",
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
        <p className="mt-2 text-[11px] text-muted-foreground">Cole videoUrl no exercício para demo filmada</p>
        <div className="mx-auto mt-5 h-1.5 w-24 overflow-hidden rounded-full bg-card">
          <div className="h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
