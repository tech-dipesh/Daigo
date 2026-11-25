export type Line = [number, number][]

export function decodePolyline(shape: string, precision = 6): Line {
  const factor = 10 ** precision
  /* valhalla sends its shape as an encoded polyline with 6 decimals, points come out as lng then lat */
  const out: Line = []
  let index = 0
  let lat = 0
  let lng = 0
  const next = () => {
    let result = 0
    let shift = 0
    let byte = 0
    do {
      byte = shape.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    return result & 1 ? ~(result >> 1) : result >> 1
  }
  while (index < shape.length) {
    lat += next()
    lng += next()
    out.push([lng / factor, lat / factor])
  }
  return out
}

/* the map does not need every point of a long road, an even stride keeps the shape and the two ends */
export function thin(line: Line, max = 400): Line {
  if (line.length <= max) return line
  const step = line.length / max
  const picked = Array.from({ length: max }, (_, i) => line[Math.floor(i * step)])
  return [...picked, line[line.length - 1]]
}
