<script lang="ts">
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '../widgets/header.svelte';
	import QueryProvider from '$lib/providers/query-provider.svelte';
	import './layout.css';

	let { children, data } = $props();
	const siteName = 'Calendar';
	const siteUrl = 'https://calendar.gumyo.net';
	const defaultTitle = 'Calendar - Smart Schedule Management Made Simple';
	const defaultDescription = 'Calendar is a modern calendar application that lets you effortlessly manage your schedule with an intuitive drag-and-drop interface. Keep track of team meetings, project deadlines, workshops, and all your events at a glance. Features include recurring events, dark mode support, and real-time synchronization.';
	const defaultKeywords = 'calendar, schedule management, scheduler, planner, team calendar, shared calendar, drag and drop calendar, work schedule, meeting schedule, project management, time management, productivity tool, schedule sharing, recurring events, reminders, event planning, task management';
	const ogImage = `${siteUrl}/calendar_explain.png`;
	const twitterHandle = '@gumyoincirno';
	const pageTitle = $derived(page.data?.title ? `${page.data.title} | ${siteName}` : defaultTitle);
	const pageDescription = $derived(page.data?.description as string || defaultDescription);
	const pageKeywords = $derived(page.data?.keywords as string || defaultKeywords);
	const canonicalUrl = $derived(`${siteUrl}${page.url?.pathname || ''}`);
</script>

<ModeWatcher />

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<meta name="keywords" content={pageKeywords} />
	<meta name="author" content="Hyunseok Byun" />
	<meta name="generator" content="SvelteKit" />
	<meta name="application-name" content={siteName} />

	<meta
		name="theme-color"
		content="#8b5cf6"
		media="(prefers-color-scheme: light)"
	/>

	<meta
		name="theme-color"
		content="#7c3aed"
		media="(prefers-color-scheme: dark)"
	/>

	<meta name="color-scheme" content="light dark" />

	<meta
		name="robots"
		content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
	/>

	<meta
		name="googlebot"
		content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
	/>

	<meta name="bingbot" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="icon" href={favicon} />
	<link rel="icon" type="image/svg+xml" href={favicon} />

	<link
		rel="apple-touch-icon"
		sizes="180x180"
		href="/apple-touch-icon.png"
	/>

	<link rel="mask-icon" href={favicon} color="#8b5cf6" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={pageTitle} />

	<meta
		property="og:description"
		content={pageDescription}
	/>

	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta
		property="og:image:alt"
		content="Calendar - Intuitive monthly calendar view with event management interface"
	/>

	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:locale:alternate" content="ko_KR" />
	<meta property="og:locale:alternate" content="ja_JP" />
	<meta property="og:locale:alternate" content="zh_CN" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={twitterHandle} />
	<meta name="twitter:creator" content={twitterHandle} />
	<meta name="twitter:title" content={pageTitle} />

	<meta
		name="twitter:description"
		content={pageDescription}
	/>

	<meta name="twitter:image" content={ogImage} />

	<meta
		name="twitter:image:alt"
		content="Calendar - Intuitive monthly calendar view with event management interface"
	/>

	<meta name="format-detection" content="telephone=no" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />

	<meta
		name="apple-mobile-web-app-status-bar-style"
		content="default"
	/>

	<meta
		name="apple-mobile-web-app-title"
		content={siteName}
	/>

	<link rel="dns-prefetch" href="//fonts.googleapis.com" />

	<link
		rel="preconnect"
		href="https://fonts.googleapis.com"
		crossorigin="anonymous"
	/>

	{@html `<script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "${siteName}",
        "url": "${siteUrl}",
        "description": "${defaultDescription}",
        "applicationCategory": "ProductivityApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "featureList": [
            "Drag and drop event management",
            "Monthly, weekly, and daily views",
            "Recurring event support",
            "Dark mode support",
            "Real-time synchronization",
            "Team calendar sharing"
        ],
        "screenshot": "${ogImage}",
        "softwareVersion": "1.0.0",
        "author": {
            "@type": "Person",
            "name": "Hyunseok Byun"
        },
        "publisher": {
            "@type": "Person",
            "name": "Hyunseok Byun"
        },
        "inLanguage": ["en", "ko", "ja", "zh"],
        "isAccessibleForFree": true
    }
    </script>`}

	{@html `<script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "${siteUrl}"
            }
        ]
    }
    </script>`}
</svelte:head>

<QueryProvider>
	<Header sessionInfo={data.sessionInfo} />
	{@render children()}
</QueryProvider>
<div style="display:none">
	{#each locales as locale}
		<a
			href={localizeHref(page.url.pathname, { locale })}
		>
			{locale}
		</a>
	{/each}
</div>
