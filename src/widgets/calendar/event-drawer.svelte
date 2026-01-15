<script lang="ts">
	import dayjs from 'dayjs'
	import * as Drawer from '$lib/components/ui/drawer'
	import { Button } from '$lib/components/ui/button'
	import { ScrollArea } from '$lib/components/ui/scroll-area'
	import { Separator } from '$lib/components/ui/separator'
	import { cn } from '$lib/utils'
	import type { CalendarDay, CalendarEvent } from './types'
	import { getTranslations, type Locale } from './i18n'
	import { formatTime, generateEventColor } from './utils'
	import MapPin from '@lucide/svelte/icons/map-pin'
	import Clock from '@lucide/svelte/icons/clock'
	import CalendarDays from '@lucide/svelte/icons/calendar-days'
	import X from '@lucide/svelte/icons/x'
	import Plus from '@lucide/svelte/icons/plus'

	interface Props {
		open?: boolean
		selectedDay: CalendarDay | null
		events?: CalendarEvent[]
		locale?: Locale
		onOpenChange?: (open: boolean) => void
		onEventClick?: (event: CalendarEvent) => void
		onAddEvent?: (day: CalendarDay) => void
	}

	let {
		open = $bindable(false),
		selectedDay,
		events = [],
		locale = 'ko',
		onOpenChange,
		onEventClick,
		onAddEvent
	}: Props = $props()

	let isMobile = $state(false)

	$effect(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768
		}
		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	})

	const t = $derived(getTranslations(locale))

	const dayEvents = $derived(
		selectedDay
			? events.filter((event) => {
					const eventStart = dayjs(event.dtstart).startOf('day')
					const eventEnd = dayjs(event.dtend).startOf('day')
					const dayDate = dayjs(selectedDay.date).startOf('day')
					return (
						(dayDate.isSame(eventStart) || dayDate.isAfter(eventStart)) &&
						(dayDate.isSame(eventEnd) || dayDate.isBefore(eventEnd))
					)
				})
			: []
	)

	const allDayEvents = $derived(dayEvents.filter((e) => e.isAllDay))
	const timedEvents = $derived(
		dayEvents.filter((e) => !e.isAllDay).sort((a, b) => dayjs(a.dtstart).valueOf() - dayjs(b.dtstart).valueOf())
	)

	const handleOpenChange = (value: boolean) => {
		open = value
		onOpenChange?.(value)
	}

	const formatDayHeader = (day: CalendarDay) => {
		const d = dayjs(day.date)
		return `${t.months.short[d.month()]} ${d.date()} ${t.weekdays.long[d.day()]}`
	}
</script>

<Drawer.Root bind:open onOpenChange={handleOpenChange} direction={isMobile ? 'bottom' : 'right'}>
	<Drawer.Content
		class={cn(
			isMobile && 'h-[85vh] max-h-[85vh]',
			!isMobile && 'h-full w-[400px] max-w-[400px]'
		)}
	>
		<div class="flex h-full flex-col">
			<Drawer.Header class="flex-shrink-0 border-b px-5 py-3">
				<div class="flex items-center justify-between">
					<div>
						<Drawer.Title class="text-lg font-semibold">
							{selectedDay ? formatDayHeader(selectedDay) : ''}
						</Drawer.Title>
						{#if selectedDay?.isToday}
							<span class="text-sm text-primary">{t.today}</span>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						{#if selectedDay}
							<Button
								variant="outline"
								size="sm"
								onclick={() => selectedDay && onAddEvent?.(selectedDay)}
							>
								<Plus class="mr-1 size-3" />
								{t.add}
							</Button>
						{/if}
						<Drawer.Close
							class="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
						>
							<X class="size-5" />
						</Drawer.Close>
					</div>
				</div>
			</Drawer.Header>

			<ScrollArea class="flex-1 px-5">
				{#if dayEvents.length === 0}
					<div class="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
						<CalendarDays class="mb-3 size-12 opacity-50" />
						<p>{t.noEvents}</p>
					</div>
				{:else}
					<div class="space-y-5 py-5">
						{#if allDayEvents.length > 0}
							<div class="space-y-2">
								<h3 class="text-sm font-medium text-muted-foreground">{t.allDay}</h3>
								{#each allDayEvents as event (event.uid)}
									<button
										class={cn(
											'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
											'focus:outline-none focus:ring-2 focus:ring-ring'
										)}
										onclick={() => onEventClick?.(event)}
									>
										<div class={cn('size-3 rounded-full', event.color || generateEventColor(event.uid))}></div>
										<div class="flex-1 min-w-0">
											<p class="font-medium truncate">{event.summary}</p>
											{#if event.location}
												<p class="text-sm text-muted-foreground truncate flex items-center gap-1">
													<MapPin class="size-3" />
													{event.location}
												</p>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						{/if}

						{#if allDayEvents.length > 0 && timedEvents.length > 0}
							<Separator />
						{/if}

						{#if timedEvents.length > 0}
							<div class="space-y-2">
								{#if allDayEvents.length > 0}
									<h3 class="text-sm font-medium text-muted-foreground">{t.timed}</h3>
								{/if}
								{#each timedEvents as event (event.uid)}
									<button
										class={cn(
											'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
											'focus:outline-none focus:ring-2 focus:ring-ring'
										)}
										onclick={() => onEventClick?.(event)}
									>
										<div class={cn('mt-1.5 size-3 rounded-full flex-shrink-0', event.color || generateEventColor(event.uid))}></div>
										<div class="flex-1 min-w-0">
											<p class="font-medium truncate">{event.summary}</p>
											<p class="text-sm text-muted-foreground flex items-center gap-1">
												<Clock class="size-3" />
												{formatTime(event.dtstart, locale)} - {formatTime(event.dtend, locale)}
											</p>
											{#if event.location}
												<p class="text-sm text-muted-foreground truncate flex items-center gap-1 mt-1">
													<MapPin class="size-3" />
													{event.location}
												</p>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</ScrollArea>
		</div>
	</Drawer.Content>
</Drawer.Root>
