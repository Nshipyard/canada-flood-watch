"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    line: "An open-source civic project. Not affiliated with the Government of Canada.",
    badge: "Open source",
  },
  nav: { map: "Map", history: "History", watch: "Watch", protection: "Protection", method: "Method", data: "Data", back: "All projects" },
  hero: {
    kicker: "Nshipyard Canada · Flood intelligence",
    title: "Where Canada floods.",
    sub: "Twenty-six years of news-reported flood events, clipped to Canada from the open Groundsource dataset, laid under live rainfall radar and current weather alerts from Environment and Climate Change Canada. History tells you where water has gone before; the live layers show where rain is falling now.",
    cta1: "Open the live map",
    cta2: "How the watch flag works",
  },
  stats: {
    events: "news-reported flood events in Canada, 2000-2026",
    provinces: "provinces and territories with recorded events",
    studies: "flood hazard study areas in the national inventory",
    structures: "flood protection structures inventoried in British Columbia",
  },
  map: {
    kicker: "Live map",
    title: "History under live weather.",
    body: "Blue dots are flood events reported in the news since 2010. Toggle the live layers to lay today's rainfall radar and current official alerts over the historical footprint. Nothing here is a forecast: it is the record, plus the weather, side by side.",
    layers: "Layers",
    lHistory: "Flood events (2010-2026)",
    lStudies: "Flood hazard study areas",
    lRadar: "Live precipitation radar",
    lAlerts: "Current weather alerts",
    lProtection: "BC flood protection works",
    timestamps: "Data timestamps",
    histNote: "Historical events: Groundsource open data, 2000-2026, processed {built}.",
    liveNote: "Radar and alerts: Environment and Climate Change Canada, latest available at the moment you load this page. Radar refreshes about every 10 minutes.",
    legendEvents: "Reported flood event",
    legendStudy: "Flood hazard study area",
    legendRadar: "Precipitation rate (mm/h)",
    legendAlert: "Active weather alert",
    legendDike: "Flood protection work",
    clickHint: "Click the map to query official alert details at that point.",
    alertAt: "Official alerts at this point",
    noAlert: "No active alert returned for this point.",
    close: "Close",
  },
  history: {
    kicker: "The record",
    title: "Twenty-six years of reported floods.",
    body: "Groundsource turned five million news articles into 2.6 million geo-tagged flood events worldwide. Clipped to Canada, the record shows where reporters wrote about water, which tracks where floods disrupted lives closely enough to be useful, with two biases stated plainly below.",
    byYear: "Reported flood events by year",
    byYearSub: "Canada, 2000-2026. Spikes follow major flood years; quiet years reflect quiet weather and quiet newsrooms.",
    byMonth: "When floods get reported",
    byMonthSub: "Share of all events by month. Spring freshet and summer storms dominate the Canadian record.",
    byProvince: "Events by province and territory",
    byProvinceSub: "Raw counts from news reports, not per-capita rates.",
    caveatsTitle: "Read the record honestly",
    caveats: [
      "One storm can produce several rows: the dataset is entity-based, so a single large flood reported in five places is five records, not one event.",
      "News coverage is the sensor. English-language outlets dominate, remote floods go under-reported, and dramatic floods get more ink than slow ones.",
      "Locations are approximate: each record is a polygon or buffered point from a geocoding step Google rates at about 60% for exact location and timing.",
    ],
  },
  watch: {
    kicker: "Watch",
    title: "An honest early signal, not a forecast.",
    body: "Version 1 does not run a flood model. It applies one documented rule: places with a deep history of reported floods deserve attention whenever heavy rain or an official alert lands on them. Google's Flood Hub runs the calibrated version of this idea; this page shows the ingredients it is built from.",
    ruleTitle: "The v1 watch rule",
    rule: "A region is flagged for watch when it ranks in the top quarter of historical reported floods AND either current radar shows significant precipitation over it or an official weather alert covers it. The first half is computed from the record below; the second half you read off the live map above.",
    tableTitle: "Hardest-hit provinces in the record",
    tableSub: "Ranked by reported flood events, 2000-2026, with each province's peak month.",
    thProvince: "Province / territory",
    thEvents: "Reported events",
    thPeak: "Peak month",
    thShare: "Share of national total",
    howto: "How to use this page in a storm",
    steps: [
      "Open the live map and turn on precipitation radar plus current alerts.",
      "Find your region in the table: high historical counts plus an active alert is the combination that has preceded the worst Canadian floods.",
      "Check the official alert text by clicking the map, then follow Environment and Climate Change Canada guidance, not this page.",
    ],
  },
  protection: {
    kicker: "Protection",
    title: "What stands between water and towns.",
    body: "British Columbia publishes the only open, province-wide inventory of flood protection works in Canada: dikes, sea walls, pump stations, and the structures that keep them working. The map layer shows them; the counts below come from the province's open warehouse.",
    lineKm: "kilometres of dike and flood protection linework inventoried",
    structures: "appurtenant structures (pump stations, gates, flood boxes)",
    note: "No other province publishes an equivalent open inventory. Absence from this map is absence of open data, not absence of dikes.",
    cfmTitle: "Flood hazard study areas",
    cfmBody: "The Canada Flood Map Inventory lists 675 flood study areas from provincial, territorial, and municipal programs. Each entry links to its owner and publication status.",
    cfmLink: "Browse the study areas",
  },
  method: {
    kicker: "Method",
    title: "What this is, and what it is not.",
    items: [
      "Historical layer: Groundsource (Google Research, CC BY 4.0, Zenodo record 18647054), 2,646,302 events worldwide, 2000-2026. Events were clipped to Canada by testing each record's centroid against Canada Flood Map Inventory province boundaries; {total} fell inside. Aggregates are committed as JSON in public/data.",
      "Live layers: Environment and Climate Change Canada web services, fetched by your browser at view time. Radar is the 1 km North American precipitation-rate mosaic (RADAR_1KM_RRAI); alerts are the Current-Alerts layer. Neither passes through our servers.",
      "Watch rule v1: top-quartile historical counts per province, combined with live radar and alerts as described above. It is a documented heuristic, not a calibrated forecast, and it is labelled as such everywhere it appears.",
      "Protection layer: BC Geographic Warehouse flood protection works (lines and appurtenant structures), plus the 675-area Canada Flood Map Inventory from Natural Resources Canada.",
      "Refresh: the historical record rebuilds when Groundsource publishes a new version; live layers are always current at view time. Build date is stamped on every aggregate file.",
      "What v1 cannot do: predict water levels, time a flood's arrival, or cover places the news never wrote about. For operational forecasting, see Google's Flood Hub, which trains on this same Groundsource recipe.",
    ],
  },
  data: {
    kicker: "Open data",
    title: "Take the files.",
    body: "Every aggregate on this page, as JSON, rebuilt from the open sources above. Raw inputs are excluded from the repository; the build script documents the full pipeline.",
    download: "Download",
    files: [
      { name: "summary.json", desc: "Totals, date range, source citation, build date." },
      { name: "by_province.json", desc: "Reported events per province and territory." },
      { name: "by_year.json", desc: "Reported events per year, 2000-2026." },
      { name: "by_month.json", desc: "Reported events per calendar month." },
      { name: "points.json", desc: "Sampled event locations for the map (2010+, capped)." },
      { name: "cfm_studies.json", desc: "675 flood hazard study areas: name, province, date, status, owner." },
      { name: "bc_protection.json", desc: "BC flood protection works: counts and dike kilometres." },
    ],
  },
  footer: {
    line1: "Flood Watch Canada is an open-source project by Richardson Dackam, part of Nshipyard Canada.",
    line2: "Historical flood data: Groundsource, Google Research (CC BY 4.0). Live weather: Environment and Climate Change Canada. Flood protection: Government of British Columbia. Flood study areas: Natural Resources Canada. Not affiliated with the Government of Canada.",
    repo: "GitHub repository",
  },
};

const fr: typeof en = {
  banner: {
    line: "Un projet civic open source. Sans affiliation avec le gouvernement du Canada.",
    badge: "Open source",
  },
  nav: { map: "Carte", history: "Historique", watch: "Vigilance", protection: "Protection", method: "Méthode", data: "Données", back: "Tous les projets" },
  hero: {
    kicker: "Nshipyard Canada · Intelligence des inondations",
    title: "Où le Canada inonde.",
    sub: "Vingt-six ans d'inondations rapportées dans les nouvelles, extraites pour le Canada du jeu de données ouvert Groundsource, sous le radar de précipitations en direct et les alertes météo d'Environnement et Changement climatique Canada. L'historique indique où l'eau est déjà allée; les couches en direct montrent où il pleut maintenant.",
    cta1: "Ouvrir la carte en direct",
    cta2: "Comment fonctionne la vigilance",
  },
  stats: {
    events: "inondations rapportées dans les nouvelles au Canada, 2000-2026",
    provinces: "provinces et territoires avec des événements enregistrés",
    studies: "zones d'étude des aléas d'inondation à l'inventaire national",
    structures: "ouvrages de protection contre les inondations inventoriés en Colombie-Britannique",
  },
  map: {
    kicker: "Carte en direct",
    title: "L'historique sous la météo en direct.",
    body: "Les points bleus sont des inondations rapportées depuis 2010. Activez les couches en direct pour superposer le radar de précipitations et les alertes officielles à l'empreinte historique. Rien ici n'est une prévision : c'est le dossier, plus la météo, côte à côte.",
    layers: "Couches",
    lHistory: "Inondations (2010-2026)",
    lStudies: "Zones d'étude des aléas",
    lRadar: "Radar de précipitations en direct",
    lAlerts: "Alertes météo en cours",
    lProtection: "Ouvrages de protection de la C.-B.",
    timestamps: "Horodatage des données",
    histNote: "Événements historiques : données ouvertes Groundsource, 2000-2026, traitées le {built}.",
    liveNote: "Radar et alertes : Environnement et Changement climatique Canada, les plus récents au moment du chargement. Le radar se rafraîchit environ toutes les 10 minutes.",
    legendEvents: "Inondation rapportée",
    legendStudy: "Zone d'étude des aléas",
    legendRadar: "Taux de précipitations (mm/h)",
    legendAlert: "Alerte météo active",
    legendDike: "Ouvrage de protection",
    clickHint: "Cliquez sur la carte pour interroger les alertes officielles à cet endroit.",
    alertAt: "Alertes officielles à cet endroit",
    noAlert: "Aucune alerte active retournée pour cet endroit.",
    close: "Fermer",
  },
  history: {
    kicker: "Le dossier",
    title: "Vingt-six ans d'inondations rapportées.",
    body: "Groundsource a transformé cinq millions d'articles en 2,6 millions d'inondations géolocalisées dans le monde. Pour le Canada, le dossier montre où les journalistes ont écrit sur l'eau, ce qui suit d'assez près les inondations qui ont perturbé des vies, avec deux biais énoncés plainement ci-dessous.",
    byYear: "Inondations rapportées par année",
    byYearSub: "Canada, 2000-2026. Les pics suivent les grandes années d'inondation; les années calmes reflètent une météo calme et des salles de nouvelles calmes.",
    byMonth: "Quand les inondations sont rapportées",
    byMonthSub: "Part de tous les événements par mois. La crue printanière et les orages d'été dominent le dossier canadien.",
    byProvince: "Événements par province et territoire",
    byProvinceSub: "Comptes bruts des nouvelles rapportées, pas des taux par habitant.",
    caveatsTitle: "Lire le dossier honnêtement",
    caveats: [
      "Une tempête peut produire plusieurs lignes : le jeu de données est basé sur les entités, donc une grande inondation rapportée à cinq endroits donne cinq enregistrements, pas un événement.",
      "La couverture médiatique est le capteur. Les médias anglophones dominent, les inondations éloignées sont sous-rapportées, et les inondations spectaculaires ont plus d'encre que les lentes.",
      "Les lieux sont approximatifs : chaque enregistrement est un polygone ou un point tamponné issu d'un géocodage que Google évalue à environ 60 % pour le lieu et le moment exacts.",
    ],
  },
  watch: {
    kicker: "Vigilance",
    title: "Un signal précoce honnête, pas une prévision.",
    body: "La version 1 n'exécute aucun modèle d'inondation. Elle applique une règle documentée : les endroits avec un long historique d'inondations rapportées méritent l'attention dès que de fortes pluies ou une alerte officielle les touchent. Flood Hub de Google exécute la version calibrée de cette idée; cette page montre les ingrédients dont elle est faite.",
    ruleTitle: "La règle de vigilance v1",
    rule: "Une région est signalée quand elle figure dans le quartile supérieur des inondations historiques ET que le radar en direct y montre des précipitations importantes ou qu'une alerte météo officielle la couvre. La première moitié est calculée à partir du dossier ci-dessous; la seconde se lit sur la carte en direct ci-dessus.",
    tableTitle: "Provinces les plus touchées au dossier",
    tableSub: "Classées par inondations rapportées, 2000-2026, avec le mois de pointe de chacune.",
    thProvince: "Province / territoire",
    thEvents: "Événements rapportés",
    thPeak: "Mois de pointe",
    thShare: "Part du total national",
    howto: "Comment utiliser cette page pendant une tempête",
    steps: [
      "Ouvrez la carte en direct et activez le radar de précipitations et les alertes en cours.",
      "Trouvez votre région dans le tableau : un historique chargé plus une alerte active, c'est la combinaison qui a précédé les pires inondations canadiennes.",
      "Cliquez sur la carte pour lire le texte officiel de l'alerte, puis suivez les consignes d'Environnement et Changement climatique Canada, pas cette page.",
    ],
  },
  protection: {
    kicker: "Protection",
    title: "Ce qui se tient entre l'eau et les villes.",
    body: "La Colombie-Britannique publie le seul inventaire ouvert et provincial des ouvrages de protection contre les inondations au Canada : digues, murs de mer, stations de pompage et les structures qui les font fonctionner. La couche cartographique les montre; les comptes ci-dessous viennent de l'entrepôt ouvert de la province.",
    lineKm: "kilomètres de digues et d'ouvrages linéaires inventoriés",
    structures: "structures auxiliaires (stations de pompage, vannes, dalots)",
    note: "Aucune autre province ne publie d'inventaire ouvert équivalent. L'absence sur cette carte est une absence de données ouvertes, pas une absence de digues.",
    cfmTitle: "Zones d'étude des aléas d'inondation",
    cfmBody: "L'Inventaire canadien des cartes d'inondation recense 675 zones d'étude des programmes provinciaux, territoriaux et municipaux. Chaque entrée renvoie à son responsable et à son statut de publication.",
    cfmLink: "Parcourir les zones d'étude",
  },
  method: {
    kicker: "Méthode",
    title: "Ce que c'est, et ce que ce n'est pas.",
    items: [
      "Couche historique : Groundsource (Google Research, CC BY 4.0, enregistrement Zenodo 18647054), 2 646 302 événements dans le monde, 2000-2026. Les événements ont été découpés pour le Canada en testant le centroïde de chaque enregistrement contre les frontières provinciales de l'Inventaire canadien des cartes d'inondation; {total} s'y trouvent. Les agrégats sont versionnés en JSON dans public/data.",
      "Couches en direct : services Web d'Environnement et Changement climatique Canada, interrogés par votre navigateur au moment de la visite. Le radar est la mosaïque nord-américaine du taux de précipitations à 1 km (RADAR_1KM_RRAI); les alertes sont la couche Current-Alerts. Rien ne transite par nos serveurs.",
      "Règle de vigilance v1 : quartile supérieur des comptes historiques par province, combiné au radar et aux alertes en direct comme décrit ci-dessus. C'est une heuristique documentée, pas une prévision calibrée, et c'est indiqué partout où elle apparaît.",
      "Couche de protection : ouvrages de protection de l'entrepôt géographique de la Colombie-Britannique (lignes et structures auxiliaires), plus les 675 zones de l'Inventaire canadien des cartes d'inondation de Ressources naturelles Canada.",
      "Actualisation : le dossier historique est reconstruit quand Groundsource publie une nouvelle version; les couches en direct sont toujours à jour au moment de la visite. La date de traitement est inscrite sur chaque fichier agrégé.",
      "Ce que la v1 ne peut pas faire : prédire les niveaux d'eau, minuter l'arrivée d'une inondation, ni couvrir les endroits dont les nouvelles n'ont jamais parlé. Pour la prévision opérationnelle, voir Flood Hub de Google, qui s'entraîne sur cette même recette Groundsource.",
    ],
  },
  data: {
    kicker: "Données ouvertes",
    title: "Prenez les fichiers.",
    body: "Chaque agrégat de cette page, en JSON, reconstruit à partir des sources ouvertes ci-dessus. Les intrants bruts sont exclus du dépôt; le script de traitement documente toute la chaîne.",
    download: "Télécharger",
    files: [
      { name: "summary.json", desc: "Totaux, plage de dates, citation de la source, date de traitement." },
      { name: "by_province.json", desc: "Événements rapportés par province et territoire." },
      { name: "by_year.json", desc: "Événements rapportés par année, 2000-2026." },
      { name: "by_month.json", desc: "Événements rapportés par mois civil." },
      { name: "points.json", desc: "Échantillon de lieux d'événements pour la carte (2010+, plafonné)." },
      { name: "cfm_studies.json", desc: "675 zones d'étude : nom, province, date, statut, responsable." },
      { name: "bc_protection.json", desc: "Ouvrages de protection de la C.-B. : comptes et kilomètres de digues." },
    ],
  },
  footer: {
    line1: "Flood Watch Canada est un projet open source de Richardson Dackam, membre de Nshipyard Canada.",
    line2: "Inondations historiques : Groundsource, Google Research (CC BY 4.0). Météo en direct : Environnement et Changement climatique Canada. Protection : gouvernement de la Colombie-Britannique. Zones d'étude : Ressources naturelles Canada. Sans affiliation avec le gouvernement du Canada.",
    repo: "Dépôt GitHub",
  },
};

export type Strings = typeof en;

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Strings }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const t = lang === "en" ? en : fr;
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

export const MONTHS: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
};

export const PROVINCE_FR: Record<string, string> = {
  "British Columbia": "Colombie-Britannique",
  "Alberta": "Alberta",
  "Saskatchewan": "Saskatchewan",
  "Manitoba": "Manitoba",
  "Ontario": "Ontario",
  "Quebec": "Québec",
  "New Brunswick": "Nouveau-Brunswick",
  "Nova Scotia": "Nouvelle-Écosse",
  "Prince Edward Island": "Île-du-Prince-Édouard",
  "Newfoundland and Labrador": "Terre-Neuve-et-Labrador",
  "Yukon": "Yukon",
  "Northwest Territories": "Territoires du Nord-Ouest",
  "Nunavut": "Nunavut",
};
