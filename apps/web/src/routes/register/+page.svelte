<script lang="ts">
    import { goto, invalidate } from '$app/navigation'
    import { authClient } from '$lib/auth-client'
    import { Button } from '$lib/components/ui/button'
    import * as Card from '$lib/components/ui/card'
    import { Input } from '$lib/components/ui/input'
    import { Label } from '$lib/components/ui/label'
    import { Loader } from '@lucide/svelte'
    import * as m from '$lib/paraglide/messages'

    let name = $state('')
    let email = $state('')
    let password = $state('')
    let confirmPassword = $state('')
    let error = $state('')
    let loading = $state(false)

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault()
        error = ''

        if (password !== confirmPassword) {
            error = m.auth_passwordMismatch()
            return
        }

        if (password.length < 8) {
            error = m.auth_passwordMinLength()
            return
        }

        loading = true

        const result = await authClient.signUp.email({
            email,
            password,
            name,
        })

        if (result.error) {
            error = result.error.message ?? m.auth_registerFailed()
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
            <Card.Title class="text-2xl font-bold">{m.auth_registerTitle()}</Card.Title>
            <Card.Description>{m.auth_registerDescription()}</Card.Description>
        </Card.Header>
        <form onsubmit={handleSubmit} class="flex flex-col gap-3">
            <Card.Content class="space-y-3">
                {#if error}
                    <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                    </div>
                {/if}
                <div class="space-y-2">
                    <Label for="name">{m.common_name()}</Label>
                    <Input id="name" type="text" placeholder="홍길동" bind:value={name} required disabled={loading} />
                </div>
                <div class="space-y-2">
                    <Label for="email">{m.common_email()}</Label>
                    <Input id="email" type="email" placeholder="name@example.com" bind:value={email} required disabled={loading} />
                </div>
                <div class="space-y-2">
                    <Label for="password">{m.common_password()}</Label>
                    <Input id="password" type="password" placeholder="••••••••" bind:value={password} required disabled={loading} />
                </div>
                <div class="space-y-2">
                    <Label for="confirmPassword">{m.common_passwordConfirm()}</Label>
                    <Input id="confirmPassword" type="password" placeholder="••••••••" bind:value={confirmPassword} required disabled={loading} />
                </div>
            </Card.Content>
            <Card.Footer class="flex flex-col space-y-3">
                <Button type="submit" class="w-full" disabled={loading}>
                    {#if loading}
                        <Loader class="mr-2 h-3 w-3 animate-spin" />
                        {m.auth_registerLoading()}
                    {:else}
                        {m.common_register()}
                    {/if}
                </Button>
                <p class="text-center text-sm text-muted-foreground">
                    {m.auth_hasAccount()}
                    <a href="/login" class="text-primary underline-offset-3 hover:underline"> {m.common_login()} </a>
                </p>
            </Card.Footer>
        </form>
    </Card.Root>
</div>
