export interface PollOption {
  id: string
  text: string
  votes: number
  percentage?: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  endsAt?: Date
  status: "active" | "closed"
  totalVotes: number
  settings: PollSettings
}

export interface PollSettings {
  multipleChoice: boolean
  requireAuth: boolean
  hideResults: boolean
  allowComments: boolean
}

export interface CreatePollInput {
  question: string
  options: string[]
  settings?: Partial<PollSettings>
  endsAt?: Date
}

export interface VoteInput {
  pollId: string
  optionId: string | string[]
}