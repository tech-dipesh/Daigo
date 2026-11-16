export const trustWord = (score: number) => (score >= 90 ? "exceptional" : score >= 75 ? "dependable" : score >= 60 ? "steady" : score >= 40 ? "cautious" : "limited")
