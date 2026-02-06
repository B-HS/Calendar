<script lang="ts">
	import dayjs from 'dayjs'
	import * as Dialog from '$lib/components/ui/dialog'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import { Textarea } from '$lib/components/ui/textarea'
	import { Switch } from '$lib/components/ui/switch'
	import { cn } from '$lib/utils'
	import type { CalendarEvent } from './types'
	import { generateEventColor } from './utils'
	import * as m from '$lib/paraglide/messages'
	import Trash2 from '@lucide/svelte/icons/trash-2'

	interface Props {
		open?: boolean
		event?: CalendarEvent | null
		selectedDate?: Date | null
		loading?: boolean
		timezone?: string
		onOpenChange?: (open: boolean) => void
		onSave?: (event: Omit<CalendarEvent, 'uid' | 'created' | 'lastModified'> | CalendarEvent) => void
		onDelete?: (uid: string) => void
	}

	let {
		open = $bindable(false),
		event = null,
		selectedDate = null,
		loading = false,
		timezone = 'Asia/Seoul',
		onOpenChange,
		onSave,
		onDelete
	}: Props = $props()

	const isEditing = $derived(!!event)

	let summary = $state('')
	let description = $state('')
	let location = $state('')
	let isAllDay = $state(false)
	let startDate = $state('')
	let startTime = $state('')
	let endDate = $state('')
	let endTime = $state('')
	let color = $state('')

	const colors = [
		'bg-red-500',
		'bg-orange-500',
		'bg-amber-500',
		'bg-green-500',
		'bg-teal-500',
		'bg-blue-500',
		'bg-indigo-500',
		'bg-purple-500',
		'bg-pink-500'
	]

	$effect(() => {
		if (open) {
			if (event) {
				summary = event.summary
				description = event.description || ''
				location = event.location || ''
				isAllDay = event.isAllDay

				if (event.isAllDay) {
					const start = new Date(event.dtstart)
					const end = new Date(event.dtend)
					startDate = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`
					startTime = '00:00'
					const endMinusOne = new Date(end.getTime() - 24 * 60 * 60 * 1000)
					endDate = `${endMinusOne.getUTCFullYear()}-${String(endMinusOne.getUTCMonth() + 1).padStart(2, '0')}-${String(endMinusOne.getUTCDate()).padStart(2, '0')}`
					endTime = '23:59'
				} else {
					startDate = dayjs(event.dtstart).format('YYYY-MM-DD')
					startTime = dayjs(event.dtstart).format('HH:mm')
					endDate = dayjs(event.dtend).format('YYYY-MM-DD')
					endTime = dayjs(event.dtend).format('HH:mm')
				}
				color = event.color || generateEventColor(event.uid)
			} else {
				const date = selectedDate || new Date()
				summary = ''
				description = ''
				location = ''
				isAllDay = false
				startDate = dayjs(date).format('YYYY-MM-DD')
				startTime = '09:00'
				endDate = dayjs(date).format('YYYY-MM-DD')
				endTime = '10:00'
				color = colors[Math.floor(Math.random() * colors.length)]
			}
		}
	})

	const handleOpenChange = (value: boolean) => {
		open = value
		onOpenChange?.(value)
	}

	const handleSubmit = () => {
		if (!summary.trim()) return

		let dtstart: Date
		let dtend: Date

		if (isAllDay) {
			const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
			const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
			dtstart = new Date(Date.UTC(startYear, startMonth - 1, startDay))
			dtend = new Date(Date.UTC(endYear, endMonth - 1, endDay + 1))
		} else {
			dtstart = dayjs(`${startDate} ${startTime}`).toDate()
			dtend = dayjs(`${endDate} ${endTime}`).toDate()
		}

		if (event) {
			onSave?.({
				...event,
				summary: summary.trim(),
				description: description.trim() || undefined,
				location: location.trim() || undefined,
				isAllDay,
				dtstart,
				dtend,
				color
			})
		} else {
			onSave?.({
				summary: summary.trim(),
				description: description.trim() || undefined,
				location: location.trim() || undefined,
				isAllDay,
				dtstart,
				dtend,
				color,
				status: 'CONFIRMED'
			})
		}
	}

	const handleDelete = () => {
		if (event) {
			onDelete?.(event.uid)
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md z-[60] max-h-[80dvh] overflow-y-auto sm:max-h-none sm:overflow-visible">
		<Dialog.Header>
			<Dialog.Title>{isEditing ? m.eventForm_editEvent() : m.eventForm_newEvent()}</Dialog.Title>
		</Dialog.Header>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit() }} class="space-y-4">
			<div class="space-y-2">
				<Label for="summary">{m.eventForm_summary()}</Label>
				<Input
					id="summary"
					bind:value={summary}
					placeholder={m.eventForm_summary()}
					required
				/>
			</div>

			<div class="space-y-2">
				<Label for="description">{m.eventForm_description()}</Label>
				<Textarea
					id="description"
					bind:value={description}
					placeholder={m.eventForm_description()}
					rows={3}
				/>
			</div>

			<div class="space-y-2">
				<Label for="location">{m.eventForm_location()}</Label>
				<Input
					id="location"
					bind:value={location}
					placeholder={m.eventForm_location()}
				/>
			</div>

			<div class="flex items-center justify-between">
				<Label for="allDay">{m.eventForm_allDay()}</Label>
				<Switch id="allDay" bind:checked={isAllDay} />
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
				<div class="space-y-2 min-w-0">
					<Label for="startDate">{m.eventForm_start()}</Label>
					<Input id="startDate" type="date" class="w-full max-w-full" bind:value={startDate} />
					{#if !isAllDay}
						<Input type="time" class="w-full max-w-full" bind:value={startTime} />
					{/if}
				</div>
				<div class="space-y-2 min-w-0">
					<Label for="endDate">{m.eventForm_end()}</Label>
					<Input id="endDate" type="date" class="w-full max-w-full" bind:value={endDate} />
					{#if !isAllDay}
						<Input type="time" class="w-full max-w-full" bind:value={endTime} />
					{/if}
				</div>
			</div>

			<div class="space-y-2">
				<Label>{m.eventForm_color()}</Label>
				<div class="flex flex-wrap gap-2">
					{#each colors as c}
						<button
							type="button"
							aria-label={c}
							class={cn(
								'size-7 shrink-0 rounded-full transition-all sm:size-8',
								c,
								color === c ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-60 hover:opacity-100'
							)}
							onclick={() => (color = c)}
						></button>
					{/each}
				</div>
			</div>

			<Dialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-between">
				{#if isEditing}
					<Button
						type="button"
						variant="destructive"
						class="w-full sm:w-auto"
						onclick={handleDelete}
						disabled={loading}
					>
						<Trash2 class="mr-1 size-3" />
						{m.common_delete()}
					</Button>
				{:else}
					<div class="hidden sm:block"></div>
				{/if}
				<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
					<Button
						type="button"
						variant="outline"
						class="w-full sm:w-auto"
						disabled={loading}
						onclick={() => handleOpenChange(false)}
					>
						{m.common_cancel()}
					</Button>
					<Button type="submit" class="w-full sm:w-auto" disabled={loading || !summary.trim()}>
						{m.common_save()}
					</Button>
				</div>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
