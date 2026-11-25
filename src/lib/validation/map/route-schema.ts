import { z } from "zod"

const lat = (name: string) => z.coerce.number(`Please enter a ${name}`).min(-90, `Please enter a valid ${name}`).max(90, `Please enter a valid ${name}`)
const lng = (name: string) => z.coerce.number(`Please enter a ${name}`).min(-180, `Please enter a valid ${name}`).max(180, `Please enter a valid ${name}`)

export const routeLineSchema = z.object({ fromLat: lat("from latitude"), fromLng: lng("from longitude"), toLat: lat("to latitude"), toLng: lng("to longitude") })

export type RouteLineInput = z.infer<typeof routeLineSchema>
