import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

let lastRevalidated = 0

export async function POST() {
  const elapsed = Date.now() - lastRevalidated
  if (elapsed < 5 * 60 * 1000)
    return NextResponse.json({ rateLimited: true, waitMs: 5 * 60 * 1000 - elapsed })

  revalidatePath("/")
  lastRevalidated = Date.now()
  return NextResponse.json({ revalidated: true })
}
