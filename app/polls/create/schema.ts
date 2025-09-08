import { z } from "zod"

export const pollFormSchema = z.object({
  question: z.string()
    .min(5, { message: "Question must be at least 5 characters." })
    .max(200, { message: "Question must not exceed 200 characters." }),
  options: z.array(
    z.object({
      text: z.string()
        .min(1, { message: "Option text is required." })
        .max(100, { message: "Option must not exceed 100 characters." })
    })
  ).min(2, { message: "At least 2 options are required." })
   .max(10, { message: "Maximum 10 options allowed." }),
  endDate: z.string().optional(),
  allowMultiple: z.boolean().default(false),
  requireAuth: z.boolean().default(false),
  hideResults: z.boolean().default(false),
})

export type PollFormValues = z.infer<typeof pollFormSchema>

export interface PollOption {
  text: string
}

export interface PollPayload extends PollFormValues {
  createdAt: string
  options: PollOption[]
}