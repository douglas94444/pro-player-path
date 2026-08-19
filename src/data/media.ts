/**
 * Assets de mídia (stock público) para prova visual e demos de exercício.
 * Troque pelas filmagens próprias do Jogador PRO quando disponíveis.
 */

/** Teaser da campanha — treino/bola em campo (Pexels). */
export const TEASER_TREINO_VIDEO =
  "https://videos.pexels.com/video-files/6077719/6077719-sd_640_360_25fps.mp4";

/** Demos curtos por tipo de exercício (Pexels — demonstração do movimento). */
export const DEMO_VIDEOS = {
  mobilidade:
    "https://videos.pexels.com/video-files/3195394/3195394-sd_640_360_25fps.mp4",
  forca: "https://videos.pexels.com/video-files/5319760/5319760-sd_640_360_25fps.mp4",
  cardio: "https://videos.pexels.com/video-files/5319759/5319759-sd_640_360_25fps.mp4",
  core: "https://videos.pexels.com/video-files/3195394/3195394-sd_640_360_25fps.mp4",
  bola: TEASER_TREINO_VIDEO,
} as const;

