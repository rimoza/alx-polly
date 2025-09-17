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

interface PollEndDateFieldProps {
  control: Control<PollFormValues>
}

export const PollEndDateField = ({ control }: PollEndDateFieldProps) => {
  return (
    <FormField
      control={control}
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
  )
}