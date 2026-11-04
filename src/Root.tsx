import React from "react";
import { Composition, registerRoot } from "remotion";
import { Video } from "./Video";
import { guionSchema, type VideoProps } from "./schema";
import ejemplo from "../guiones/2026-11-05-kodak-camara-digital.json";
import { estimarTiming } from "./timing";

const FPS = 30;

const Root: React.FC = () => {
  const guion = guionSchema.parse(ejemplo);
  return (
    <Composition
      id="Video"
      component={Video}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 10}
      defaultProps={{ guion, timing: estimarTiming(guion), audio: null, musica: null } satisfies VideoProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil((props.timing.duracion + 0.6) * FPS),
      })}
    />
  );
};

registerRoot(Root);
