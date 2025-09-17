'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'

interface TimeFilterProps {
  onFilterChange: (filter: { startDate?: Date; endDate?: Date }) => void
}

export function TimeFilter({ onFilterChange }: TimeFilterProps) {
  const [activeFilter, setActiveFilter] = useState<string>('7d')

  const filters = [
    { label: '24h', value: '1d', days: 1 },
    { label: '7 days', value: '7d', days: 7 },
    { label: '30 days', value: '30d', days: 30 },
    { label: 'All time', value: 'all', days: null }
  ]

  const handleFilterClick = (filter: typeof filters[0]) => {
    setActiveFilter(filter.value)

    if (filter.days === null) {
      onFilterChange({})
    } else {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - filter.days)
      onFilterChange({ startDate, endDate })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <div className="flex gap-1">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterClick(filter)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  )
}