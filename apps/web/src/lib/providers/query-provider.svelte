<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
	}

	let { children }: Props = $props()

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5,
				gcTime: 1000 * 60 * 30,
				retry: 1,
				refetchOnWindowFocus: false
			}
		}
	})
</script>

<QueryClientProvider client={queryClient}>
	{@render children()}
</QueryClientProvider>
