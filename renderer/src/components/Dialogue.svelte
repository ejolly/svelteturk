<script>
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';

  // DESCRIPTION
  // Simple dialogue component that pops up in the center of the screen and blurs everything behind it. Can close itself by clicking the close icon. All display logic should be handled by the *parent* component. Can do this easily with a {#if} in the markup and by handling the on:close event emitted from this component

  // VARIABLES
  const dispatch = createEventDispatcher();
</script>

<style>
  .overlay {
    backdrop-filter: blur(1px);
  }
  .popup {
    max-height: 75%;
  }
</style>

<div
  class="fixed inset-0 z-50 flex overflow-auto bg-purple-100 bg-opacity-75 overlay"
  transition:fade={{ duration: 350 }}
  on:click|self={() => dispatch('close')}>
  <div
    class="relative flex flex-col items-center justify-center p-8 m-auto text-gray-800 bg-white border border-gray-500 rounded shadow-md font-quantico popup">
    <slot>
      <p>I'm inside a flex container. Put something in me!</p>
    </slot>
    <span class="absolute top-0 bottom-0 right-0 p-4">
      <svg
        on:click={() => dispatch('close')}
        class="w-6 h-6 fill-current text-grey-600 hover:text-purple-700 hover:bg-purple-200"
        role="button"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20">
        <title>Close</title>
        <path
          d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1
          1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2
          1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
      </svg>
    </span>
  </div>
</div>
