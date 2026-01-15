<script lang="ts">
	let { testProps, secondProps } = $props();

	const testFunction = () => {
		console.log('this is test function', testProps, secondProps);
	};
</script>

<button onclick={testFunction}>Test Button</button>
