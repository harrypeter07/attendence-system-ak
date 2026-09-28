/**
 * Calculates the great-circle distance between two geographic coordinates
 * on Earth using the Haversine formula.
 *
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity
  }

  // If both coordinates are 0 (e.g. testing or location not enabled on session)
  if (lat1 === 0 && lon1 === 0 && lat2 === 0 && lon2 === 0) {
    return 0
  }

  const R = 6371e3 // Earth's mean radius in meters
  const toRad = (value: number) => (value * Math.PI) / 180

  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const deltaPhi = toRad(lat2 - lat1)
  const deltaLambda = toRad(lon2 - lon1)

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c * 10) / 10 // Rounded to 1 decimal place
}
