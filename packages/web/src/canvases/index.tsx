import type { ReactNode } from "react";
import type { CanvasModel } from "@pdt42/core";
import type { Ctx } from "../context.ts";
import {
  ArenaScan,
  Brief,
  EcosystemScan,
  PatternCards,
  PlatformPlays,
  Vrio,
  Wardley,
} from "./exploration.tsx";
import {
  Board,
  Ecosystem,
  Experience,
  Learning,
  Motivations,
  Mvp,
  PlatformDesign,
  Portrait,
} from "./design.tsx";
import { Flywheels, Growth, Liquidity, Network, Strategy } from "./growth.tsx";

export function renderCanvas(ctx: Ctx, m: CanvasModel): ReactNode {
  switch (m.canvas) {
    case "arena-scan":
      return <ArenaScan ctx={ctx} m={m} />;
    case "ecosystem-scan":
      return <EcosystemScan ctx={ctx} m={m} />;
    case "vrio":
      return <Vrio ctx={ctx} m={m} />;
    case "wardley-map":
      return <Wardley ctx={ctx} m={m} />;
    case "platform-plays":
      return <PlatformPlays ctx={ctx} m={m} />;
    case "pattern-cards":
      return <PatternCards ctx={ctx} m={m} />;
    case "brief-consolidation":
      return <Brief ctx={ctx} m={m} />;
    case "ecosystem":
      return <Ecosystem ctx={ctx} m={m} />;
    case "entity-portrait":
      return <Portrait ctx={ctx} m={m} />;
    case "motivations-matrix":
      return <Motivations ctx={ctx} m={m} />;
    case "transactions-board":
      return <Board ctx={ctx} m={m} />;
    case "learning-engine":
      return <Learning ctx={ctx} m={m} />;
    case "platform-experience":
      return <Experience ctx={ctx} m={m} />;
    case "mvp":
      return <Mvp ctx={ctx} m={m} />;
    case "platform-design":
      return <PlatformDesign ctx={ctx} m={m} />;
    case "platform-strategy-model":
      return <Strategy ctx={ctx} m={m} />;
    case "network-properties":
      return <Network ctx={ctx} m={m} />;
    case "flywheel-sketching":
      return <Flywheels ctx={ctx} m={m} />;
    case "liquidity":
      return <Liquidity ctx={ctx} m={m} />;
    case "growth-model":
      return <Growth ctx={ctx} m={m} />;
  }
}
