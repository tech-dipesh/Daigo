"use client"

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#EEF1F6", color: "#1C2433" }}>
        <main style={{ maxWidth: 420, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, padding: 24 }}>
          <h1 style={{ fontSize: 28 }}>Something went wrong</h1>
          <p>We hit a problem on our side. Please try again.</p>
          <button onClick={reset} style={{ height: 48, borderRadius: 16, border: 0, background: "#2563EB", color: "#fff", fontSize: 16 }}>Try again</button>
          <a href="tel:112" style={{ textAlign: "center", color: "#D92D20" }}>Call 112</a>
        </main>
      </body>
    </html>
  )
}
