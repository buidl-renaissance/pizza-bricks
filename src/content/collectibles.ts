/**
 * Collectible pizza config: id → model URLs, metadata, and optional geo pin.
 * Add GLB (and optionally USDZ for iOS AR) under public/models/ and reference here.
 */

export interface GeoPin {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  placeName?: string;
}

export interface CollectibleConfig {
  id: string;
  modelUrl: string;
  iosModelUrl?: string; // USDZ for iOS Quick Look
  displayName: string;
  description?: string;
  geo?: GeoPin;
}

const COLLECTIBLES: CollectibleConfig[] = [
  {
    id: "demo",
    modelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    displayName: "Demo",
    description: "Demo collectible (use your own GLB for pizza).",
  },
  {
    id: "detroit-style",
    modelUrl: "/models/pizza.glb",
    displayName: "Detroit Style",
    description: "A collectible Detroit-style pizza.",
    geo: {
      latitude: 42.3314,
      longitude: -83.0458,
      radiusMeters: 150,
      placeName: "Detroit, MI",
    },
  },
  {
    id: "default",
    modelUrl: "/models/pizza.glb",
    displayName: "Classic Slice",
    description: "A classic collectible slice.",
  },
];

const byId = new Map(COLLECTIBLES.map((c) => [c.id, c]));

export function getCollectible(id: string): CollectibleConfig | undefined {
  return byId.get(id);
}

export function getCollectibleOrFallback(id: string): CollectibleConfig {
  return byId.get(id) ?? byId.get("default") ?? COLLECTIBLES[0];
}

export { COLLECTIBLES };
