export function isAtRisk(lastCheckin: Date | null, days = 14): boolean {
  if (!lastCheckin) return true
  const diffMs = Date.now() - lastCheckin.getTime()
  return diffMs > days * 24 * 60 * 60 * 1000
}
