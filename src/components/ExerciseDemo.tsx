import { useEffect, useState } from "react";
import { Play, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = {
  mobilidade: "Mobilidade",
  forca: "Força",
  cardio: "Cardio",
  core: "Core",
  bola: "Bola",
} as const;

function Ilustracao({ demo, nome, aviso }: { demo: keyof typeof LABELS; nome: string; aviso: string }) {
  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl border border-border bg-secondary">
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
        <p className="mt-2 text-[11px] text-muted-foreground">{aviso}</p>
        <div className="mx-auto mt-5 h-1.5 w-24 overflow-hidden rounded-full bg-card">
          <div className="h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

function VideoSkeleton() {
  return (
    <div className="absolute inset-0 animate-pulse bg-secondary">
      <div className="absolute inset-x-6 bottom-6 h-2 rounded-full bg-card" />
      <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card" />
    </div>
  );
}

export function ExerciseDemo({
  demo = "cardio",
  nome,
  videoUrl,
}: {
  demo?: keyof typeof LABELS;
  nome: string;
  videoUrl?: string;
}) {
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);
  // Embeds só montam o iframe depois do play (evita carregar o player de terceiros à toa).
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    setCarregando(true);
    setFalhou(false);
    setAtivo(false);
  }, [videoUrl]);

  if (!videoUrl) {
    return <Ilustracao demo={demo} nome={nome} aviso="Vídeo em breve — siga pela descrição do exercício" />;
  }

  if (falhou) {
    return (
      <div className="relative flex aspect-video flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-border bg-secondary px-6 text-center">
        <VideoOff className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-extrabold text-foreground">Vídeo em breve</p>
        <p className="text-[11px] text-muted-foreground">
          Não conseguimos carregar a demonstração de “{nome}”. Siga pelo tempo e pela descrição.
        </p>
        <button
          type="button"
          onClick={() => {
            setFalhou(false);
            setCarregando(true);
          }}
          className="mt-1 text-xs font-semibold text-primary underline underline-offset-4"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const isEmbed = /youtube\.com|youtu\.be|vimeo\.com/.test(videoUrl);
  const embedSrc = /youtu\.be\//.test(videoUrl)
    ? videoUrl.replace("youtu.be/", "www.youtube.com/embed/")
    : /vimeo\.com/.test(videoUrl) && !videoUrl.includes("player.vimeo")
      ? videoUrl.replace("vimeo.com/", "player.vimeo.com/video/")
      : videoUrl.includes("embed")
        ? videoUrl
        : videoUrl.replace("watch?v=", "embed/");

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-card">
      {carregando && (!isEmbed || ativo) ? <VideoSkeleton /> : null}
      {isEmbed && !ativo ? (
        <button
          type="button"
          onClick={() => setAtivo(true)}
          className="group flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary"
          aria-label={`Reproduzir demonstração de ${nome}`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Play className="h-6 w-6 fill-current" />
          </span>
          <span className="px-6 text-center text-xs font-semibold text-muted-foreground">
            Tocar demonstração — {nome}
          </span>
        </button>
      ) : isEmbed ? (
        <iframe
          loading="lazy"
          title={nome}
          src={embedSrc.includes("?") ? `${embedSrc}&autoplay=1` : `${embedSrc}?autoplay=1`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setCarregando(false)}
          onError={() => {
            setCarregando(false);
            setFalhou(true);
          }}
        />
      ) : (
        <video
          className="h-full w-full object-cover"
          src={videoUrl}
          controls
          playsInline
          preload="none"
          onLoadedData={() => setCarregando(false)}
          onCanPlay={() => setCarregando(false)}
          onError={() => {
            setCarregando(false);
            setFalhou(true);
          }}
        />
      )}
    </div>
  );
}
