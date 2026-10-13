const earthRadiusKm = 6371

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

export function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const dLat = toRadians(toLat - fromLat)
  const dLng = toRadians(toLng - fromLng)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}
