<script lang="ts">
	import { MonthCalendar, type CalendarEvent, type Locale } from '$widgets/calendar'
	import { Button } from '$lib/components/ui/button'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { onMount } from 'svelte'
	import { fly, fade, blur } from 'svelte/transition'
	import {
		CalendarDays,
		Globe,
		Smartphone,
		CloudUpload,
		Check,
		ArrowRight,
		MousePointerClick,
		Link,
		Sparkles
	} from '@lucide/svelte'

	const locale = $derived(getLocale() as Locale)

	let mounted = $state(false)
	let heroVisible = $state(false)
	let demoVisible = $state(false)
	let featuresVisible = $state(false)
	let howToUseVisible = $state(false)
	let pricingVisible = $state(false)

	const today = new Date()
	const demoEvents: CalendarEvent[] = [
		{
			uid: 'demo-1',
			summary: 'Team Meeting',
			dtstart: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
			dtend: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
			isAllDay: false,
			color: 'bg-blue-500'
		},
		{
			uid: 'demo-2',
			summary: 'Project Review',
			dtstart: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 0),
			dtend: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 16, 0),
			isAllDay: false,
			color: 'bg-green-500'
		},
		{
			uid: 'demo-3',
			summary: 'Workshop',
			dtstart: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
			dtend: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
			isAllDay: true,
			color: 'bg-purple-500'
		},
		{
			uid: 'demo-4',
			summary: 'Deadline',
			dtstart: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 18, 0),
			dtend: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 19, 0),
			isAllDay: false,
			color: 'bg-red-500'
		}
	]

	let events = $state<CalendarEvent[]>(demoEvents)

	const features = $derived([
		{ icon: MousePointerClick, title: m.landing_feature1Title(), description: m.landing_feature1Description() },
		{ icon: Link, title: m.landing_feature2Title(), description: m.landing_feature2Description() },
		{ icon: Globe, title: m.landing_feature4Title(), description: m.landing_feature4Description() },
		{ icon: Smartphone, title: m.landing_feature5Title(), description: m.landing_feature5Description() },
		{ icon: CloudUpload, title: m.landing_feature6Title(), description: m.landing_feature6Description() }
	])

	const steps = $derived([
		{ number: '01', title: m.landing_step1Title(), description: m.landing_step1Description() },
		{ number: '02', title: m.landing_step2Title(), description: m.landing_step2Description() },
		{ number: '03', title: m.landing_step3Title(), description: m.landing_step3Description() }
	])

	const pricingFeatures = $derived([
		m.landing_pricingFeature1(),
		m.landing_pricingFeature2(),
		m.landing_pricingFeature3(),
		m.landing_pricingFeature4()
	])

	onMount(() => {
		document.body.classList.add('js-ready')
		requestAnimationFrame(() => {
			mounted = true
			heroVisible = true
		})

		const observerCallback = (entries: IntersectionObserverEntry[]) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const id = entry.target.id
					if (id === 'demo-section') demoVisible = true
					if (id === 'features-section') featuresVisible = true
					if (id === 'how-to-use-section') howToUseVisible = true
					if (id === 'pricing-section') pricingVisible = true
				}
			})
		}

		const observer = new IntersectionObserver(observerCallback, {
			threshold: 0.1,
			rootMargin: '0px 0px -50px 0px'
		})

		const sections = document.querySelectorAll('.observe-section')
		sections.forEach((section) => observer.observe(section))

		return () => observer.disconnect()
	})

	const scrollToDemo = () => {
		document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })
	}
</script>

<svelte:head>
	<title>Global Calendar - {m.landing_heroSubtitle()}</title>
	<meta name="description" content={m.landing_heroDescription()} />
</svelte:head>

<style>
	.animate-item {
		opacity: 1;
		transform: none;
	}
	:global(body.js-ready) .animate-item {
		opacity: 0;
		transform: translateY(20px);
		transition: opacity 0.6s ease-out, transform 0.6s ease-out;
	}
	:global(body.js-ready) .animate-item.animate-slide-left {
		transform: translateX(-20px);
	}
	:global(body.js-ready) .animate-item.animate-show {
		opacity: 1;
		transform: translateY(0) translateX(0);
	}
	.animate-delay-1 { transition-delay: 100ms; }
	.animate-delay-2 { transition-delay: 200ms; }
	.animate-delay-3 { transition-delay: 300ms; }
	.animate-delay-4 { transition-delay: 400ms; }
</style>

<main class="min-h-screen">
	<section class="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background px-4 py-20 sm:py-32">
		<div class="absolute inset-0 overflow-hidden">
			<div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"></div>
		</div>

		<div class="relative mx-auto max-w-5xl text-center">
			<div class="animate-item mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm backdrop-blur-sm" class:animate-show={mounted}>
				<Sparkles class="size-4 text-primary" />
				<span class="text-muted-foreground">100% Free Forever</span>
			</div>

			<h1
				class="animate-item animate-delay-1 mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl"
				class:animate-show={mounted}
			>
				{m.landing_heroTitle()}
			</h1>

			<p
				class="animate-item animate-delay-2 mb-4 text-xl text-foreground sm:text-2xl lg:text-3xl"
				class:animate-show={mounted}
			>
				{m.landing_heroSubtitle()}
			</p>

			<p
				class="animate-item animate-delay-3 mx-auto mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg"
				class:animate-show={mounted}
			>
				{m.landing_heroDescription()}
			</p>

			<div
				class="animate-item animate-delay-4 flex flex-col items-center justify-center gap-4 sm:flex-row"
				class:animate-show={mounted}
			>
				<Button size="lg" class="group h-12 px-8 text-base" onclick={scrollToDemo}>
					{m.landing_tryCta()}
					<ArrowRight class="ml-2 size-5 transition-transform group-hover:translate-x-1" />
				</Button>
				<Button variant="outline" size="lg" class="h-12 px-8 text-base" href="/register">
					{m.landing_getStartedCta()}
				</Button>
			</div>
		</div>
	</section>

	<section id="demo-section" class="observe-section bg-muted/30 px-4 py-20">
		<div class="mx-auto max-w-6xl">
			<div class="animate-item mb-12 text-center" class:animate-show={demoVisible}>
				<h2 class="mb-4 text-3xl font-bold sm:text-4xl">{m.landing_demoTitle()}</h2>
				<p class="text-muted-foreground">{m.landing_demoDescription()}</p>
			</div>

			<div
				class="animate-item animate-delay-2 overflow-hidden rounded-xl border bg-background shadow-2xl"
				class:animate-show={demoVisible}
			>
				<div class="h-[500px] sm:h-[600px]">
					<MonthCalendar bind:events {locale} bordered={false} />
				</div>
			</div>
		</div>
	</section>

	<section id="features-section" class="observe-section px-4 py-20">
		<div class="mx-auto max-w-6xl">
			<div class="animate-item mb-16 text-center" class:animate-show={featuresVisible}>
				<h2 class="mb-4 text-3xl font-bold sm:text-4xl">{m.landing_featuresTitle()}</h2>
				<p class="text-muted-foreground">{m.landing_featuresSubtitle()}</p>
			</div>

			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each features as feature, i}
					<div
						class="animate-item group rounded-xl border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
						class:animate-show={featuresVisible}
						style="transition-delay: {100 + i * 80}ms"
					>
						<div class="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
							<feature.icon class="size-6 text-primary" />
						</div>
						<h3 class="mb-2 text-lg font-semibold">{feature.title}</h3>
						<p class="text-sm text-muted-foreground">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section id="how-to-use-section" class="observe-section bg-muted/30 px-4 py-20">
		<div class="mx-auto max-w-4xl">
			<div class="animate-item mb-16 text-center" class:animate-show={howToUseVisible}>
				<h2 class="mb-4 text-3xl font-bold sm:text-4xl">{m.landing_howToUseTitle()}</h2>
				<p class="text-muted-foreground">{m.landing_howToUseSubtitle()}</p>
			</div>

			<div class="relative">
				<div class="absolute left-8 top-0 hidden h-full w-px bg-border sm:block"></div>

				<div class="space-y-12">
					{#each steps as step, i}
						<div
							class="animate-item animate-slide-left relative flex gap-6"
							class:animate-show={howToUseVisible}
							style="transition-delay: {150 + i * 150}ms"
						>
							<div class="relative z-10 flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
								{step.number}
							</div>
							<div class="pt-3">
								<h3 class="mb-2 text-xl font-semibold">{step.title}</h3>
								<p class="text-muted-foreground">{step.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section id="pricing-section" class="observe-section px-4 py-20">
		<div class="mx-auto max-w-lg">
			<div class="animate-item mb-12 text-center" class:animate-show={pricingVisible}>
				<h2 class="mb-4 text-3xl font-bold sm:text-4xl">{m.landing_pricingTitle()}</h2>
				<p class="text-muted-foreground">{m.landing_pricingSubtitle()}</p>
			</div>

			<div
				class="animate-item animate-delay-2 rounded-2xl border-2 border-primary bg-card p-8 text-center shadow-xl"
				class:animate-show={pricingVisible}
			>
				<div class="mb-2 text-sm font-medium text-primary">Forever Free</div>
				<div class="mb-2 text-5xl font-bold">{m.landing_pricingFree()}</div>
				<div class="mb-8 text-muted-foreground">{m.landing_pricingDescription()}</div>

				<div class="mb-8 space-y-4 text-left">
					{#each pricingFeatures as feature, i}
						<div
							class="animate-item animate-slide-left flex items-center gap-3"
							class:animate-show={pricingVisible}
							style="transition-delay: {400 + i * 80}ms"
						>
							<div class="flex size-6 items-center justify-center rounded-full bg-primary/10">
								<Check class="size-4 text-primary" />
							</div>
							<span>{feature}</span>
						</div>
					{/each}
				</div>

				<Button class="w-full" size="lg" href="/register">
					{m.landing_getStartedCta()}
					<ArrowRight class="ml-2 size-5" />
				</Button>
			</div>
		</div>
	</section>

	<footer class="border-t bg-muted/30 px-4 py-8">
		<div class="mx-auto max-w-6xl text-center">
			<div class="mb-4 flex items-center justify-center gap-2">
				<CalendarDays class="size-6 text-primary" />
				<span class="text-lg font-semibold">Global Calendar</span>
			</div>
			<p class="text-sm text-muted-foreground">{m.landing_footerDescription()}</p>
		</div>
	</footer>
</main>
