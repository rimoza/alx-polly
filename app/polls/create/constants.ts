export const POLL_CONSTANTS = {
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  MIN_QUESTION_LENGTH: 5,
  MAX_QUESTION_LENGTH: 200,
  MAX_OPTION_LENGTH: 100,
  REQUEST_TIMEOUT: 5000,
  SUBMIT_DELAY: 1000,
} as const

export const POLL_MESSAGES = {
  SUCCESS: "Poll created successfully!",
  INVALID_DATA: "Invalid poll data. Please check your inputs.",
  INSUFFICIENT_OPTIONS: "Please provide at least 2 valid options.",
  TIMEOUT: "Request timed out. Please try again.",
  GENERIC_ERROR: "An unexpected error occurred. Please try again.",
} as const

export const POLL_ROUTES = {
  CREATE: "/polls/create",
  LIST: "/polls",
  VIEW: (id: string) => `/polls/${id}`,
} as const