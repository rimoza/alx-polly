/**
 * Usage examples for the enhanced poll API functions
 * These examples demonstrate how to use castVote and getPollResults functions
 */

import { castVote, getPollResults } from './polls'

// Example 1: Basic voting on a poll
export async function exampleBasicVoting() {
  try {
    const pollId = "poll_123";
    const optionId = "option_456";

    const result = await castVote(pollId, optionId);

    console.log("Vote submitted successfully:", {
      pollId: result.poll.id,
      totalVotes: result.poll.totalVotes,
      message: result.message
    });

    return result;
  } catch (error) {
    console.error("Voting failed:", error.message);
    throw error;
  }
}

// Example 2: Multiple choice voting
export async function exampleMultipleChoiceVoting() {
  try {
    const pollId = "poll_123";
    const optionIds = ["option_456", "option_789"]; // Multiple selections

    const result = await castVote(pollId, optionIds);

    console.log("Multiple choice vote submitted:", {
      selectedOptions: optionIds,
      newTotalVotes: result.poll.totalVotes
    });

    return result;
  } catch (error) {
    console.error("Multiple choice voting failed:", error.message);
    throw error;
  }
}

// Example 3: Voting with custom session/fingerprint
export async function exampleCustomIdentifierVoting() {
  try {
    const pollId = "poll_123";
    const optionId = "option_456";

    const result = await castVote(pollId, optionId, {
      sessionId: "custom_session_id",
      fingerprint: "custom_browser_fingerprint"
    });

    console.log("Vote with custom identifiers submitted:", result);

    return result;
  } catch (error) {
    console.error("Custom identifier voting failed:", error.message);
    throw error;
  }
}

// Example 4: Basic poll results retrieval
export async function exampleBasicPollResults() {
  try {
    const pollId = "poll_123";

    const results = await getPollResults(pollId);

    console.log("Poll Results:", {
      question: results.poll.question,
      totalVotes: results.results.totalVotes,
      options: results.results.options.map(opt => ({
        text: opt.text,
        votes: opt.votes,
        percentage: `${opt.percentage}%`
      }))
    });

    return results;
  } catch (error) {
    console.error("Failed to get poll results:", error.message);
    throw error;
  }
}

// Example 5: Poll results with analytics
export async function examplePollResultsWithAnalytics() {
  try {
    const pollId = "poll_123";

    const results = await getPollResults(pollId, {
      includeAnalytics: true,
      includeVoteHistory: true
    });

    console.log("Detailed Poll Analytics:", {
      poll: results.poll.question,
      totalVotes: results.results.totalVotes,
      topChoice: results.results.analytics?.topChoice,
      participationRate: `${results.results.analytics?.participationRate}%`,
      userVote: results.userVote ? "User has voted" : "User hasn't voted"
    });

    if (results.results.analytics?.votesOverTime) {
      console.log("Votes over time:", results.results.analytics.votesOverTime);
    }

    return results;
  } catch (error) {
    console.error("Failed to get detailed poll analytics:", error.message);
    throw error;
  }
}

// Example 6: Complete voting workflow with result checking
export async function exampleCompleteVotingWorkflow() {
  try {
    const pollId = "poll_123";
    const optionId = "option_456";

    // Step 1: Get initial poll results
    console.log("📊 Getting initial poll state...");
    const initialResults = await getPollResults(pollId);
    console.log(`Initial votes: ${initialResults.results.totalVotes}`);

    // Step 2: Cast vote
    console.log("🗳️ Casting vote...");
    const voteResult = await castVote(pollId, optionId);
    console.log(`✅ ${voteResult.message}`);

    // Step 3: Get updated results
    console.log("📈 Getting updated results...");
    const updatedResults = await getPollResults(pollId, {
      includeAnalytics: true
    });

    console.log("📋 Updated Results Summary:", {
      totalVotes: updatedResults.results.totalVotes,
      increase: updatedResults.results.totalVotes - initialResults.results.totalVotes,
      topChoice: updatedResults.results.analytics?.topChoice?.text,
      userVoted: !!updatedResults.userVote
    });

    return {
      initial: initialResults,
      vote: voteResult,
      updated: updatedResults
    };

  } catch (error) {
    console.error("Complete workflow failed:", error.message);
    throw error;
  }
}

// Example 7: Error handling patterns
export async function exampleErrorHandling() {
  const examples = [
    {
      name: "Voting on closed poll",
      action: () => castVote("closed_poll_id", "option_id")
    },
    {
      name: "Duplicate voting attempt",
      action: () => castVote("poll_123", "option_456") // Assuming already voted
    },
    {
      name: "Getting results for non-existent poll",
      action: () => getPollResults("non_existent_poll")
    }
  ];

  for (const example of examples) {
    try {
      console.log(`🧪 Testing: ${example.name}`);
      await example.action();
      console.log(`✅ ${example.name} succeeded unexpectedly`);
    } catch (error) {
      console.log(`❌ ${example.name} failed as expected:`, error.message);
    }
  }
}

// Example usage in a React component context
export const pollApiExamples = {
  voting: {
    basic: exampleBasicVoting,
    multipleChoice: exampleMultipleChoiceVoting,
    customIdentifier: exampleCustomIdentifierVoting,
  },
  results: {
    basic: exampleBasicPollResults,
    withAnalytics: examplePollResultsWithAnalytics,
  },
  workflows: {
    complete: exampleCompleteVotingWorkflow,
    errorHandling: exampleErrorHandling,
  }
};