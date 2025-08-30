'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionProps {
  children: React.ReactNode
  className?: string
}

interface AccordionItemProps {
  children: React.ReactNode
  className?: string
  value?: string
}

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
  isOpen?: boolean
  onClick?: () => void
}

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
  isOpen?: boolean
}

export function Accordion({ children, className }: AccordionProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  )
}

export function AccordionItem({ children, className }: AccordionItemProps) {
  return (
    <div className={cn('border rounded-lg bg-white', className)}>
      {children}
    </div>
  )
}

export function AccordionTrigger({ 
  children, 
  className, 
  isOpen = false,
  onClick 
}: AccordionTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between px-4 py-3 text-left transition-all hover:bg-gray-50',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500 transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500 transition-transform" />
        )}
        {children}
      </div>
    </button>
  )
}

export function AccordionContent({ 
  children, 
  className,
  isOpen = false 
}: AccordionContentProps) {
  if (!isOpen) return null
  
  return (
    <div className={cn('px-4 pb-4', className)}>
      {children}
    </div>
  )
}