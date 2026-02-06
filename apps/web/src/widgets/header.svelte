<script lang="ts">
    import { goto, invalidate } from '$app/navigation'
    import { authClient } from '$lib/auth-client'

    interface Session {
        user: {
            id: string
            name: string
            email: string
            image?: string | null
        }
    }
    import Button from '$lib/components/ui/button/button.svelte'
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
    import * as Dialog from '$lib/components/ui/dialog'
    import * as m from '$lib/paraglide/messages'
    import { locales, getLocale, localizeHref, type Locale } from '$lib/paraglide/runtime'
    import { Calendar, User, Globe, LogOut, Check, Sun, Moon, Monitor } from '@lucide/svelte'
    import { userPrefersMode, setMode } from 'mode-watcher'

    type ThemeMode = 'system' | 'light' | 'dark'
    const THEME_OPTIONS: ThemeMode[] = ['system', 'light', 'dark']

    let { sessionInfo }: { sessionInfo: Session | null } = $props()

    let languageModalOpen = $state(false)
    let themeModalOpen = $state(false)

    const handleSignOut = async () => {
        await authClient.signOut()
        await invalidate('auth:session')
    }

    const handleLanguageChange = (lang: Locale) => {
        languageModalOpen = false
        window.location.href = localizeHref(window.location.pathname, { locale: lang })
    }

    const handleThemeChange = (theme: ThemeMode) => {
        setMode(theme)
        themeModalOpen = false
    }

    const getLanguageLabel = (lang: Locale) => {
        const labels: Record<Locale, string> = {
            ko: '한국어',
            en: 'English',
            ja: '日本語',
            zh: '中文'
        }
        return labels[lang]
    }

    const getThemeLabel = (theme: ThemeMode) => {
        if (theme === 'system') return m.themes_system()
        if (theme === 'light') return m.themes_light()
        return m.themes_dark()
    }

    const getThemeIcon = (theme: ThemeMode) => {
        if (theme === 'light') return Sun
        if (theme === 'dark') return Moon
        return Monitor
    }

    const currentLocale = $derived(getLocale())
    const currentTheme = $derived((userPrefersMode.current ?? 'system') as ThemeMode)
    const CurrentThemeIcon = $derived(getThemeIcon(currentTheme))
</script>

<header class="flex justify-between items-center p-2 border-b border-border">
    <a
        href="/"
        class="border border-border bg-foreground size-10 p-0.5 px-1.5 text-background flex justify-end-safe items-end-safe rounded cursor-pointer">
        Ca
    </a>
    <div class="flex items-center gap-1.5">
        {#if sessionInfo?.user.name}
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                        <div
                            {...props}
                            class="flex items-center justify-center size-10 rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-ring transition-all cursor-pointer">
                            {#if sessionInfo.user.image}
                                <img src={sessionInfo.user.image} alt={sessionInfo.user.name} class="size-full object-cover" />
                            {:else}
                                <User class="size-5 text-muted-foreground" />
                            {/if}
                        </div>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="w-48">
                    <DropdownMenu.Item onclick={() => goto('/my-schedule')} class="cursor-pointer">
                        <Calendar class="mr-2 size-5" />
                        {m.header_myCalendar()}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => goto('/profile')} class="cursor-pointer">
                        <User class="mr-2 size-5" />
                        {m.header_editProfile()}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => (languageModalOpen = true)} class="cursor-pointer">
                        <Globe class="mr-2 size-5" />
                        {m.header_changeLanguage()}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onclick={() => (themeModalOpen = true)} class="cursor-pointer">
                        <CurrentThemeIcon class="mr-2 size-5" />
                        {m.header_changeTheme()}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onclick={handleSignOut} class="cursor-pointer text-destructive">
                        <LogOut class="mr-2 size-5" />
                        {m.common_logout()}
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        {:else}
            <Button variant="ghost" onclick={() => (languageModalOpen = true)}>
                <Globe class="size-5" />
            </Button>
            <Button variant="ghost" onclick={() => (themeModalOpen = true)}>
                <CurrentThemeIcon class="size-5" />
            </Button>
            <Button variant="outline" href="/login">{m.common_login()}</Button>
            <Button href="/register">{m.common_register()}</Button>
        {/if}
    </div>
</header>

<Dialog.Root bind:open={languageModalOpen}>
    <Dialog.Content class="sm:max-w-sm">
        <Dialog.Header>
            <Dialog.Title>{m.header_selectLanguage()}</Dialog.Title>
        </Dialog.Header>
        <div class="flex flex-col gap-1">
            {#each locales as lang}
                <button
                    class="flex items-center justify-between w-full px-3 py-2 text-left rounded-md hover:bg-muted transition-colors"
                    onclick={() => handleLanguageChange(lang)}>
                    <span>{getLanguageLabel(lang)}</span>
                    {#if currentLocale === lang}
                        <Check class="size-5 text-primary" />
                    {/if}
                </button>
            {/each}
        </div>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={themeModalOpen}>
    <Dialog.Content class="sm:max-w-sm">
        <Dialog.Header>
            <Dialog.Title>{m.header_selectTheme()}</Dialog.Title>
        </Dialog.Header>
        <div class="flex flex-col gap-1">
            {#each THEME_OPTIONS as theme}
                {@const ThemeIcon = getThemeIcon(theme)}
                <button
                    class="flex items-center justify-between w-full px-3 py-2 text-left rounded-md hover:bg-muted transition-colors"
                    onclick={() => handleThemeChange(theme)}>
                    <span class="flex items-center gap-2">
                        <ThemeIcon class="size-5" />
                        {getThemeLabel(theme)}
                    </span>
                    {#if currentTheme === theme}
                        <Check class="size-5 text-primary" />
                    {/if}
                </button>
            {/each}
        </div>
    </Dialog.Content>
</Dialog.Root>
