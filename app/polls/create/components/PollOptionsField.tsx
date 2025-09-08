import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PlusCircle, X } from "lucide-react"
import { Control, FieldArrayWithId } from "react-hook-form"
import { PollFormValues } from "../schema"

interface PollOptionsFieldProps {
  control: Control<PollFormValues>
  fields: FieldArrayWithId<PollFormValues, "options", "id">[]
  onAdd: () => void
  onRemove: (index: number) => void
  canAdd: boolean
  canRemove: boolean
}

export const PollOptionsField = ({
  control,
  fields,
  onAdd,
  onRemove,
  canAdd,
  canRemove,
}: PollOptionsFieldProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel>Options (minimum 2)</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          disabled={!canAdd}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Option
        </Button>
      </div>
      
      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
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
                {canRemove && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onRemove(index)}
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
  )
}