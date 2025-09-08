import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Control } from "react-hook-form"
import { PollFormValues } from "../schema"

interface PollSettingsFieldsProps {
  control: Control<PollFormValues>
}

interface SettingFieldProps {
  control: Control<PollFormValues>
  name: keyof Pick<PollFormValues, "allowMultiple" | "requireAuth" | "hideResults">
  label: string
  description: string
}

const SettingField = ({ control, name, label, description }: SettingFieldProps) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
        <FormControl>
          <Checkbox
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </FormControl>
        <div className="space-y-1 leading-none">
          <FormLabel>{label}</FormLabel>
          <FormDescription>{description}</FormDescription>
        </div>
      </FormItem>
    )}
  />
)

export const PollSettingsFields = ({ control }: PollSettingsFieldsProps) => {
  const settings = [
    {
      name: "allowMultiple" as const,
      label: "Allow multiple selections",
      description: "Voters can select more than one option.",
    },
    {
      name: "requireAuth" as const,
      label: "Require authentication to vote",
      description: "Only authenticated users can vote.",
    },
    {
      name: "hideResults" as const,
      label: "Hide results until voting ends",
      description: "Results will only be visible after the poll closes.",
    },
  ]

  return (
    <div className="space-y-4">
      <FormLabel>Poll Settings</FormLabel>
      {settings.map((setting) => (
        <SettingField
          key={setting.name}
          control={control}
          name={setting.name}
          label={setting.label}
          description={setting.description}
        />
      ))}
    </div>
  )
}