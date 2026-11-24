import axios from "axios"
import { STADIA } from "@/lib/env"

export type Place = { label: string; lat: number; lng: number }
const local = () => ["localhost", "127.0.0.1"].includes(window.location.hostname)
const auth = () => (STADIA && !local() ? { api_key: STADIA } : {})
type Reply = { features: { geometry: { coordinates: [number, number] }; properties: { label: string } }[] }

export async function searchPlaces(text: string, signal: AbortSignal) {
  const params = { text, size: 6, "boundary.country": "IN", "focus.point.lat": 30.7333, "focus.point.lon": 76.7794, ...auth() }
  const res = await axios.get<Reply>("https://api.stadiamaps.com/geocoding/v1/autocomplete", { params, signal })
  return res.data.features.map((f): Place => ({ label: f.properties.label, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }))
}

export async function reversePlace(lat: number, lng: number, signal: AbortSignal) {
  const params = { "point.lat": lat, "point.lon": lng, size: 1, ...auth() }
  const plain = { label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng } satisfies Place
  try {
    const res = await axios.get<Reply>("https://api.stadiamaps.com/geocoding/v1/reverse", { params, signal })
    const label = res.data.features[0]?.properties.label
    return label ? ({ label, lat, lng } satisfies Place) : plain
  } catch (err) {
    if (axios.isCancel(err)) throw err
    return plain
  }
}
