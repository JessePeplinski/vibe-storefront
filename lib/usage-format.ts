export function formatUsageUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "$0.00";
  }

  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }

  return `$${value.toFixed(2)}`;
}
