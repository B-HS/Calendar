<script lang="ts">
	import { invalidate } from '$app/navigation'
	import { Button } from '$lib/components/ui/button'
	import * as Card from '$lib/components/ui/card'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import * as Select from '$lib/components/ui/select'
	import { Loader, ArrowLeft, Camera, X } from '@lucide/svelte'
	import * as m from '$lib/paraglide/messages'
	import { toast, Toaster } from 'svelte-sonner'
	import { authClient } from '$lib/auth-client'

	const { data } = $props()

	const TIMEZONES = [
		{ value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
		{ value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
		{ value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time' },
		{ value: 'America/Denver', label: '(UTC-07:00) Mountain Time' },
		{ value: 'America/Chicago', label: '(UTC-06:00) Central Time' },
		{ value: 'America/New_York', label: '(UTC-05:00) Eastern Time' },
		{ value: 'America/Sao_Paulo', label: '(UTC-03:00) São Paulo' },
		{ value: 'Atlantic/Reykjavik', label: '(UTC+00:00) Reykjavik' },
		{ value: 'Europe/London', label: '(UTC+00:00) London' },
		{ value: 'Europe/Paris', label: '(UTC+01:00) Paris' },
		{ value: 'Europe/Berlin', label: '(UTC+01:00) Berlin' },
		{ value: 'Europe/Moscow', label: '(UTC+03:00) Moscow' },
		{ value: 'Asia/Dubai', label: '(UTC+04:00) Dubai' },
		{ value: 'Asia/Kolkata', label: '(UTC+05:30) India' },
		{ value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok' },
		{ value: 'Asia/Singapore', label: '(UTC+08:00) Singapore' },
		{ value: 'Asia/Shanghai', label: '(UTC+08:00) Shanghai' },
		{ value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo' },
		{ value: 'Asia/Seoul', label: '(UTC+09:00) Seoul' },
		{ value: 'Australia/Sydney', label: '(UTC+10:00) Sydney' },
		{ value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland' }
	]

	let name = $state('')
	let image = $state<string | null>(null)
	let imageFile = $state<File | null>(null)
	let timezone = $state('Asia/Seoul')
	let loading = $state(false)
	let fileInput: HTMLInputElement

	$effect(() => {
		name = data.user.name ?? ''
		image = data.user.image ?? null
		timezone = data.user.timezone ?? 'Asia/Seoul'
	})

	const processImageClient = async (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = async (e) => {
				const img = new Image()
				img.onload = () => {
					const canvas = document.createElement('canvas')
					const size = 128
					canvas.width = size
					canvas.height = size
					const ctx = canvas.getContext('2d')
					if (!ctx) {
						reject(new Error('Failed to get canvas context'))
						return
					}

					const minDim = Math.min(img.width, img.height)
					const sx = (img.width - minDim) / 2
					const sy = (img.height - minDim) / 2

					ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
					resolve(canvas.toDataURL('image/webp', 0.85))
				}
				img.onerror = () => reject(new Error('Failed to load image'))
				img.src = e.target?.result as string
			}
			reader.onerror = () => reject(new Error('Failed to read file'))
			reader.readAsDataURL(file)
		})
	}

	const handleImageChange = async (e: Event) => {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		imageFile = file
		const reader = new FileReader()
		reader.onload = (event) => {
			image = event.target?.result as string
		}
		reader.readAsDataURL(file)
	}

	const handleRemoveImage = () => {
		image = null
		imageFile = null
		if (fileInput) {
			fileInput.value = ''
		}
	}

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault()
		loading = true

		try {
			let imageToUpdate: string | null | undefined = undefined

			if (imageFile) {
				imageToUpdate = await processImageClient(imageFile)
			} else if (image === null && data.user.image) {
				imageToUpdate = null
			}

			const updateData: { name: string; image?: string | null; timezone?: string } = { name: name.trim() }
			if (imageToUpdate !== undefined) {
				updateData.image = imageToUpdate
			}
			if (timezone !== data.user.timezone) {
				updateData.timezone = timezone
			}

			const result = await authClient.updateUser(updateData)

			if (result.error) {
				toast.error(m.profile_updateFailed())
			} else {
				toast.success(m.profile_updateSuccess())
				imageFile = null
				if (fileInput) fileInput.value = ''
				await invalidate('auth:session')
			}
		} catch {
			toast.error(m.profile_updateFailed())
		}

		loading = false
	}
</script>

<svelte:head>
	<title>{m.profile_title()}</title>
</svelte:head>

<Toaster position="top-right" richColors />

<div class="container mx-auto max-w-lg px-3 py-8">
	<div class="mb-6">
		<Button variant="ghost" href="/my-schedule" class="gap-2">
			<ArrowLeft class="size-3" />
			{m.header_myCalendar()}
		</Button>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>{m.profile_title()}</Card.Title>
		</Card.Header>
		<form onsubmit={handleSubmit} class="flex flex-col gap-3">
			<Card.Content class="space-y-3">
				<div class="space-y-2">
					<Label>{m.profile_profileImage()}</Label>
					<div class="flex items-center gap-3">
						<div class="relative">
							{#if image}
								<img
									src={image}
									alt="Profile"
									class="size-16 rounded-full border border-border object-cover"
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onclick={handleRemoveImage}
									class="absolute -right-1 -top-1 size-5 rounded-full"
								>
									<X class="size-3" />
								</Button>
							{:else}
								<div
									class="flex size-16 items-center justify-center rounded-full border border-border bg-muted"
								>
									<Camera class="size-6 text-muted-foreground" />
								</div>
							{/if}
						</div>
						<div>
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp,image/gif"
								onchange={handleImageChange}
								class="hidden"
								bind:this={fileInput}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={() => fileInput?.click()}
								disabled={loading}
							>
								{m.profile_changeImage()}
							</Button>
						</div>
					</div>
				</div>
				<div class="space-y-2">
					<Label for="email">{m.common_email()}</Label>
					<Input id="email" type="email" value={data.user.email} disabled />
				</div>
				<div class="space-y-2">
					<Label for="name">{m.common_name()}</Label>
					<Input id="name" type="text" bind:value={name} required disabled={loading} />
				</div>
				<div class="space-y-2">
					<Label>{m.profile_timezone()}</Label>
					<Select.Root type="single" bind:value={timezone}>
						<Select.Trigger class="w-full" disabled={loading}>
							{TIMEZONES.find((tz) => tz.value === timezone)?.label ?? timezone}
						</Select.Trigger>
						<Select.Content>
							{#each TIMEZONES as tz}
								<Select.Item value={tz.value}>{tz.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<p class="text-xs text-muted-foreground">{m.profile_timezoneDescription()}</p>
				</div>
			</Card.Content>
			<Card.Footer>
				<Button
					type="submit"
					disabled={loading ||
						(name.trim() === data.user.name && image === data.user.image && timezone === data.user.timezone)}
				>
					{#if loading}
						<Loader class="mr-2 size-3 animate-spin" />
					{/if}
					{m.common_save()}
				</Button>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
