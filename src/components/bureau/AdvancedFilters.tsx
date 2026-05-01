'use client'

import { useState, useCallback, useMemo } from 'react'
import { ChevronDown, X, Filter } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  multiple?: boolean
}

interface AdvancedFiltersProps {
  groups: FilterGroup[]
  activeFilters: Record<string, string | string[]>
  onFiltersChange: (filters: Record<string, string | string[]>) => void
  onReset?: () => void
}

export default function AdvancedFilters({
  groups,
  activeFilters,
  onFiltersChange,
  onReset,
}: AdvancedFiltersProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.id))
  )

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  const handleFilterChange = useCallback(
    (groupId: string, value: string, isMultiple: boolean) => {
      const current = activeFilters[groupId]

      let newValue: string | string[]
      if (isMultiple) {
        const arr = Array.isArray(current) ? current : current ? [current] : []
        if (arr.includes(value)) {
          newValue = arr.filter((v) => v !== value)
        } else {
          newValue = [...arr, value]
        }
      } else {
        newValue = current === value ? '' : value
      }

      onFiltersChange({
        ...activeFilters,
        [groupId]: newValue,
      })
    },
    [activeFilters, onFiltersChange]
  )

  const activeFilterCount = useMemo(() => {
    return Object.entries(activeFilters).reduce((count, [, value]) => {
      if (!value) return count
      if (Array.isArray(value)) return count + value.length
      return count + 1
    }, 0)
  }, [activeFilters])

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-600" />
          <h3 className="font-serif text-lg text-slate-100">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded bg-amber-600/20 border border-amber-600/30 text-amber-400 text-xs font-sans">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && onReset && (
          <button
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-300 font-sans transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Groups */}
      <div className="divide-y divide-slate-800">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id)
          const groupValue = activeFilters[group.id]
          const activeCount = Array.isArray(groupValue)
            ? groupValue.length
            : groupValue ? 1 : 0

          return (
            <div key={group.id}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-800/50
                         transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-semibold text-slate-200">
                    {group.label}
                  </span>
                  {activeCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-400 text-xs">
                      {activeCount}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-600 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Options */}
              {isExpanded && (
                <div className="px-6 py-3 space-y-2 border-t border-slate-800">
                  {group.options.map((option) => {
                    const isSelected = Array.isArray(groupValue)
                      ? groupValue.includes(option.value)
                      : groupValue === option.value

                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type={group.multiple ? 'checkbox' : 'radio'}
                          checked={isSelected}
                          onChange={() =>
                            handleFilterChange(
                              group.id,
                              option.value,
                              group.multiple ?? false
                            )
                          }
                          className="w-4 h-4 rounded bg-slate-800 border border-slate-700
                                   text-amber-600 checked:bg-amber-600 checked:border-amber-600
                                   cursor-pointer"
                        />
                        <span className="font-sans text-sm text-slate-400 group-hover:text-slate-300 transition-colors flex-1">
                          {option.label}
                        </span>
                        {option.count !== undefined && (
                          <span className="text-xs text-slate-600 font-sans">
                            {option.count}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
