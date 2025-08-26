"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { X } from "lucide-react"

export default function CreatePollPage() {
  const [options, setOptions] = useState(["", ""])

  const addOption = () => {
    setOptions([...options, ""])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href="/polls" className="text-blue-600 hover:text-blue-800">
          ← Back to polls
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 p-6">
        <h1 className="mb-6 text-2xl font-bold">Create New Poll</h1>

        <form className="space-y-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium mb-2">
              Poll Question
            </label>
            <input
              type="text"
              id="question"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="What would you like to ask?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Options (minimum 2)
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="rounded-md border border-gray-300 p-2 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="mt-3"
            >
              Add Option
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Poll Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-sm">Allow multiple selections</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-sm">Require authentication to vote</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" />
                <span className="text-sm">Hide results until voting ends</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium mb-2">
              End Date (optional)
            </label>
            <input
              type="datetime-local"
              id="end-date"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              Create Poll
            </Button>
            <Link href="/polls" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}