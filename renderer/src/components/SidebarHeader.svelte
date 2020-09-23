<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';

  // INPUTS
  export let mturkReady;
  export let live = false;

  // VARIABLES
  const dispatch = createEventDispatcher();
  // eslint-disable-next-line no-nested-ternary
  $: mode = mturkReady && window.navigator.onLine ? (live ? 'Live' : 'Sandbox') : 'Error';
  let showModal = false;
  let modalType;
  let modalText;

  // FUNCTIONS
  // Tell App.svelte to reinitialize Mturk object with different endpoint
  const switchMturkMode = () => {
    if (window.navigator.onLine) {
      live = !live;
      dispatch('switchMturkMode', {
        live,
      });
      if (live) {
        modalText = 'Svelte Turk is now in Live mode!';
        modalType = 'notification';
        showModal = true;
      }
    } else {
      modalText = 'No internet connectivity!';
      modalType = 'error';
      showModal = true;
    }
  };
</script>

<style>
  .switch {
    @apply relative inline-block align-middle cursor-pointer select-none bg-transparent;
  }
  .track {
    @apply w-12 h-6 bg-yellow-500 rounded-full shadow-inner;
  }
  .thumb {
    @apply transition-all duration-300 ease-in-out absolute top-0 left-0 w-6 h-6 bg-white border-2 border-yellow-500 rounded-full;
  }
  input[type='checkbox']:checked ~ .thumb {
    @apply transform translate-x-full border-green-500;
  }

  input[type='checkbox']:checked ~ .track {
    @apply transform transition-colors bg-green-500;
  }

  input[type='checkbox']:focus + .track,
  input[type='checkbox']:active + .track {
    @apply shadow-outline;
  }
  .live {
    @apply font-bold uppercase text-green-600 tracking-wider;
  }
  .sandbox {
    @apply font-bold uppercase text-yellow-600 tracking-wider;
  }
  #mode {
    @apply ml-2;
  }
  .logo {
    @apply text-purple-400 text-sm font-quantico;
  }
</style>

<Modal bind:showModal bind:modalType bind:modalText />
<div class="inline-flex items-center p-2">
  <svg
    class="w-8 h-8 text-purple-400 fill-current stroke-current"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20">
    <path
      d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0
      01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0
      000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115
      11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364
      0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0
      01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
  </svg>
  <sup class="logo">Svelte</sup>
  <span class="text-3xl font-quantico">Turk</span>
</div>
<div class="inline-flex items-center p-2">
  <label for="toggle">
    <div class="switch" on:click={switchMturkMode}>
      <input type="checkbox" name="toggle" class="sr-only" bind:checked={live} />
      <div class="track" />
      <div class="thumb" />
    </div>
  </label>
  <span class={live ? 'live' : 'sandbox'} id="mode">{mode}</span>
</div>
<hr class="w-56 mt-2 mb-4 border-t-2 border-gray-500" />
