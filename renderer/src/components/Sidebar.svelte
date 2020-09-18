<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let currentState;

  // VARIABLES
  let showModal = false;
  let modalText;
  let modalType;
  const dispatch = createEventDispatcher();

  // FUNCTIONS
  // Tell App.svelte to "route" to a different page
  const changeState = (state) => {
    dispatch('changeState', {
      state,
    });
  };
  // Export all nedb files to json
  const exportData = async () => {
    try {
      const resp = await ipcRenderer.invoke('export');
      modalText = resp.text;
      modalType = resp.type;
    } catch (err) {
      console.error(err);
      modalText = err;
      modalType = 'error';
    }
    showModal = true;
  };
</script>

<style>
  svg {
    @apply w-6 h-4 mr-2 fill-current;
  }
  li {
    @apply inline-flex items-center px-2 py-1 my-1 text-lg text-gray-800 rounded cursor-pointer font-quantico whitespace-no-wrap;
  }
  .active {
    @apply bg-purple-200 w-full;
  }
  li:hover {
    @apply bg-purple-100 w-full;
  }
</style>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<div class="w-40">
  <p class="mb-4 text-xl tracking-wide text-gray-600 uppercase font-quantico">Menu</p>
  <ul>
    <li
      class:active={currentState == 'home'}
      class:hover={true}
      on:click={() => changeState('home')}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path
          d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0
          001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0
          001.414-1.414l-7-7z" />
      </svg>
      <span>Home</span>
    </li>
    <li class:active={currentState == 'createHIT'} on:click={() => changeState('createHIT')}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0
          0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z"
          clip-rule="evenodd" />
      </svg>
      <span>Create HIT</span>
    </li>
    <li class:active={currentState == 'reviewHIT'} on:click={() => changeState('reviewHIT')}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
      </svg>
      <span>Review HIT</span>
    </li>
    <li class:active={currentState == 'reviewAsst'} on:click={() => changeState('reviewAsst')}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
      </svg>
      <span>Review Assts</span>
    </li>
    <li on:click={exportData}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
      </svg>
      <span>Export Data</span>
    </li>
  </ul>
  <hr class="w-56 mt-2 mb-4 border-t-2 border-gray-500" />
</div>
