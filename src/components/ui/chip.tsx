import { cn } from '@/lib/utils'

interface TopicChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

export function TopicChip({ label, selected, onClick }: TopicChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer font-medium',
        selected
          ? 'border-peach-500 bg-peach-500 text-white'
          : 'border-border bg-background text-foreground hover:border-peach-400 hover:bg-peach-100',
      )}
    >
      {label}
    </button>
  )
}
