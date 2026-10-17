export const requestWindowSeconds = 75
export const expiryFromNow = () => new Date(Date.now() + requestWindowSeconds * 1000)
export const isExpired = (expiresAt: Date | null) => expiresAt !== null && expiresAt.getTime() < Date.now()
