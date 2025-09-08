import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Control } from "react-hook-form"
import { PollFormValues } from "../schema"

interface PollQuestionFieldProps {
  control: Control<PollFormValues>
}

export const PollQuestionField = ({ control }: PollQuestionFieldProps) => {
  return (
    <FormField
      control={control}
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
  )
}