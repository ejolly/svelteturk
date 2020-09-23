<script>
  // INPUTS
  export let label;
  export let type;
  export let value;
  export let error;
</script>

<style>
  label {
    @apply block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase;
  }
  input {
    @apply block w-full px-4 py-2 text-gray-700 bg-gray-200 border rounded outline-none;
  }
  textarea {
    @apply block w-full h-40 px-4 py-2 mb-2 overflow-y-auto text-gray-700 bg-gray-200 border rounded outline-none resize-none;
  }
</style>

<label>{label}</label>
{#if type === 'text'}
  <input type="text" bind:value class:border-red-500={error} />
{:else if type === 'number'}
  <input type="number" bind:value class:border-red-500={error} />
{:else if type === 'textarea'}<textarea class:border-red-500={error} type="text" bind:value />{/if}
<p class="error-text" class:visible={error} class:invisible={!error}>{error}</p>
