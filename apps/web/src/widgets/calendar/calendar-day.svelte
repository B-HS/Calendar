<script lang="ts">
	import { useDroppable } from '@dnd-kit-svelte/svelte'
	import { cn } from '$lib/utils'
	import type { CalendarDay } from './types'

	interface Props {
		day: CalendarDay
		dayIndex: number
		weekIndex: number
		bordered?: boolean
		onDayClick?: (day: CalendarDay) => void
	}

	let { day, dayIndex, weekIndex, bordered = true, onDayClick }: Props = $props()

	const { ref, isDropTarget } = useDroppable({
		id: () => `day-${weekIndex}-${dayIndex}`,
		type: 'day',
		accept: ['event', 'resize'],
		data: () => ({ day, dayIndex, weekIndex })
	})

	const handleClick = () => {
		onDayClick?.(day)
	}
</script>

<div
	{@attach ref}
	class={cn(
		'relative flex flex-col transition-colors',
		bordered && 'border-b border-border',
		bordered && dayIndex < 6 && 'border-r',
		!day.isCurrentMonth && 'bg-muted/30',
		day.isToday && 'bg-primary/5',
		isDropTarget.current && 'bg-primary/10 ring-2 ring-primary ring-inset'
	)}
	onclick={handleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
	role="button"
	tabindex="0"
>
	<div class="flex h-7 items-center justify-center sm:h-8 sm:justify-start sm:px-1.5">
		<span
			class={cn(
				'inline-flex size-6 items-center justify-center rounded-full text-xs sm:size-7 sm:text-sm',
				day.isToday && 'bg-primary text-primary-foreground font-semibold',
				!day.isCurrentMonth && 'text-muted-foreground',
				day.isWeekend && day.isCurrentMonth && !day.isToday && 'text-red-500'
			)}
		>
			{day.date.getDate()}
		</span>
	</div>
</div>
