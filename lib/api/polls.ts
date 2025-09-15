import { Poll } from "@/types/poll"

// Helper functions for anonymous user identification
function generateSessionId(): string {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    let sessionId = sessionStorage.getItem('pollSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('pollSessionId', sessionId);
    }
    return sessionId;
  }
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function generateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.cookieEnabled,
  ];

  const fingerprint = components.join('|');

  // Simple hash function for client-side fingerprinting
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `fp_${Math.abs(hash).toString(36)}`;
}

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

/**
 * Cast a vote on an existing poll
 * @param pollId - The unique identifier of the poll
 * @param optionId - The ID of the option to vote for (or array for multiple choice)
 * @param options - Additional voting options
 * @returns Promise resolving to the updated poll data with vote confirmation
 */
export async function castVote(
  pollId: string,
  optionId: string | string[],
  options: {
    sessionId?: string;
    fingerprint?: string;
  } = {}
): Promise<{ success: boolean; poll: Poll; message?: string }> {
  try {
    const payload = {
      optionId,
      sessionId: options.sessionId || generateSessionId(),
      fingerprint: options.fingerprint || await generateFingerprint(),
    }

    const response = await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      switch (response.status) {
        case 400:
          throw new Error(errorData.message || "Invalid vote data provided")
        case 401:
          throw new Error("Authentication required to vote on this poll")
        case 403:
          throw new Error(errorData.message || "You have already voted on this poll")
        case 404:
          throw new Error("Poll not found or no longer available")
        case 409:
          throw new Error("Poll is closed and no longer accepting votes")
        case 429:
          throw new Error("Too many voting attempts. Please try again later")
        default:
          throw new Error(errorData.message || "Failed to submit vote")
      }
    }

    const result = await response.json()
    return {
      success: true,
      poll: result.poll || result,
      message: result.message || "Vote submitted successfully"
    }
  } catch (error) {
    console.error("Vote submission error:", error)
    throw error
  }
}

// Legacy function for backward compatibility
export async function votePoll(pollId: string, optionId: string) {
  const result = await castVote(pollId, optionId)
  return result.poll
}

/**
 * Retrieve comprehensive poll results with voting statistics
 * @param pollId - The unique identifier of the poll
 * @param options - Additional options for results retrieval
 * @returns Promise resolving to detailed poll results
 */
export async function getPollResults(
  pollId: string,
  options: {
    includeVoteHistory?: boolean;
    includeAnalytics?: boolean;
  } = {}
): Promise<{
  poll: Poll;
  results: {
    totalVotes: number;
    options: Array<{
      id: string;
      text: string;
      votes: number;
      percentage: number;
    }>;
    analytics?: {
      votesOverTime?: Array<{ date: string; count: number }>;
      topChoice?: { id: string; text: string; percentage: number };
      participationRate?: number;
    };
  };
  userVote?: {
    optionId: string | string[];
    votedAt: string;
  };
}> {
  try {
    const queryParams = new URLSearchParams();

    if (options.includeVoteHistory) {
      queryParams.append('includeHistory', 'true');
    }
    if (options.includeAnalytics) {
      queryParams.append('includeAnalytics', 'true');
    }

    const url = `/api/polls/${pollId}/results${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      switch (response.status) {
        case 401:
          throw new Error("Authentication required to view poll results");
        case 403:
          throw new Error("You don't have permission to view these poll results");
        case 404:
          throw new Error("Poll not found");
        case 410:
          throw new Error("Poll results are no longer available");
        default:
          throw new Error(errorData.message || "Failed to retrieve poll results");
      }
    }

    const data = await response.json();

    // Calculate percentages if not provided by backend
    const totalVotes = data.results?.totalVotes || data.poll?.totalVotes || 0;
    const options = data.results?.options?.map((option: any) => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100 * 100) / 100 : 0
    })) || [];

    const topChoice = options.length > 0
      ? options.reduce((prev: any, current: any) =>
          prev.votes > current.votes ? prev : current
        )
      : null;

    return {
      poll: data.poll,
      results: {
        totalVotes,
        options,
        ...(options.includeAnalytics && {
          analytics: {
            ...data.results?.analytics,
            topChoice,
            participationRate: data.results?.analytics?.participationRate ||
              (totalVotes > 0 ? Math.round((totalVotes / (data.poll?.expectedParticipants || totalVotes)) * 100) : 0)
          }
        })
      },
      ...(data.userVote && { userVote: data.userVote })
    };
  } catch (error) {
    console.error("Poll results retrieval error:", error);
    throw error;
  }
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