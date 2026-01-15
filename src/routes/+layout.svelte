<script lang="ts">
    import { ModeWatcher } from 'mode-watcher'
    import favicon from '$lib/assets/favicon.svg'
    import Header from '../widgets/header.svelte'
    import './layout.css'

    let { children, data } = $props()
</script>

<ModeWatcher />
<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Header sessionInfo={data.sessionInfo} />
{@render children()}
