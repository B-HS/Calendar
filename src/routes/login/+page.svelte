<script lang="ts">
    import { goto, invalidate } from '$app/navigation'
    import { authClient } from '$lib/auth-client'
    import { Button } from '$lib/components/ui/button'
    import * as Card from '$lib/components/ui/card'
    import { Input } from '$lib/components/ui/input'
    import { Label } from '$lib/components/ui/label'
    import Google from '$lib/icon/google.svelte'
    import { Loader, Loader2 } from '@lucide/svelte'
    import { localeStore } from '$lib/i18n'

    let email = $state('')
    let password = $state('')
    let error = $state('')
    let loading = $state(false)
    let googleLoading = $state(false)

    const t = $derived(localeStore.t)

    const handleGoogleLogin = async () => {
        googleLoading = true
        await authClient.signIn.social({ provider: 'google' })
    }

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault()
        error = ''
        loading = true

        const result = await authClient.signIn.email({
            email,
            password,
        })

        if (result.error) {
            error = result.error.message ?? t.auth.loginFailed
            loading = false
            return
        }

        await invalidate('auth:session')
        goto('/')
    }
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-3">
    <Card.Root class="w-full max-w-md">
        <Card.Header class="space-y-1">
            <Card.Title class="text-2xl font-bold">{t.auth.loginTitle}</Card.Title>
        </Card.Header>
        <form onsubmit={handleSubmit} class="flex flex-col gap-3">
            <Card.Content class="space-y-3">
                {#if error}
                    <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                    </div>
                {/if}
                <div class="space-y-2">
                    <Label for="email">{t.common.email}</Label>
                    <Input id="email" type="email" placeholder="name@example.com" bind:value={email} required disabled={loading} />
                </div>
                <div class="space-y-2">
                    <Label for="password">{t.common.password}</Label>
                    <Input id="password" type="password" placeholder="••••••••" bind:value={password} required disabled={loading} />
                </div>
            </Card.Content>
            <Card.Footer class="flex flex-col space-y-3">
                <Button type="submit" class="w-full" disabled={loading}>
                    {#if loading}
                        <Loader class="mr-2 size-3 animate-spin" />
                        {t.auth.loginLoading}
                    {:else}
                        {t.common.login}
                    {/if}
                </Button>
                <Button type="button" variant="outline" class="w-full" onclick={handleGoogleLogin} disabled={googleLoading || loading}>
                    {#if googleLoading}
                        <Loader class="mr-2 size-3 animate-spin" />
                    {:else}
                        <Google />
                    {/if}
                    <span>{t.auth.loginWithGoogle}</span>
                </Button>
                <p class="text-center text-sm text-muted-foreground">
                    {t.auth.noAccount}
                    <a href="/register" class="text-primary underline-offset-3 hover:underline"> {t.common.register} </a>
                </p>
            </Card.Footer>
        </form>
    </Card.Root>
</div>
