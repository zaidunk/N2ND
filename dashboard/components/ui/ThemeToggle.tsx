"use client"
import { useState, useEffect } from "react"

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"))
  }, [])

  const toggle = () => {
    const next = !isLight
    setIsLight(next)
    if (next) {
      document.documentElement.classList.add("light")
      localStorage.setItem("n2nd_theme", "light")
    } else {
      document.documentElement.classList.remove("light")
      localStorage.setItem("n2nd_theme", "dark")
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Dark mode" : "Light mode"}
      className="fixed bottom-5 left-5 z-50 w-9 h-9 rounded-full border border-border/50 bg-surface2/70 backdrop-blur-sm flex items-center justify-center text-[15px] transition-all opacity-60 hover:opacity-100 hover:bg-surface2 hover:scale-110"
    >
      {isLight ? "🌙" : "☀️"}
    </button>
  )
}
