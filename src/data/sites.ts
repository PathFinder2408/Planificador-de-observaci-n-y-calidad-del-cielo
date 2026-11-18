import { z } from "zod";

export const SiteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  project: z.string().min(1),
  region: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevationMeters: z.number().min(0).max(6000),
});

export type ObservatorySite = z.infer<typeof SiteSchema>;

export const OBSERVATORY_SITES: readonly ObservatorySite[] = [
  {
    id: "vera-rubin",
    name: "Vera C. Rubin Observatory",
    project: "LSST / NOIRLab & DOE",
    region: "Coquimbo (Cerro Pachón)",
    latitude: -30.2446,
    longitude: -70.7494,
    elevationMeters: 2682,
  },
  {
    id: "cerro-pachon",
    name: "Gemini South & SOAR",
    project: "NOIRLab (Cerro Pachón)",
    region: "Coquimbo (Cerro Pachón)",
    latitude: -30.2407,
    longitude: -70.7366,
    elevationMeters: 2722,
  },
  {
    id: "cerro-tololo",
    name: "Cerro Tololo (CTIO)",
    project: "NOIRLab / AURA",
    region: "Coquimbo (Valle del Elqui)",
    latitude: -30.1691,
    longitude: -70.8065,
    elevationMeters: 2207,
  },
  {
    id: "la-silla",
    name: "Observatorio La Silla",
    project: "ESO",
    region: "Coquimbo",
    latitude: -29.2575,
    longitude: -70.7347,
    elevationMeters: 2400,
  },
  {
    id: "las-campanas",
    name: "Las Campanas & GMT",
    project: "Carnegie / Giant Magellan Telescope",
    region: "Atacama",
    latitude: -29.016,
    longitude: -70.692,
    elevationMeters: 2380,
  },
  {
    id: "paranal",
    name: "Observatorio Paranal (VLT)",
    project: "ESO",
    region: "Antofagasta",
    latitude: -24.6272,
    longitude: -70.4042,
    elevationMeters: 2635,
  },
  {
    id: "cerro-armazones",
    name: "Cerro Armazones (ELT)",
    project: "ESO Extremely Large Telescope",
    region: "Antofagasta",
    latitude: -24.5892,
    longitude: -70.1922,
    elevationMeters: 3046,
  },
  {
    id: "alma",
    name: "ALMA (Chajnantor)",
    project: "ESO / NAOJ / NRAO",
    region: "Antofagasta (Llano de Chajnantor)",
    latitude: -23.0193,
    longitude: -67.7532,
    elevationMeters: 5059,
  },
  {
    id: "ctao-south",
    name: "CTAO-South (Paranal)",
    project: "Cherenkov Telescope Array Observatory",
    region: "Antofagasta",
    latitude: -24.6833,
    longitude: -70.3167,
    elevationMeters: 2100,
  },
  {
    id: "la-serena",
    name: "La Serena",
    project: "Base urbana / Campus AURA-NOIRLab",
    region: "Coquimbo",
    latitude: -29.9027,
    longitude: -71.2519,
    elevationMeters: 28,
  },
];

export function getSiteById(siteId: string): ObservatorySite | undefined {
  return OBSERVATORY_SITES.find((site) => site.id === siteId);
}
