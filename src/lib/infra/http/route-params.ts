import { z } from "zod"

const idSchema = z.object({ id: z.uuid() })

export async function idFrom(params: Promise<{ id: string }>) {
  const { id } = idSchema.parse(await params)

  return id
}
