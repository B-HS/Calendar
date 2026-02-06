<script lang="ts">
	import {
		MonthCalendar,
		EventFormDialog,
		type CalendarEvent,
		type CalendarDay,
		type Locale
	} from '$widgets/calendar'
	import { Toaster, toast } from 'svelte-sonner'
	import { Copy, Link, RefreshCw, Download } from '@lucide/svelte'
	import * as Dialog from '$lib/components/ui/dialog'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import {
		createEventsQuery,
		createCreateEventMutation,
		createOptimisticUpdateEventMutation,
		createOptimisticDeleteEventMutation,
		type CalendarEvent as ApiCalendarEvent,
		type CreateEventInput,
		type UpdateEventInput
	} from '$lib/entities/event'
	import {
		createSubscriptionQuery,
		createCreateSubscriptionMutation,
		createRegenerateIcsTokenMutation,
		subscriptionApi
	} from '$lib/entities/subscription'

	const { data } = $props()

	const userTimezone = $derived(data.user?.timezone ?? 'Asia/Seoul')

	const now = new Date()
	let currentYear = $state(now.getFullYear())
	let currentMonth = $state(now.getMonth())

	let formLoading = $state(false)
	let formOpen = $state(false)
	let selectedEvent = $state<CalendarEvent | null>(null)
	let selectedDate = $state<Date | null>(null)
	let showIcsModal = $state(false)
	let showCaldavModal = $state(false)

	const locale = $derived(getLocale() as Locale)

	const eventsQuery = createEventsQuery(() => ({ year: currentYear, month: currentMonth }))
	const subscriptionQuery = createSubscriptionQuery()

	const createEventMutation = createCreateEventMutation()
	const updateEventMutation = createOptimisticUpdateEventMutation()
	const deleteEventMutation = createOptimisticDeleteEventMutation()
	const createSubscriptionMutation = createCreateSubscriptionMutation()
	const regenerateIcsTokenMutation = createRegenerateIcsTokenMutation()

	const parseApiEvent = (e: ApiCalendarEvent): CalendarEvent => ({
		...e,
		rrule: e.rrule
			? {
					...e.rrule,
					until: e.rrule.until ? new Date(e.rrule.until) : undefined
				}
			: undefined
	})

	const events = $derived(eventsQuery.data?.map(parseApiEvent) ?? [])
	let localEvents = $state<CalendarEvent[]>([])

	$effect(() => {
		localEvents = events
	})

	const icsLink = $derived(subscriptionQuery.data?.icsUrl ?? null)

	const handleMonthChange = (year: number, month: number) => {
		currentYear = year
		currentMonth = month
	}

	const handleEventsChange = async (updatedEvents: CalendarEvent[]) => {
		const movedEvent = updatedEvents.find((updated) => {
			const original = localEvents.find((e) => e.uid === updated.uid)
			if (!original) return false
			return (
				original.dtstart.getTime() !== updated.dtstart.getTime() ||
				original.dtend.getTime() !== updated.dtend.getTime()
			)
		})

		if (movedEvent) {
			const updateData: UpdateEventInput = {
				dtstart: movedEvent.dtstart.toISOString(),
				dtend: movedEvent.dtend.toISOString()
			}

			try {
				await updateEventMutation.mutateAsync({ uid: movedEvent.uid, data: updateData })
				toast.success(m.schedule_eventUpdated())
			} catch {
				toast.error(m.schedule_eventUpdateFailed())
			}
		}
	}

	const handleEventClick = (event: CalendarEvent) => {
		selectedEvent = event
		selectedDate = null
		formOpen = true
	}

	const handleAddEvent = (day: CalendarDay) => {
		selectedEvent = null
		selectedDate = day.date
		formOpen = true
	}

	const handleSave = async (
		eventData: Omit<CalendarEvent, 'uid' | 'created' | 'lastModified'> | CalendarEvent
	) => {
		formLoading = true

		try {
			const isUpdate = 'uid' in eventData

			if (isUpdate) {
				const updateData: UpdateEventInput = {
					summary: eventData.summary,
					description: eventData.description,
					location: eventData.location,
					dtstart: eventData.dtstart.toISOString(),
					dtend: eventData.dtend.toISOString(),
					isAllDay: eventData.isAllDay,
					rrule: eventData.rrule
						? {
								...eventData.rrule,
								until: eventData.rrule.until?.toISOString()
							}
						: null,
					status: eventData.status,
					transp: eventData.transp,
					priority: eventData.priority,
					categories: eventData.categories,
					color: eventData.color
				}
				await updateEventMutation.mutateAsync({ uid: eventData.uid, data: updateData })
				toast.success(m.schedule_eventUpdated())
			} else {
				const createData: CreateEventInput = {
					summary: eventData.summary,
					description: eventData.description,
					location: eventData.location,
					dtstart: eventData.dtstart.toISOString(),
					dtend: eventData.dtend.toISOString(),
					isAllDay: eventData.isAllDay,
					rrule: eventData.rrule
						? {
								...eventData.rrule,
								until: eventData.rrule.until?.toISOString()
							}
						: undefined,
					status: eventData.status,
					transp: eventData.transp,
					priority: eventData.priority,
					categories: eventData.categories,
					color: eventData.color
				}
				await createEventMutation.mutateAsync(createData)
				toast.success(m.schedule_eventCreated())
			}
			formOpen = false
		} catch {
			toast.error(m.schedule_saveFailed())
		}

		formLoading = false
	}

	const handleDelete = async (uid: string) => {
		formLoading = true

		try {
			await deleteEventMutation.mutateAsync(uid)
			toast.success(m.schedule_eventDeleted())
			formOpen = false
		} catch {
			toast.error(m.schedule_deleteFailed())
		}

		formLoading = false
	}

	const copyIcsLink = async () => {
		if (!icsLink) return
		await navigator.clipboard.writeText(icsLink)
		toast.success(m.schedule_icsCopied())
	}

	const downloadMobileconfig = async () => {
		try {
			const response = await fetch(subscriptionApi.getMobileconfigUrl(), {
				credentials: 'include'
			})
			if (!response.ok) throw new Error('Download failed')
			const blob = await response.blob()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'calendar.mobileconfig'
			a.click()
			URL.revokeObjectURL(url)
		} catch {
			toast.error(m.schedule_linkGenerateFailed())
		}
	}

	const createOrRegenerateToken = async (regenerate = false) => {
		try {
			if (regenerate) {
				await regenerateIcsTokenMutation.mutateAsync()
				toast.success(m.schedule_newLinkGenerated())
			} else {
				await createSubscriptionMutation.mutateAsync()
				toast.success(m.schedule_linkCreated())
			}
		} catch {
			toast.error(m.schedule_linkGenerateFailed())
		}
	}

</script>

<svelte:head>
	<title>{m.schedule_pageTitle()}</title>
</svelte:head>

<Toaster position="top-right" richColors />

<div class="flex h-screen flex-col">
	<div class="flex items-center justify-between border-b px-3.5 py-2">
		<h1 class="text-lg font-semibold">{m.schedule_title()}</h1>
		<div class="flex gap-2">
			<Button variant="outline" size="sm" onclick={() => (showCaldavModal = true)}>
				<Link class="mr-2 size-5" />
				{m.schedule_caldavLink()}
			</Button>
			<Button variant="outline" size="sm" onclick={() => (showIcsModal = true)}>
				<Link class="mr-2 size-5" />
				{m.schedule_icsLink()}
			</Button>
		</div>
	</div>

	<div class="flex-1">
		{#if eventsQuery.isLoading}
			<div class="flex h-full items-center justify-center">
				<p class="text-muted-foreground">Loading...</p>
			</div>
		{:else if eventsQuery.isError}
			<div class="flex h-full items-center justify-center">
				<p class="text-destructive">Failed to load events</p>
			</div>
		{:else}
			<MonthCalendar
				bordered={false}
				bind:events={localEvents}
				initialYear={currentYear}
				initialMonth={currentMonth}
				{locale}
				onEventsChange={handleEventsChange}
				onEventClick={handleEventClick}
				onAddEvent={handleAddEvent}
				onMonthChange={handleMonthChange}
			/>
		{/if}
	</div>
</div>

<EventFormDialog
	bind:open={formOpen}
	event={selectedEvent}
	{selectedDate}
	loading={formLoading}
	timezone={userTimezone}
	onSave={handleSave}
	onDelete={handleDelete}
/>

<Dialog.Root bind:open={showIcsModal}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{m.schedule_icsSubscription()}</Dialog.Title>
			<Dialog.Description>
				{m.schedule_icsDescription()}
			</Dialog.Description>
		</Dialog.Header>

		{#if icsLink}
			<div class="flex gap-2">
				<Input readonly value={icsLink} class="flex-1" />
				<Button size="icon" onclick={copyIcsLink} title={m.common_copy()}>
					<Copy class="size-5" />
				</Button>
			</div>
			<Dialog.Footer class="justify-between sm:justify-between">
				<Button variant="ghost" size="sm" onclick={() => createOrRegenerateToken(true)}>
					<RefreshCw class="mr-2 size-5" />
					{m.schedule_regenerateLink()}
				</Button>
				<Button variant="outline" size="sm" onclick={() => (showIcsModal = false)}>
					{m.common_close()}
				</Button>
			</Dialog.Footer>
		{:else}
			<p class="text-sm text-muted-foreground">
				{m.schedule_icsNotCreated()}
			</p>
			<Dialog.Footer class="justify-between sm:justify-between">
				<Button size="sm" onclick={() => createOrRegenerateToken(false)}>
					{m.schedule_createLink()}
				</Button>
				<Button variant="outline" size="sm" onclick={() => (showIcsModal = false)}>
					{m.common_close()}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showCaldavModal}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{m.schedule_caldavSubscription()}</Dialog.Title>
			<Dialog.Description>
				{m.schedule_caldavDescription()}
			</Dialog.Description>
		</Dialog.Header>

		{#if subscriptionQuery.data}
			<Button onclick={downloadMobileconfig} class="w-full">
				<Download class="mr-2 size-5" />
				{m.schedule_downloadProfile()}
			</Button>
			<Dialog.Footer class="justify-end">
				<Button variant="outline" size="sm" onclick={() => (showCaldavModal = false)}>
					{m.common_close()}
				</Button>
			</Dialog.Footer>
		{:else}
			<p class="text-sm text-muted-foreground">
				{m.schedule_icsNotCreated()}
			</p>
			<Dialog.Footer class="justify-between sm:justify-between">
				<Button size="sm" onclick={() => createOrRegenerateToken(false)}>
					{m.schedule_createLink()}
				</Button>
				<Button variant="outline" size="sm" onclick={() => (showCaldavModal = false)}>
					{m.common_close()}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
