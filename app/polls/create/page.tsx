'use client'

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { usePollForm } from "./hooks/usePollForm"
import { PollQuestionField } from "./components/PollQuestionField"
import { PollOptionsField } from "./components/PollOptionsField"
import { PollSettingsFields } from "./components/PollSettingsFields"
import { PollEndDateField } from "./components/PollEndDateField"
import { POLL_ROUTES } from "./constants"

export default function CreatePollPage() {
  const {
    form,
    fields,
    isSubmitting,
    handleSubmit,
    addOption,
    removeOption,
    canAddOption,
    canRemoveOption,
  } = usePollForm()

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href={POLL_ROUTES.LIST} className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to polls
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 p-6">
        <h1 className="mb-6 text-2xl font-bold">Create New Poll</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <PollQuestionField control={form.control} />
            
            <PollOptionsField
              control={form.control}
              fields={fields}
              onAdd={addOption}
              onRemove={removeOption}
              canAdd={canAddOption}
              canRemove={canRemoveOption}
            />
            
            <PollSettingsFields control={form.control} />
            
            <PollEndDateField control={form.control} />

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Poll"}
              </Button>
              <Link href={POLL_ROUTES.LIST} className="flex-1">
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