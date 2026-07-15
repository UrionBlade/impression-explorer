import { useQuery } from "@tanstack/react-query";

export interface StateCount {
  state: string;
  count: number;
}

export interface ByStateResponse {
  total: number;
  unattributed: number;
  states: StateCount[];
}

/** Per-state impression counts from the API (all states in one response). */
export function useImpressionsByState() {
  return useQuery({
    queryKey: ["impressions", "by-state"],
    queryFn: async (): Promise<ByStateResponse> => {
      const res = await fetch("/api/impressions/by-state");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return res.json();
    },
  });
}
