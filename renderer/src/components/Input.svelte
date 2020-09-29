<script>
  // INPUTS
  export let label;
  export let type;
  export let value;
  export let displayError = false;
  export let displayInfo = false;
  export let error = 'Placeholder text';
  export let info = 'Placeholder text';
</script>

<style>
  label {
    @apply block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase;
  }
  input {
    @apply block w-full px-4 py-2 text-gray-700 bg-gray-200 border rounded outline-none;
  }
  textarea {
    @apply block w-full h-40 px-4 py-2 overflow-y-auto text-gray-700 bg-gray-200 border rounded outline-none resize-none;
  }
</style>

<label>{label}</label>
{#if type === 'text'}
  <input type="text" bind:value class:border-red-500={displayError} />
{:else if type === 'number'}
  <input type="number" bind:value class:border-red-500={displayError} min="1" />
{:else if type === 'textarea'}
  <textarea class:border-red-500={displayError} type="text" bind:value />
{/if}
{#if displayError}
  <p class="error-text" class:visible={displayError} class:invisible={!displayError}>{error}</p>
{:else}
  <p class="info-text" class:visible={displayInfo} class:invisible={!displayInfo}>{info}</p>
{/if}
