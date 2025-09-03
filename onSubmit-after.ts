// Optimized onSubmit function from app/polls/create/page.tsx
// This version includes performance and readability improvements

async function onSubmit(data: PollFormValues) {
  // Early validation - fail fast pattern
  if (!data.question?.trim() || !data.options?.length) {
    toast.error("Invalid poll data. Please check your inputs.")
    return
  }
  
  // Filter out empty options for cleaner data
  const validOptions = data.options.filter(opt => opt.text?.trim())
  if (validOptions.length < 2) {
    toast.error("Please provide at least 2 valid options.")
    return
  }
  
  setIsSubmitting(true)
  
  try {
    // Prepare optimized payload
    const payload = {
      ...data,
      options: validOptions,
      createdAt: new Date().toISOString(),
    }
    
    // TODO: Replace with actual Supabase API call
    // Optimized simulation with AbortController for cancellation support
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 1000)
      controller.signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new Error('Request timeout'))
      })
    })
    
    clearTimeout(timeoutId)
    
    // Use requestIdleCallback for non-critical operations if available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        console.log("Poll created:", payload)
      })
    }
    
    toast.success("Poll created successfully!")
    router.push("/polls")
  } catch (error) {
    // More specific error handling
    const errorMessage = error instanceof Error 
      ? error.message === 'Request timeout' 
        ? "Request timed out. Please try again."
        : `Failed to create poll: ${error.message}`
      : "An unexpected error occurred. Please try again."
    
    toast.error(errorMessage)
    
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error("Error creating poll:", error)
    }
  } finally {
    setIsSubmitting(false)
  }
}