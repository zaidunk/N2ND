"use client"

interface AskAIButtonProps {
  subject: string
  sourceUrl?: string
  compact?: boolean
}

function buildPrompt(subject: string, sourceUrl?: string) {
  const reference = sourceUrl ? `Referensi: ${sourceUrl}` : "Referensi: dari dashboard n2nd/xolvon.ai"
  return `Halo saya dari xolvon.ai mau tanya, tolong berikan saya penjelasan singkat dan jelas terkait ${subject}. ${reference}`
}

export default function AskAIButton({ subject, sourceUrl, compact = false }: AskAIButtonProps) {
  function handleAsk() {
    const prompt = buildPrompt(subject, sourceUrl)
    const url = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <button
      type="button"
      onClick={handleAsk}
      className="text-xs font-bold text-primary transition-colors hover:text-accent"
      aria-label="Tanya GPT"
      title="Tanya GPT"
    >
      {compact ? "?" : "Tanya GPT"}
    </button>
  )
}
