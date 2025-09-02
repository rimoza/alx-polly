'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useState } from "react"
import Link from "next/link"
import { PlusCircle, X, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const pollFormSchema = z.object({
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

type PollFormValues = z.infer<typeof pollFormSchema>

export default function CreatePollPage() {
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

  async function onSubmit(data: PollFormValues) {
    setIsSubmitting(true)
    try {
      // TODO: Implement API call to create poll using Supabase
      console.log("Poll data:", data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("Poll created successfully!")
      router.push("/polls")
    } catch (error) {
      toast.error("Failed to create poll. Please try again.")
      console.error("Error creating poll:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href="/polls" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to polls
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 p-6">
        <h1 className="mb-6 text-2xl font-bold">Create New Poll</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poll Question</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What would you like to ask?" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Ask a clear question for your poll.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Options (minimum 2)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ text: "" })}
                  disabled={fields.length >= 10}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`options.${index}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder={`Option ${index + 1}`}
                            {...field}
                          />
                        </FormControl>
                        {fields.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="space-y-4">
              <FormLabel>Poll Settings</FormLabel>
              
              <FormField
                control={form.control}
                name="allowMultiple"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Allow multiple selections
                      </FormLabel>
                      <FormDescription>
                        Voters can select more than one option.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requireAuth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Require authentication to vote
                      </FormLabel>
                      <FormDescription>
                        Only authenticated users can vote.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hideResults"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Hide results until voting ends
                      </FormLabel>
                      <FormDescription>
                        Results will only be visible after the poll closes.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Set when the poll should automatically close.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Poll"}
              </Button>
              <Link href="/polls" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}