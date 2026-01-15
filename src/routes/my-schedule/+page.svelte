<script lang="ts">
    import { MonthCalendar, EventFormDialog, type CalendarEvent, type CalendarDay, type Locale } from '$widgets/calendar'
    import { Toaster, toast } from 'svelte-sonner'
    import { Copy, Link, RefreshCw } from '@lucide/svelte'
    import * as Dialog from '$lib/components/ui/dialog'
    import { Button } from '$lib/components/ui/button'
    import { Input } from '$lib/components/ui/input'
    import { localeStore } from '$lib/i18n'

    const { data } = $props()

    type SerializedEvent = (typeof data.events)[0]

    const parseEvent = (e: SerializedEvent): CalendarEvent => ({
        ...e,
        dtstart: new Date(e.dtstart),
        dtend: new Date(e.dtend),
        created: e.created ? new Date(e.created) : undefined,
        lastModified: e.lastModified ? new Date(e.lastModified) : undefined,
        rrule: e.rrule
            ? {
                  ...e.rrule,
                  until: e.rrule.until ? new Date(e.rrule.until) : undefined,
              }
            : undefined,
    })

    const getInitialState = () => ({
        events: data.events.map(parseEvent),
        token: data.subscriptionToken,
        year: data.year,
        month: data.month,
    })

    const initial = getInitialState()

    let events = $state<CalendarEvent[]>(initial.events)
    let previousEvents = $state<CalendarEvent[]>(structuredClone(initial.events))
    let subscriptionToken = $state(initial.token)
    let formLoading = $state(false)
    let formOpen = $state(false)
    let selectedEvent = $state<CalendarEvent | null>(null)
    let selectedDate = $state<Date | null>(null)
    let showIcsModal = $state(false)
    let currentYear = $state(initial.year)
    let currentMonth = $state(initial.month)

    const locale = $derived(localeStore.locale as Locale)
    const t = $derived(localeStore.t)

    const icsLink = $derived(
        subscriptionToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/${subscriptionToken}.ics` : null,
    )

    const loadEvents = async (year: number, month: number) => {
        const res = await fetch(`/api/events?year=${year}&month=${month}`)
        if (res.ok) {
            const data = await res.json()
            const parsed = data.map((e: CalendarEvent) => ({
                ...e,
                dtstart: new Date(e.dtstart),
                dtend: new Date(e.dtend),
                created: e.created ? new Date(e.created) : undefined,
                lastModified: e.lastModified ? new Date(e.lastModified) : undefined,
                rrule: e.rrule
                    ? {
                          ...e.rrule,
                          until: e.rrule.until ? new Date(e.rrule.until) : undefined,
                      }
                    : undefined,
            }))
            events = parsed
            previousEvents = structuredClone(parsed)
        }
    }

    const handleMonthChange = (year: number, month: number) => {
        currentYear = year
        currentMonth = month
        loadEvents(year, month)
    }

    const handleEventsChange = async (updatedEvents: CalendarEvent[]) => {
        const movedEvent = updatedEvents.find((updated) => {
            const original = previousEvents.find((e) => e.uid === updated.uid)
            if (!original) return false
            return original.dtstart.getTime() !== updated.dtstart.getTime() || original.dtend.getTime() !== updated.dtend.getTime()
        })

        if (movedEvent) {
            const res = await fetch(`/api/events/${movedEvent.uid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movedEvent),
            })
            if (res.ok) {
                previousEvents = structuredClone(updatedEvents)
                toast.success(t.schedule.eventUpdated)
            } else {
                toast.error(t.schedule.eventUpdateFailed)
                loadEvents(currentYear, currentMonth)
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

    const handleSave = async (eventData: Omit<CalendarEvent, 'uid' | 'created' | 'lastModified'> | CalendarEvent) => {
        formLoading = true

        const isUpdate = 'uid' in eventData
        const url = isUpdate ? `/api/events/${eventData.uid}` : '/api/events'
        const method = isUpdate ? 'PUT' : 'POST'

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        })

        if (res.ok) {
            toast.success(isUpdate ? t.schedule.eventUpdated : t.schedule.eventCreated)
            formOpen = false
            await loadEvents(currentYear, currentMonth)
        } else {
            toast.error(t.schedule.saveFailed)
        }

        formLoading = false
    }

    const handleDelete = async (uid: string) => {
        formLoading = true

        const res = await fetch(`/api/events/${uid}`, { method: 'DELETE' })
        if (res.ok) {
            toast.success(t.schedule.eventDeleted)
            formOpen = false
            await loadEvents(currentYear, currentMonth)
        } else {
            toast.error(t.schedule.deleteFailed)
        }

        formLoading = false
    }

    const copyIcsLink = async () => {
        if (!icsLink) return
        await navigator.clipboard.writeText(icsLink)
        toast.success(t.schedule.icsCopied)
    }

    const createOrRegenerateToken = async (regenerate = false) => {
        const res = await fetch('/api/calendar/subscription', { method: regenerate ? 'PATCH' : 'POST' })
        const result = await res.json()

        if (res.ok && result?.token) {
            subscriptionToken = result.token
            toast.success(regenerate ? t.schedule.newLinkGenerated : t.schedule.linkCreated)
        } else {
            toast.error(t.schedule.linkGenerateFailed)
        }
    }
</script>

<svelte:head>
    <title>{t.schedule.pageTitle}</title>
</svelte:head>

<Toaster position="top-right" richColors />

<div class="flex h-screen flex-col">
    <div class="flex items-center justify-between border-b px-3.5 py-2">
        <h1 class="text-lg font-semibold">{t.schedule.title}</h1>
        <Button variant="outline" size="sm" onclick={() => (showIcsModal = true)}>
            <Link class="mr-2 size-5" />
            {t.schedule.icsLink}
        </Button>
    </div>

    <div class="flex-1">
        <MonthCalendar
            bordered={false}
            bind:events
            initialYear={currentYear}
            initialMonth={currentMonth}
            {locale}
            onEventsChange={handleEventsChange}
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
            onMonthChange={handleMonthChange} />
    </div>
</div>

<EventFormDialog
    bind:open={formOpen}
    event={selectedEvent}
    {selectedDate}
    {locale}
    loading={formLoading}
    onSave={handleSave}
    onDelete={handleDelete} />

<Dialog.Root bind:open={showIcsModal}>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>{t.schedule.icsSubscription}</Dialog.Title>
            <Dialog.Description>
                {t.schedule.icsDescription}
            </Dialog.Description>
        </Dialog.Header>

        {#if icsLink}
            <div class="flex gap-2">
                <Input readonly value={icsLink} class="flex-1" />
                <Button size="icon" onclick={copyIcsLink} title={t.common.copy}>
                    <Copy class="size-5" />
                </Button>
            </div>
            <Dialog.Footer class="justify-between sm:justify-between">
                <Button variant="ghost" size="sm" onclick={() => createOrRegenerateToken(true)}>
                    <RefreshCw class="mr-2 size-5" />
                    {t.schedule.regenerateLink}
                </Button>
                <Button variant="outline" size="sm" onclick={() => (showIcsModal = false)}>
                    {t.common.close}
                </Button>
            </Dialog.Footer>
        {:else}
            <p class="text-sm text-muted-foreground">
                {t.schedule.icsNotCreated}
            </p>
            <Dialog.Footer class="justify-between sm:justify-between">
                <Button size="sm" onclick={() => createOrRegenerateToken(false)}>
                    {t.schedule.createLink}
                </Button>
                <Button variant="outline" size="sm" onclick={() => (showIcsModal = false)}>
                    {t.common.close}
                </Button>
            </Dialog.Footer>
        {/if}
    </Dialog.Content>
</Dialog.Root>
