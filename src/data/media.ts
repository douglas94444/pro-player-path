/**
 * Assets de mídia (stock público) para prova visual e demos de exercício.
 * Troque pelas filmagens próprias do Jogador PRO quando disponíveis.
 */

/** Teaser da campanha — treino/bola em campo (Pexels). */
export const TEASER_TREINO_VIDEO =
  "https://videos.pexels.com/video-files/6077718/6077718-sd_640_360_24fps.mp4";

/** Slots de prova social (fotos reais de treino/jogo — Unsplash). */
export const PROVA_SLOTS = [
  {
    type: "image" as const,
    src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
    title: "Treino com bola no campo",
  },
  {
    type: "image" as const,
    src: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=900&q=80",
    title: "Ritmo de jogo",
  },
  {
    type: "video" as const,
    src: "https://videos.pexels.com/video-files/4770380/4770380-sd_640_360_25fps.mp4",
    title: "Ativação e arranque",
  },
  {
    type: "image" as const,
    src: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80",
    title: "Consistência no dia a dia",
  },
  {
    type: "image" as const,
    src: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80",
    title: "Treino solo em casa/campo",
  },
];

/** Demos curtos por tipo de exercício (Pexels — demonstração do movimento). */
export const DEMO_VIDEOS = {
  mobilidade:
    "https://videos.pexels.com/video-files/4754017/4754017-sd_640_360_30fps.mp4",
  forca: "https://videos.pexels.com/video-files/2785521/2785521-sd_640_360_24fps.mp4",
  cardio: "https://videos.pexels.com/video-files/5319759/5319759-sd_640_360_25fps.mp4",
  core: "https://videos.pexels.com/video-files/4325505/4325505-sd_640_360_25fps.mp4",
  bola: TEASER_TREINO_VIDEO,
} as const;
