export const demoTabs = ["status", "seed", "reset", "scenarios", "force", "health", "benchmark"] as const
export type DemoTab = (typeof demoTabs)[number]
