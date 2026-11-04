import React from "react";
import { Composition, registerRoot } from "remotion";
import { Video } from "./Video";
import { MotionVideo } from "./Motion";
import { MixtoVideo } from "./Mixto";
import { guionSchema, type VideoProps } from "./schema";
import ejemplo from "../guiones/2026-11-05-kodak-camara-digital.json";
import { estimarTiming } from "./timing";

const FPS = 30;

const Root: React.FC = () => {
  const guion = guionSchema.parse(ejemplo);
  const comun = {
    width: 1080,
    height: 1920,
    fps: FPS,
    durationInFrames: FPS * 10,
    defaultProps: { guion, timing: estimarTiming(guion), audio: null, musica: null } satisfies VideoProps,
    calculateMetadata: ({ props }: { props: VideoProps }) => ({
      durationInFrames: Math.ceil((props.timing.duracion + 0.6) * FPS),
    }),
  };
  return (
    <>
      {/* Documental: fotos reales con fondo desenfocado */}
      <Composition id="Video" component={Video} {...comun} />
      {/* Motion 2D: íconos planos y tipografía cinética */}
      <Composition id="Motion" component={MotionVideo} {...comun} />
      {/* Mixto: fotos reales con gráficos animados encima (formato principal) */}
      <Composition id="Mixto" component={MixtoVideo} {...comun} />
    </>
  );
};

registerRoot(Root);
