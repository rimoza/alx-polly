import { PollPayload } from "../schema"
import { POLL_CONSTANTS } from "../constants"

class PollService {
  private controller: AbortController | null = null

  async createPoll(payload: PollPayload): Promise<void> {
    this.controller = new AbortController()
    const timeoutId = setTimeout(() => this.controller?.abort(), POLL_CONSTANTS.REQUEST_TIMEOUT)
    
    try {
      await this.simulateApiCall(payload)
      clearTimeout(timeoutId)
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          console.log("Poll created:", payload)
        })
      } else {
        console.log("Poll created:", payload)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    } finally {
      this.controller = null
    }
  }

  private async simulateApiCall(payload: PollPayload): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, POLL_CONSTANTS.SUBMIT_DELAY)
      
      this.controller?.signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new Error('Request timeout'))
      })
    })
  }

  cancelRequest(): void {
    this.controller?.abort()
  }
}

const pollService = new PollService()

export const createPoll = (payload: PollPayload) => pollService.createPoll(payload)
export const cancelPollRequest = () => pollService.cancelRequest()