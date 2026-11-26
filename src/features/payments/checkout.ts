export type Checkout = { orderId: string; keyId: string; amount: number; currency: string; description: string; email: string }
export type Proof = { orderId: string; paymentId: string; signature: string }

type Options = Record<string, unknown>
type Box = { open: () => void }
type Reply = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }

declare global {
  interface Window {
    Razorpay?: new (options: Options) => Box
  }
}

const source = "https://checkout.razorpay.com/v1/checkout.js"
let loading: Promise<void> | null = null

/* the script is only fetched when someone really pays, and once */
function load() {
  if (window.Razorpay) return Promise.resolve()
  loading ??= new Promise<void>((done, fail) => {
    const tag = document.createElement("script")
    tag.src = source
    tag.onload = () => done()
    tag.onerror = () => {
      loading = null
      fail(new Error("The payment window could not load, check your internet and try again"))
    }
    document.head.appendChild(tag)
  })
  return loading
}

/* null means the person closed the window without paying */
export async function openCheckout(c: Checkout): Promise<Proof | null> {
  await load()
  const Razorpay = window.Razorpay
  if (!Razorpay) throw new Error("The payment window is not available")
  return new Promise<Proof | null>((done) => {
    const box = new Razorpay({
      key: c.keyId,
      order_id: c.orderId,
      amount: c.amount,
      currency: c.currency,
      name: "DaiGo",
      description: c.description,
      prefill: { email: c.email },
      theme: { color: "#2563EB" },
      handler: (r: Reply) => done({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
      modal: { ondismiss: () => done(null) },
    })
    box.open()
  })
}
