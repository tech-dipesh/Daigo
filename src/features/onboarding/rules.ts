export const between = (v: string, min: number, max: number) => v.trim().length >= min && v.trim().length <= max
export const phoneOk = (v: string) => /^\d{10}$/.test(v)
export const licenceOk = (v: string) => /^[A-Za-z0-9-]{8,20}$/.test(v)
export const digits = (v: string) => v.replace(/\D/g, "").slice(0, 10)
