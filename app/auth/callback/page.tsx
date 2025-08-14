import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage() {
  const supabase = createClient()

  // The middleware should handle the code exchange, so just redirect to home
  redirect("/")
}
