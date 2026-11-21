"use client"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Point = { day: string; count: number }

export function DayBars({ data, tone }: { data: Point[]; tone: "primary" | "danger" }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "var(--tint)" }} contentStyle={{ background: "var(--surface)", border: "none", borderRadius: 12, color: "var(--ink)" }} />
        <Bar dataKey="count" fill={`var(--${tone})`} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
