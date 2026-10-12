export function runnerFenceVariant(district: number, variant: number) { return district === 1 ? 4 + variant % 4 : variant % 4; }
export function runnerArchVariant(district: number, variant: number) { return district === 1 ? 4 + variant % 2 : district === 5 ? 6 : district === 3 ? 3 : district === 2 ? 1 : 1 + variant % 2; }
