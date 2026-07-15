import { useQuery } from "@tanstack/react-query";

export interface HourCount {
  hour: number;
  count: number;
}
export interface ByHour {
  local: HourCount[];
  utc: HourCount[];
}

export interface DeviceBucket {
  label: string;
  devices: number;
}
export interface ByDevice {
  totalDevices: number;
  meanPerDevice: number;
  medianPerDevice: number;
  maxPerDevice: number;
  buckets: DeviceBucket[];
}

export interface BlackFridayYear {
  year: number;
  date: string;
  count: number;
  restOfYearDailyMean: number;
  lift: number;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export function useImpressionsByHour() {
  return useQuery({ queryKey: ["impressions", "by-hour"], queryFn: () => getJson<ByHour>("/api/impressions/by-hour") });
}

export function useTopDevices() {
  return useQuery({ queryKey: ["impressions", "by-device"], queryFn: () => getJson<ByDevice>("/api/impressions/by-device") });
}

export function useBlackFriday() {
  return useQuery({ queryKey: ["impressions", "black-friday"], queryFn: () => getJson<BlackFridayYear[]>("/api/impressions/black-friday") });
}
