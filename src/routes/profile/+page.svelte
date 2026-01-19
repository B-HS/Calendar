<script lang="ts">
    import { invalidate } from '$app/navigation'
    import { Button } from '$lib/components/ui/button'
    import * as Card from '$lib/components/ui/card'
    import { Input } from '$lib/components/ui/input'
    import { Label } from '$lib/components/ui/label'
    import * as Select from '$lib/components/ui/select'
    import { Loader, ArrowLeft, Camera, X } from '@lucide/svelte'
    import { localeStore } from '$lib/i18n'
    import { toast, Toaster } from 'svelte-sonner'

    const { data } = $props()

    const t = $derived(localeStore.t)

    let name = $state('')
    let image = $state<string | null>(null)
    let imageFile = $state<File | null>(null)
    let loading = $state(false)
    let timezoneLoading = $state(false)
    let selectedTimezone = $state('')
    let fileInput: HTMLInputElement

    const timezones = [
        { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
        { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
        { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time' },
        { value: 'America/Denver', label: '(UTC-07:00) Mountain Time' },
        { value: 'America/Chicago', label: '(UTC-06:00) Central Time' },
        { value: 'America/New_York', label: '(UTC-05:00) Eastern Time' },
        { value: 'America/Sao_Paulo', label: '(UTC-03:00) Sao Paulo' },
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
        { value: 'Australia/Sydney', label: '(UTC+11:00) Sydney' },
        { value: 'Pacific/Auckland', label: '(UTC+13:00) Auckland' },
    ]

    $effect(() => {
        name = data.user.name ?? ''
        image = data.user.image ?? null
        selectedTimezone = data.user.timezone ?? 'Asia/Seoul'
    })

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

        const formData = new FormData()
        formData.append('name', name)
        if (imageFile) {
            formData.append('imageFile', imageFile)
        } else if (image === null) {
            formData.append('removeImage', 'true')
        }

        const res = await fetch('?/updateProfile', {
            method: 'POST',
            body: formData,
        })

        const result = await res.json()

        if (result.type === 'success') {
            toast.success(t.profile.updateSuccess)
            imageFile = null
            if (fileInput) fileInput.value = ''
            await Promise.all([invalidate('app:profile'), invalidate('auth:session')])
        } else {
            toast.error(t.profile.updateFailed)
        }

        loading = false
    }

    const handleTimezoneChange = async (value: string | undefined) => {
        if (!value || value === selectedTimezone) return

        timezoneLoading = true
        selectedTimezone = value

        const formData = new FormData()
        formData.append('timezone', value)

        const res = await fetch('?/updateTimezone', {
            method: 'POST',
            body: formData,
        })

        const result = await res.json()

        if (result.type === 'success') {
            toast.success(t.profile.updateSuccess)
            await invalidate('app:profile')
        } else {
            toast.error(t.profile.updateFailed)
        }

        timezoneLoading = false
    }
</script>

<svelte:head>
    <title>{t.profile.title}</title>
</svelte:head>

<Toaster position="top-right" richColors />

<div class="container max-w-lg mx-auto py-8 px-3">
    <div class="mb-6">
        <Button variant="ghost" href="/my-schedule" class="gap-2">
            <ArrowLeft class="size-3" />
            {t.header.myCalendar}
        </Button>
    </div>

    <Card.Root>
        <Card.Header>
            <Card.Title>{t.profile.title}</Card.Title>
        </Card.Header>
        <form onsubmit={handleSubmit} class="flex flex-col gap-3">
            <Card.Content class="space-y-3">
                <div class="space-y-2">
                    <Label>{t.profile.profileImage}</Label>
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            {#if image}
                                <img src={image} alt="Profile" class="size-16 rounded-full object-cover border border-border" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onclick={handleRemoveImage}
                                    class="absolute -top-1 -right-1 size-5 rounded-full">
                                    <X class="size-3" />
                                </Button>
                            {:else}
                                <div class="size-16 rounded-full bg-muted flex items-center justify-center border border-border">
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
                                bind:this={fileInput} />
                            <Button type="button" variant="outline" size="sm" onclick={() => fileInput?.click()} disabled={loading}>
                                {t.profile.changeImage}
                            </Button>
                        </div>
                    </div>
                </div>
                <div class="space-y-2">
                    <Label for="email">{t.common.email}</Label>
                    <Input id="email" type="email" value={data.user.email} disabled />
                </div>
                <div class="space-y-2">
                    <Label for="name">{t.common.name}</Label>
                    <Input id="name" type="text" bind:value={name} required disabled={loading} />
                </div>
            </Card.Content>
            <Card.Footer>
                <Button type="submit" disabled={loading || (name.trim() === data.user.name && image === data.user.image)}>
                    {#if loading}
                        <Loader class="mr-2 size-3 animate-spin" />
                    {/if}
                    {t.common.save}
                </Button>
            </Card.Footer>
        </form>
    </Card.Root>

    <Card.Root class="mt-4">
        <Card.Header>
            <Card.Title>{t.profile.timezone}</Card.Title>
            <Card.Description>{t.profile.timezoneDescription}</Card.Description>
        </Card.Header>
        <Card.Content>
            <Select.Root type="single" value={selectedTimezone} onValueChange={handleTimezoneChange}>
                <Select.Trigger class="w-full" disabled={timezoneLoading}>
                    {#if timezoneLoading}
                        <Loader class="mr-2 size-3 animate-spin" />
                    {/if}
                    {timezones.find(tz => tz.value === selectedTimezone)?.label ?? selectedTimezone}
                </Select.Trigger>
                <Select.Content>
                    {#each timezones as tz}
                        <Select.Item value={tz.value}>{tz.label}</Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
        </Card.Content>
    </Card.Root>
</div>
