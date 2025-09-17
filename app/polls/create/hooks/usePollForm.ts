import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { pollFormSchema, PollFormValues, PollPayload } from "../schema"
import { POLL_CONSTANTS, POLL_MESSAGES, POLL_ROUTES } from "../constants"
import { createPoll } from "../services/pollService"

export const usePollForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      question: "",
      options: [
        { text: "" },
        { text: "" }
      ],
      allowMultiple: false,
      requireAuth: false,
      hideResults: false,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  })

  const validatePollData = (data: PollFormValues): string | null => {
    if (!data.question?.trim() || !data.options?.length) {
      return POLL_MESSAGES.INVALID_DATA
    }
    
    const validOptions = data.options.filter(opt => opt.text?.trim())
    if (validOptions.length < POLL_CONSTANTS.MIN_OPTIONS) {
      return POLL_MESSAGES.INSUFFICIENT_OPTIONS
    }
    
    return null
  }

  const handleSubmit = async (data: PollFormValues) => {
    const validationError = validatePollData(data)
    if (validationError) {
      toast.error(validationError)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const validOptions = data.options.filter(opt => opt.text?.trim())
      const payload: PollPayload = {
        ...data,
        options: validOptions,
        createdAt: new Date().toISOString(),
      }
      
      await createPoll(payload)
      
      toast.success(POLL_MESSAGES.SUCCESS)
      router.push(POLL_ROUTES.LIST)
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message === 'Request timeout' 
          ? POLL_MESSAGES.TIMEOUT
          : `Failed to create poll: ${error.message}`
        : POLL_MESSAGES.GENERIC_ERROR
      
      toast.error(errorMessage)
      
      if (process.env.NODE_ENV === 'development') {
        console.error("Error creating poll:", error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const addOption = () => {
    if (fields.length < POLL_CONSTANTS.MAX_OPTIONS) {
      append({ text: "" })
    }
  }

  const removeOption = (index: number) => {
    if (fields.length > POLL_CONSTANTS.MIN_OPTIONS) {
      remove(index)
    }
  }

  return {
    form,
    fields,
    isSubmitting,
    handleSubmit,
    addOption,
    removeOption,
    canAddOption: fields.length < POLL_CONSTANTS.MAX_OPTIONS,
    canRemoveOption: fields.length > POLL_CONSTANTS.MIN_OPTIONS,
  }
}