import { z } from "zod"

export const verifySchema = z.object({
  orderId: z.string("Please enter an order id").min(1, "Please enter an order id"),
  paymentId: z.string("Please enter a payment id").min(1, "Please enter a payment id"),
  signature: z.string("Please enter a signature").min(1, "Please enter a signature"),
})
