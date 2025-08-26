"use client"

import { useState, useEffect } from "react"
import { Poll } from "@/types/poll"

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPolls = async () => {
    try {
      setLoading(true)
      setPolls([])
      setError(null)
    } catch (err) {
      setError("Failed to fetch polls")
    } finally {
      setLoading(false)
    }
  }

  const createPoll = async (pollData: Partial<Poll>) => {
    console.log("Creating poll:", pollData)
  }

  const votePoll = async (pollId: string, optionId: string) => {
    console.log("Voting on poll:", pollId, optionId)
  }

  useEffect(() => {
    fetchPolls()
  }, [])

  return {
    polls,
    loading,
    error,
    fetchPolls,
    createPoll,
    votePoll,
  }
}