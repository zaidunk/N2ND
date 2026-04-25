"use client"

interface Props { subject: string; label?: string; className?: string }

export default function GptButton({ subject, label = "?", className = "" }: Props) {
  const url = `https://chat.openai.com/?q=${encodeURIComponent("halo gpt saya dari xolvon.ai mau nanya tentang " + subject)}`
  return (
    <button
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      title={`Tanya GPT: ${subject}`}
      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold text-muted hover:text-primary hover:bg-primary/10 border border-border transition-colors ${className}`}
    >{label}</button>
  )
}
