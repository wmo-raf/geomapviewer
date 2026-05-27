import layersIcon from "@/assets/icons/layers.svg?sprite";
import globeIcon from "@/assets/icons/globe.svg?sprite";
import analysisIcon from "@/assets/icons/analysis.svg?sprite";

import Analysis from "@/components/analysis";
import Legend from "@/components/map/components/legend";
import Datasets from "./components/sections/datasets";

export const mobileSections = [
  {
    label: "layers",
    slug: "datasets",
    icon: globeIcon,
    Component: Datasets,
  },
  {
    label: "legend",
    slug: "legend",
    icon: layersIcon,
    Component: Legend,
    embed: true,
  },
  {
    label: "analysis",
    slug: "analysis",
    icon: analysisIcon,
    Component: Analysis,
    embed: true,
  },
];
