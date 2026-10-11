export type DailyCaseStatus = {
  serverNow: number;
  nextAvailableAt: number;
  claimed: boolean;
  commonCases: number | null;
};

export function parseDailyCase(value: unknown): DailyCaseStatus {
  const data = value as Record<string, unknown> | null;
  const serverNow = typeof data?.server_now === "string" ? Date.parse(data.server_now) : NaN;
  const nextAvailableAt = typeof data?.next_available_at === "string" ? Date.parse(data.next_available_at) : NaN;
  if (!Number.isFinite(serverNow) || !Number.isFinite(nextAvailableAt)) {
    throw new Error("Не удалось получить время ежедневного кейса.");
  }
  return {
    serverNow, nextAvailableAt,
    claimed: data?.claimed === true,
    commonCases: typeof data?.common_cases === "number" ? Math.min(99, Math.max(0, Math.floor(data.common_cases))) : null,
  };
}
