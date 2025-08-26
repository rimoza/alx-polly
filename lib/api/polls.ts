import { Poll } from "@/types/poll"

export async function getPolls(): Promise<Poll[]> {
  const response = await fetch("/api/polls")
  
  if (!response.ok) {
    throw new Error("Failed to fetch polls")
  }
  
  return response.json()
}

export async function getPoll(id: string): Promise<Poll> {
  const response = await fetch(`/api/polls/${id}`)
  
  if (!response.ok) {
    throw new Error("Failed to fetch poll")
  }
  
  return response.json()
}

export async function createPoll(pollData: Partial<Poll>): Promise<Poll> {
  const response = await fetch("/api/polls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pollData),
  })
  
  if (!response.ok) {
    throw new Error("Failed to create poll")
  }
  
  return response.json()
}

export async function votePoll(pollId: string, optionId: string) {
  const response = await fetch(`/api/polls/${pollId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ optionId }),
  })
  
  if (!response.ok) {
    throw new Error("Failed to submit vote")
  }
  
  return response.json()
}

export async function closePoll(pollId: string) {
  const response = await fetch(`/api/polls/${pollId}/close`, {
    method: "POST",
  })
  
  if (!response.ok) {
    throw new Error("Failed to close poll")
  }
  
  return response.json()
}