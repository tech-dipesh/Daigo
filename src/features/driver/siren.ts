let ctx: AudioContext | null = null
const make = () => (ctx ??= new AudioContext())

/* browsers keep sound locked until the first tap, so we wake it on any tap */
export function unlockAudio() {
  window.addEventListener("pointerdown", () => void make().resume(), { once: true })
}

export async function enableSound() {
  await make().resume()
  return make().state === "running"
}

export function startSiren() {
  const c = make()
  if (c.state !== "running") return null
  const osc = c.createOscillator()
  const gain = c.createGain()
  gain.gain.value = 0.12
  osc.type = "sine"
  osc.frequency.value = 760
  osc.connect(gain).connect(c.destination)
  osc.start()
  const timer = setInterval(() => { osc.frequency.value = osc.frequency.value === 760 ? 980 : 760 }, 450)
  return () => {
    clearInterval(timer)
    osc.stop()
    osc.disconnect()
  }
}
