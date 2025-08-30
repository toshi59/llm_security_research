'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { designTokens, judgementColors } from '@/lib/design-tokens'
import { ChevronDown, ChevronUp, Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface Column<T> {
  key: keyof T
  header: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: T[keyof T], row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  filterable?: boolean
  onRowClick?: (row: T) => void
  emptyMessage?: string
  className?: string
  rowClassName?: (row: T) => string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  filterable = false,
  onRowClick,
  emptyMessage = 'データがありません',
  className,
  rowClassName,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filters, setFilters] = React.useState<Partial<Record<keyof T, string>>>({})
  const [showFilters, setShowFilters] = React.useState(false)

  // ソート処理
  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // フィルター処理
  const filteredData = React.useMemo(() => {
    let result = [...data]

    // 検索フィルター
    if (searchTerm) {
      result = result.filter(row =>
        columns.some(column =>
          String(row[column.key]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // カラムフィルター
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(row =>
          String(row[key as keyof T]).toLowerCase().includes(value.toLowerCase())
        )
      }
    })

    // ソート
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        
        if (aVal === bVal) return 0
        
        const comparison = aVal < bVal ? -1 : 1
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [data, searchTerm, filters, sortColumn, sortDirection, columns])

  return (
    <div className={cn('space-y-4', className)}>
      {/* 検索・フィルターコントロール */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-sm">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        {filterable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            フィルター
          </Button>
        )}
      </div>

      {/* フィルター展開エリア */}
      {showFilters && filterable && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
          {columns.filter(col => col.filterable).map((column) => (
            <div key={String(column.key)} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {column.header}
              </label>
              <Input
                placeholder={`${column.header}で絞り込み...`}
                value={filters[column.key] || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  [column.key]: e.target.value
                }))}
              />
            </div>
          ))}
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({})}
            >
              <X className="h-4 w-4 mr-2" />
              クリア
            </Button>
          </div>
        </div>
      )}

      {/* データテーブル */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      'px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100',
                      column.sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800',
                      column.className
                    )}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortColumn === column.key && (
                        sortDirection === 'asc' ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      'border-b border-gray-100 dark:border-gray-800 last:border-b-0',
                      onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50',
                      'transition-colors',
                      rowClassName?.(row)
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          'px-6 py-4 text-sm text-gray-700 dark:text-gray-300',
                          column.className
                        )}
                      >
                        {column.render ? column.render(row[column.key], row) : String(row[column.key])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 結果件数 */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {filteredData.length} / {data.length} 件の結果
        </span>
      </div>
    </div>
  )
}

// 判定バッジコンポーネント
export function JudgementBadge({ judgement }: { judgement: '○' | '×' | '要改善' | null }) {
  const variants = {
    '○': 'success',
    '×': 'destructive', 
    '要改善': 'warning',
    null: 'secondary'
  } as const

  const labels = {
    '○': '適合',
    '×': '不適合',
    '要改善': '要改善', 
    null: '未評価'
  } as const

  return (
    <Badge variant={variants[judgement || 'null']}>
      {labels[judgement || 'null']}
    </Badge>
  )
}