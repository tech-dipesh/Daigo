/*
  the real routing is not yet build
  This is the assumption
*/
export const assumedSpeedKmh = 25

export const etaMinutes = (km: number) => Math.round((km / assumedSpeedKmh) * 60)