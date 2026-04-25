"use client"

import { useState, useTransition } from "react"
import { load30Days } from "@/lib/api"

export default function Load30DaysButton() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState("")

  function trigger() {
    setMessage("Memuat data 30 hari, tunggu sampai 5 menit...")
    startTransition(async () => {
      try {
        const res = await load30Days()
        if (res.status === "ok") {
          const total = res.summary?.last_30_days ?? 0
          setMessage(`Selesai. ${total} artikel siap. Refresh halaman.`)
          setTimeout(() => window.location.reload(), 1500)
          return
        }
        setMessage(res.detail ?? "Load tidak berhasil.")
      } catch (err) {
        const isNetwork = err instanceof TypeError && err.message.includes("fetch")
        setMessage(
          isNetwork
            ? "API backend belum online. Set NEXT_PUBLIC_API_URL di Firebase Console."
            : "Gagal load data. Cek koneksi API."
        )
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={trigger}
        disabled={isPending}
        className="btn-primary text-xs disabled:opacity-50"
      >
        {isPending ? "Loading..." : "Load 30 Hari"}
      </button>
      {message ? <p className="text-right text-xs font-bold text-muted">{message}</p> : null}
    </div>
  )
}
