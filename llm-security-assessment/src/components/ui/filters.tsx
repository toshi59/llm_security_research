'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, X, ChevronDown } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroup {
  key: string
  label: string
  options: FilterOption[]
  multiple?: boolean
  searchable?: boolean
}

interface FiltersProps {
  groups: FilterGroup[]
  values: Record<string, string | string[]>
  onChange: (key: string, value: string | string[]) => void
  onClear: () => void
  searchTerm?: string
  onSearchChange?: (term: string) => void
  className?: string
}

export function Filters({
  groups,
  values,
  onChange,
  onClear,
  searchTerm = '',
  onSearchChange,
  className
}: FiltersProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedGroups(newExpanded)
  }

  const getActiveFilterCount = () => {
    return Object.values(values).filter(value => 
      Array.isArray(value) ? value.length > 0 : value
    ).length + (searchTerm ? 1 : 0)
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            フィルター
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              クリア
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 検索フィルター */}
        {onSearchChange && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              検索
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="キーワードで検索..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => onSearchChange('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* フィルターグループ */}
        {groups.map((group) => (
          <div key={group.key} className="space-y-3">
            <button
              onClick={() => toggleGroup(group.key)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span>{group.label}</span>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform",
                  expandedGroups.has(group.key) && "rotate-180"
                )}
              />
            </button>

            {expandedGroups.has(group.key) && (
              <div className="space-y-2 pl-2">
                {group.multiple ? (
                  // マルチセレクト
                  <div className="grid grid-cols-1 gap-2">
                    {group.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md p-2 -m-2"
                      >
                        <input
                          type="checkbox"
                          checked={(values[group.key] as string[] || []).includes(option.value)}
                          onChange={(e) => {
                            const currentValues = values[group.key] as string[] || []
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter(v => v !== option.value)
                            onChange(group.key, newValues)
                          }}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-400 ml-2">({option.count})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  // シングルセレクト
                  <div className="space-y-1">
                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md p-2 -m-2">
                      <input
                        type="radio"
                        name={group.key}
                        checked={!values[group.key]}
                        onChange={() => onChange(group.key, '')}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        すべて
                      </span>
                    </label>
                    {group.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md p-2 -m-2"
                      >
                        <input
                          type="radio"
                          name={group.key}
                          checked={values[group.key] === option.value}
                          onChange={() => onChange(group.key, option.value)}
                          className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-400 ml-2">({option.count})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// クイックフィルター用のピルコンポーネント
export function FilterPills({
  filters,
  onRemove,
  className
}: {
  filters: Array<{ key: string; label: string; value: string }>
  onRemove: (key: string) => void
  className?: string
}) {
  if (filters.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filters.map((filter, index) => (
        <Badge
          key={`${filter.key}-${index}`}
          variant="secondary"
          className="px-3 py-1 text-xs"
        >
          {filter.label}: {filter.value}
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}