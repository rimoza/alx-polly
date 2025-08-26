interface PollOptionProps {
  id: number
  text: string
  votes: number
  percentage: number
  selected?: boolean
  onSelect?: (id: number) => void
}

export function PollOption({ 
  id, 
  text, 
  votes, 
  percentage, 
  selected = false,
  onSelect 
}: PollOptionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="poll-option"
            value={id}
            checked={selected}
            onChange={() => onSelect?.(id)}
            className="h-4 w-4"
          />
          <span>{text}</span>
        </label>
        <span className="text-sm text-gray-600">
          {votes} votes ({percentage}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}