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
	import type { Locale } from './i18n'
	import { generateEventColor } from './utils'
	import { t as getT } from '$lib/i18n'
	import Trash2 from '@lucide/svelte/icons/trash-2'

	interface Props {
		open?: boolean
		event?: CalendarEvent | null
		selectedDate?: Date | null
		locale?: Locale
		loading?: boolean
		onOpenChange?: (open: boolean) => void
		onSave?: (event: Omit<CalendarEvent, 'uid' | 'created' | 'lastModified'> | CalendarEvent) => void
		onDelete?: (uid: string) => void
	}

	let {
		open = $bindable(false),
		event = null,
		selectedDate = null,
		locale = 'ko',
		loading = false,
		onOpenChange,
		onSave,
		onDelete
	}: Props = $props()

	const t = $derived(getT(locale))
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
				startDate = dayjs(event.dtstart).format('YYYY-MM-DD')
				startTime = dayjs(event.dtstart).format('HH:mm')
				endDate = dayjs(event.dtend).format('YYYY-MM-DD')
				endTime = dayjs(event.dtend).format('HH:mm')
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

		const dtstart = isAllDay
			? dayjs(startDate).startOf('day').toDate()
			: dayjs(`${startDate} ${startTime}`).toDate()

		const dtend = isAllDay
			? dayjs(endDate).endOf('day').toDate()
			: dayjs(`${endDate} ${endTime}`).toDate()

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
	<Dialog.Content class="max-w-md z-[60]">
		<Dialog.Header>
			<Dialog.Title>{isEditing ? t.eventForm.editEvent : t.eventForm.newEvent}</Dialog.Title>
		</Dialog.Header>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit() }} class="space-y-5">
			<div class="space-y-2">
				<Label for="summary">{t.eventForm.summary}</Label>
				<Input
					id="summary"
					bind:value={summary}
					placeholder={t.eventForm.summary}
					required
				/>
			</div>

			<div class="space-y-2">
				<Label for="description">{t.eventForm.description}</Label>
				<Textarea
					id="description"
					bind:value={description}
					placeholder={t.eventForm.description}
					rows={3}
				/>
			</div>

			<div class="space-y-2">
				<Label for="location">{t.eventForm.location}</Label>
				<Input
					id="location"
					bind:value={location}
					placeholder={t.eventForm.location}
				/>
			</div>

			<div class="flex items-center justify-between">
				<Label for="allDay">{t.eventForm.allDay}</Label>
				<Switch id="allDay" bind:checked={isAllDay} />
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-2">
					<Label for="startDate">{t.eventForm.start}</Label>
					<Input id="startDate" type="date" class="w-full" bind:value={startDate} />
					{#if !isAllDay}
						<Input type="time" class="w-full" bind:value={startTime} />
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="endDate">{t.eventForm.end}</Label>
					<Input id="endDate" type="date" class="w-full" bind:value={endDate} />
					{#if !isAllDay}
						<Input type="time" class="w-full" bind:value={endTime} />
					{/if}
				</div>
			</div>

			<div class="space-y-2">
				<Label>{t.eventForm.color}</Label>
				<div class="flex gap-2">
					{#each colors as c}
						<button
							type="button"
							aria-label={c}
							class={cn(
								'size-8 rounded-full transition-all',
								c,
								color === c ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-60 hover:opacity-100'
							)}
							onclick={() => (color = c)}
						></button>
					{/each}
				</div>
			</div>

			<Dialog.Footer class="flex justify-between sm:justify-between">
				{#if isEditing}
					<Button
						type="button"
						variant="destructive"
						onclick={handleDelete}
						disabled={loading}
					>
						<Trash2 class="mr-1 size-3" />
						{t.common.delete}
					</Button>
				{:else}
					<div></div>
				{/if}
				<div class="flex gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={loading}
						onclick={() => handleOpenChange(false)}
					>
						{t.common.cancel}
					</Button>
					<Button type="submit" disabled={loading || !summary.trim()}>
						{t.common.save}
					</Button>
				</div>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
