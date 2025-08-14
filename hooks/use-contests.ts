"use client"

import { useState, useEffect } from "react"
import type { Contest } from "@/lib/codeforces-api"

interface UseContestsOptions {
  handle?: string
  filterSolved?: boolean
}

interface UseContestsReturn {
  contests: Contest[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useContests({ handle, filterSolved = false }: UseContestsOptions = {}): UseContestsReturn {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContests = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (handle) params.set("handle", handle)
      if (filterSolved) params.set("filterSolved", "true")

      const response = await fetch(`/api/contests?${params.toString()}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch contests")
      }

      setContests(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContests()
  }, [handle, filterSolved])

  return {
    contests,
    loading,
    error,
    refetch: fetchContests,
  }
}
