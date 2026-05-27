import layersIcon from "@/assets/icons/layers.svg?sprite";
import globeIcon from "@/assets/icons/globe.svg?sprite";
import searchIcon from "@/assets/icons/search.svg?sprite";
import analysisIcon from "@/assets/icons/analysis.svg?sprite";

import Analysis from "@/components/analysis";
import Legend from "@/components/map/components/legend";
import Datasets from "./components/sections/datasets";
import Search from "./components/sections/search";

export const upperSections = [
  {
    label: "search",
    slug: "search",
    icon: searchIcon,
    Component: Search,
    large: true,
  },
];

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

export const searchSections = [];
