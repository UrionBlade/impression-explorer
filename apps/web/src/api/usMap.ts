import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection } from "geojson";

/** US states GeoJSON (static reference geometry). Fetched once, cached forever. */
export function useUsMap() {
  return useQuery({
    queryKey: ["us-map"],
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async (): Promise<FeatureCollection> => {
      const res = await fetch("/map.json");
      if (!res.ok) throw new Error(`Map failed to load (${res.status})`);
      return res.json();
    },
  });
}
