<script>
  import { fly } from 'svelte/transition';

  // DESCRIPTION
  // Simple component that appears at the top of the screen and has to be closed manually. Comes in three flavors: error (red), success (green), and notification (blue). Unlike Dialogue.svelte, it doesn't emit any events to the parent

  // INPUTS
  export let showModal = false;
  export let modalType = 'notification';
  export let modalText = 'Put something in me';
</script>

<style>
  .modal {
    @apply fixed inset-y-0 z-50 flex overflow-y-hidden bg-gray-100;
    left: 37%;
    min-width: 25%;
    max-width: 25%;
    max-height: 12%;
  }
  .notification {
    @apply border-blue-400 text-blue-400;
  }
  .notification-close:hover {
    @apply bg-blue-200;
  }
  .error {
    @apply border-red-400 text-red-400;
  }
  .error-close:hover {
    @apply bg-red-200;
  }
  .success {
    @apply border-green-400 text-green-400;
  }
  .success-close:hover {
    @apply bg-green-200;
  }
</style>

{#if showModal}
  <div class="modal" transition:fly={{ y: -200, duration: 500 }}>
    <div
      class="relative flex flex-col items-center justify-center w-full p-4 bg-gray-100 border-2 rounded shadow-md font-quantico"
      class:notification={modalType === 'notification'}
      class:error={modalType === 'error'}
      class:success={modalType === 'success'}>
      <slot>
        <p>{modalText}</p>
      </slot>
      <span class="absolute top-0 bottom-0 right-0 p-2">
        <svg
          on:click={() => (showModal = false)}
          class="w-6 h-6 fill-current"
          class:notification-close={modalType === 'notification'}
          class:error-close={modalType === 'error'}
          class:success-close={modalType === 'success'}
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
{/if}
