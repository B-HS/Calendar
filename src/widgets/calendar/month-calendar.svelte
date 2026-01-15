<script lang="ts">
	import { DragDropProvider, DragOverlay, PointerSensor, KeyboardSensor } from '@dnd-kit-svelte/svelte'
	import { untrack } from 'svelte'
	import dayjs from 'dayjs'
	import { cn } from '$lib/utils'
	import { Button } from '$lib/components/ui/button'
	import type { CalendarDay, CalendarEvent, EventPosition } from './types'
	import type { MonthData } from './types'
	import { getTranslations, type Locale } from './i18n'
	import {
		getMonthData,
		assignEventsToWeek,
		moveEvent,
		resizeEvent,
		generateEventColor
	} from './utils'
	import CalendarDayCell from './calendar-day.svelte'
	import CalendarEventItem from './calendar-event.svelte'
	import EventDrawer from './event-drawer.svelte'
	import ChevronLeft from '@lucide/svelte/icons/chevron-left'
	import ChevronRight from '@lucide/svelte/icons/chevron-right'

	interface Props {
		events?: CalendarEvent[]
		initialYear?: number
		initialMonth?: number
		locale?: Locale
		bordered?: boolean
		onEventsChange?: (events: CalendarEvent[]) => void
		onEventClick?: (event: CalendarEvent) => void
		onAddEvent?: (day: CalendarDay) => void
		onMonthChange?: (year: number, month: number) => void
	}

	let {
		events = $bindable([]),
		initialYear,
		initialMonth,
		locale = 'ko',
		bordered = true,
		onEventsChange,
		onEventClick,
		onAddEvent,
		onMonthChange
	}: Props = $props()

	const now = new Date()
	let currentYear = $state(untrack(() => initialYear ?? now.getFullYear()))
	let currentMonth = $state(untrack(() => initialMonth ?? now.getMonth()))
	let selectedDay = $state<CalendarDay | null>(null)
	let drawerOpen = $state(false)
	let draggedEventData = $state<{ event: CalendarEvent; position: EventPosition } | null>(null)
	let resizePreview = $state<{
		event: CalendarEvent
		edge: 'start' | 'end'
		originalPosition: EventPosition
		targetWeekIndex: number
		targetDayIndex: number
		sourceWeekIndex: number
	} | null>(null)

	const t = $derived(getTranslations(locale))
	const monthData = $derived<MonthData>(getMonthData(currentYear, currentMonth))

	const weekEventPositions = $derived(
		monthData.weeks.map((week) => assignEventsToWeek(week, events))
	)

	const goToPrevMonth = () => {
		if (currentMonth === 0) {
			currentMonth = 11
			currentYear--
		} else {
			currentMonth--
		}
		onMonthChange?.(currentYear, currentMonth)
	}

	const goToNextMonth = () => {
		if (currentMonth === 11) {
			currentMonth = 0
			currentYear++
		} else {
			currentMonth++
		}
		onMonthChange?.(currentYear, currentMonth)
	}

	const goToToday = () => {
		const today = new Date()
		currentYear = today.getFullYear()
		currentMonth = today.getMonth()
		onMonthChange?.(currentYear, currentMonth)
	}

	const handleDayClick = (day: CalendarDay) => {
		selectedDay = day
		drawerOpen = true
	}

	type DragEventData = { event?: CalendarEvent; position?: EventPosition; weekIndex?: number; day?: CalendarDay; dayIndex?: number; clickedCol?: number; dragType?: 'move' | 'resize'; edge?: 'start' | 'end' }
	type DragSource = { data?: DragEventData } | null
	type DragTarget = { data?: DragEventData } | null

	type DragStartEvent = {
		cancelable: boolean
		operation: { source: DragSource; target?: DragTarget }
	}

	type DragEndEvent = {
		canceled: boolean
		operation: { source: DragSource; target?: DragTarget }
	}

	type DragOverEvent = {
		operation: { source: DragSource; target?: DragTarget }
	}

	const handleDragStart = (e: DragStartEvent) => {
		const source = e.operation.source
		if (source?.data?.event) {
			if (source.data.dragType === 'resize' && source.data.edge) {
				resizePreview = {
					event: source.data.event,
					edge: source.data.edge,
					originalPosition: source.data.position!,
					targetWeekIndex: source.data.weekIndex ?? 0,
					targetDayIndex: source.data.edge === 'start'
						? source.data.position!.startCol
						: source.data.position!.startCol + source.data.position!.span - 1,
					sourceWeekIndex: source.data.weekIndex ?? 0
				}
			} else {
				draggedEventData = {
					event: source.data.event,
					position: source.data.position!
				}
			}
		}
	}

	const handleDragOver = (e: DragOverEvent) => {
		const { source, target } = e.operation
		if (!source?.data?.event || source.data.dragType !== 'resize' || !target?.data) return

		const targetDayIndex = target.data.dayIndex
		const targetWeekIndex = target.data.weekIndex ?? 0

		if (targetDayIndex !== undefined && resizePreview) {
			resizePreview = {
				...resizePreview,
				targetWeekIndex,
				targetDayIndex
			}
		}
	}

	const handleDragEnd = (e: DragEndEvent) => {
		const { source, target } = e.operation

		if (e.canceled || !target || !source) {
			draggedEventData = null
			return
		}

		const sourceEvent = source.data?.event
		const sourceWeekIndex = source.data?.weekIndex ?? 0
		const clickedCol = source.data?.clickedCol ?? 0
		const dragType = source.data?.dragType ?? 'move'
		const edge = source.data?.edge

		const targetDay = target.data?.day
		const targetDayIndex = target.data?.dayIndex
		const targetWeekIndex = target.data?.weekIndex ?? 0

		if (sourceEvent && targetDay && targetDayIndex !== undefined) {
			const weekOffset = targetWeekIndex - sourceWeekIndex
			const dayOffset = targetDayIndex - clickedCol
			const totalOffset = weekOffset * 7 + dayOffset

			if (totalOffset !== 0) {
				let updatedEvent: CalendarEvent

				if (dragType === 'resize' && edge) {
					const position = source.data?.position
					const edgeCol = edge === 'start' ? (position?.startCol ?? 0) : ((position?.startCol ?? 0) + (position?.span ?? 1) - 1)
					const resizeOffset = targetDayIndex - edgeCol + weekOffset * 7
					updatedEvent = resizeEvent(sourceEvent, edge, resizeOffset)
				} else {
					const originalStart = dayjs(sourceEvent.dtstart)
					const newStart = originalStart.add(totalOffset, 'day')
					updatedEvent = moveEvent(sourceEvent, newStart.toDate())
				}

				events = events.map((ev) => (ev.uid === updatedEvent.uid ? updatedEvent : ev))
				onEventsChange?.(events)
			}
		}

		draggedEventData = null
		resizePreview = null
	}

	const handleEventClick = (event: CalendarEvent) => {
		onEventClick?.(event)
	}

	const handleDrawerAddEvent = (day: CalendarDay) => {
		onAddEvent?.(day)
	}

	const getMaxEventsPerWeek = (weekIndex: number) => {
		const positions = weekEventPositions[weekIndex]
		let maxRow = 0
		positions.forEach((eventPos) => {
			eventPos.forEach((pos) => {
				maxRow = Math.max(maxRow, pos.row)
			})
		})
		return maxRow + 1
	}

	const getResizePreviewForWeek = (weekIndex: number): { startCol: number; span: number; row: number } | null => {
		if (!resizePreview) return null

		const { edge, originalPosition, targetWeekIndex, targetDayIndex, sourceWeekIndex } = resizePreview
		const origStartCol = originalPosition.startCol
		const origEndCol = origStartCol + originalPosition.span - 1

		const weekOffset = targetWeekIndex - sourceWeekIndex
		const targetAbsoluteDay = targetDayIndex + weekOffset * 7

		let newStartCol: number
		let newEndCol: number

		if (edge === 'start') {
			const origStartAbsolute = origStartCol
			const origEndAbsolute = origEndCol
			newStartCol = targetAbsoluteDay
			newEndCol = origEndAbsolute
		} else {
			const origStartAbsolute = origStartCol
			newStartCol = origStartAbsolute
			newEndCol = targetAbsoluteDay
		}

		if (newStartCol > newEndCol) {
			[newStartCol, newEndCol] = [newEndCol, newStartCol]
		}

		const weekStartAbsolute = (weekIndex - sourceWeekIndex) * 7
		const weekEndAbsolute = weekStartAbsolute + 6

		if (newEndCol < weekStartAbsolute || newStartCol > weekEndAbsolute) {
			return null
		}

		const clampedStart = Math.max(0, newStartCol - weekStartAbsolute)
		const clampedEnd = Math.min(6, newEndCol - weekStartAbsolute)

		return {
			startCol: clampedStart,
			span: clampedEnd - clampedStart + 1,
			row: originalPosition.row
		}
	}
</script>

<DragDropProvider
	sensors={[PointerSensor, KeyboardSensor]}
	onDragStart={handleDragStart}
	onDragOver={handleDragOver}
	onDragEnd={handleDragEnd}
>
	<div class={cn('flex h-full flex-col bg-background', bordered && 'rounded-lg border')}>
		<header class="flex items-center justify-between border-b px-3 py-2 sm:px-5 sm:py-3">
			<div class="flex items-center gap-2 sm:gap-3">
				<h2 class="text-base font-semibold sm:text-xl">
					{currentYear} {t.months.long[currentMonth]}
				</h2>
				<Button variant="outline" size="sm" class="hidden sm:inline-flex" onclick={goToToday}>
					{t.today}
				</Button>
			</div>
			<div class="flex items-center gap-1">
				<Button variant="outline" size="icon" class="size-8 sm:size-9" onclick={goToPrevMonth}>
					<ChevronLeft class="size-5" />
				</Button>
				<Button variant="outline" size="icon" class="size-8 sm:size-9" onclick={goToNextMonth}>
					<ChevronRight class="size-5" />
				</Button>
			</div>
		</header>

		<div class="grid grid-cols-7 border-b">
			{#each t.weekdays.short as day, i}
				<div
					class={cn(
						'border-border py-1.5 text-center text-xs font-medium sm:py-2 sm:text-sm',
						i < 6 && 'border-r',
						i === 0 && 'text-red-500',
						i === 6 && 'text-blue-500'
					)}
				>
					{day}
				</div>
			{/each}
		</div>

		<div class="flex-1 overflow-auto">
			{#each monthData.weeks as week, weekIndex (weekIndex)}
				{@const eventPositions = weekEventPositions[weekIndex]}
				{@const maxEvents = getMaxEventsPerWeek(weekIndex)}
 				{@const minHeight = Math.max(80, 28 + maxEvents * 24)}

				<div class="relative grid grid-cols-7" style="min-height: {minHeight}px;">
					{#each week as day, dayIndex (day.date.toISOString())}
						<CalendarDayCell
							{day}
							{dayIndex}
							{weekIndex}
							onDayClick={handleDayClick}
						/>
					{/each}

					<div class="pointer-events-none absolute inset-x-0 top-7 bottom-0 overflow-hidden sm:top-8">
						{#each events as event (event.uid)}
							{@const positions = eventPositions.get(event.uid)}
							{#if positions}
								{#each positions as position, posIndex (posIndex)}
									<div class="pointer-events-auto">
										<CalendarEventItem
											{event}
											{position}
											{weekIndex}
											{locale}
											onEventClick={handleEventClick}
										/>
									</div>
								{/each}
							{/if}
						{/each}

						{#if resizePreview}
							{@const previewPos = getResizePreviewForWeek(weekIndex)}
							{#if previewPos}
								{@const colorClass = resizePreview.event.color || generateEventColor(resizePreview.event.uid)}
								<div
									class={cn(
										'absolute h-5 rounded-lg border-2 border-dashed border-white/80 opacity-60',
										colorClass
									)}
									style="
										top: {previewPos.row * 24}px;
										left: calc({previewPos.startCol} * 14.2857% + 1px);
										width: calc({previewPos.span} * 14.2857% - 2px);
									"
								></div>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<DragOverlay>
		{#snippet children(_source)}
			{#if draggedEventData}
				{@const event = draggedEventData.event}
				{@const colorClass = event.color || generateEventColor(event.uid)}
				<div
					class={cn(
						'h-6 cursor-grabbing rounded-sm px-1.5 text-xs leading-6 text-white shadow-lg',
						colorClass
					)}
					style="min-width: 120px;"
				>
					<span class="font-medium">{event.summary}</span>
				</div>
			{/if}
		{/snippet}
	</DragOverlay>

	<EventDrawer
		bind:open={drawerOpen}
		{selectedDay}
		{events}
		{locale}
		onEventClick={handleEventClick}
		onAddEvent={handleDrawerAddEvent}
	/>
</DragDropProvider>
