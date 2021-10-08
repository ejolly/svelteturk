<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import Dialogue from './Dialogue.svelte';
  import { userSettings } from './store';
  import { stLog, userLog } from './logger';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let currentState;

  // VARIABLES
  let showModal = false;
  let modalText;
  let modalType;
  let showDialogue = false;

  // Settings
  const dispatch = createEventDispatcher();

  // FUNCTIONS
  // Tell App.svelte to "route" to a different page
  const changeState = (state) => {
    dispatch('changeState', {
      state,
    });
  };

  const showSettings = () => {
    userLog.info('Show settings');
    showDialogue = true;
  };

  const saveUserSettings = async () => {
    stLog.info('REQ: updateSettings');
    try {
      const resp = await ipcRenderer.invoke('updateSettings', $userSettings);
      modalText = resp.text;
      modalType = resp.type;
      showDialogue = false;
      stLog.info(`User settings are now ${JSON.stringify($userSettings)}`);
    } catch (err) {
      stLog.error(err);
      modalText = err;
      modalType = 'error';
    }
    showModal = true;
  };
  // Export all nedb files to json
  const exportData = async () => {
    stLog.info('REQ: export');
    try {
      const resp = await ipcRenderer.invoke('export');
      if (resp.type === 'success') {
        modalText = resp.text;
        modalType = resp.type;
        showModal = true;
        stLog.info(resp.text);
      }
    } catch (err) {
      stLog.error(err);
      modalText = err;
      modalType = 'error';
      showModal = true;
    }
  };
</script>

<style>
  svg {
    @apply w-6 h-4 mr-2;
  }
  li {
    @apply inline-flex items-center px-2 py-1 my-1 text-lg text-gray-800 rounded cursor-pointer font-quantico whitespace-no-wrap;
  }
  .active {
    @apply bg-purple-200 w-full;
  }
  li:hover {
    @apply bg-purple-200 w-full;
  }
  label {
    @apply block text-xs font-bold tracking-wide text-gray-700 uppercase;
  }
  input.input {
    @apply block w-full px-4 py-2 text-gray-700 bg-gray-200 border rounded outline-none;
  }
</style>

<Modal bind:showModal bind:modalType bind:modalText />
<Dialogue bind:showDialogue>
  <div class="container">
    <form class="w-full" on:submit|preventDefault={saveUserSettings}>
      <div class="flex flex-col mb-6 -mx-3 space-y-4">
        <div class="px-3">
          <label>Refresh Frequency </label>
          <input class="input" type="number" min="5" bind:value={$userSettings.refreshFrequency} />
        </div>
        <div class="inline-flex px-3 space-x-4">
          <label
            >Allow Repeat Bonusing
            <input type="checkbox" class="mx-4" bind:checked={$userSettings.repeatBonuses} />
          </label>
        </div>
        <div class="inline-flex px-3 space-x-4">
          <label
            >Display help text in Create HIT
            <input type="checkbox" class="mx-4" bind:checked={$userSettings.createHITHelpers} />
          </label>
        </div>
        <hr class="block w-full mt-2 mb-4 border-gray-500" />
        <button class="button" type="submit">Save</button>
      </div>
    </form>
  </div>
</Dialogue>
<div class="w-48">
  <p class="mb-4 text-xl tracking-wide text-gray-600 uppercase font-quantico">Menu</p>
  <ul>
    <li class:active={currentState == 'home'} on:click={() => changeState('home')}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 20">
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
    <li class:active={currentState == 'manageHITs'} on:click={() => changeState('manageHITs')}>
      <svg
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
      <span>Manage HITs</span>
    </li>
    <li class:active={currentState == 'reviewAssts'} on:click={() => changeState('reviewAssts')}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 20" fill="currentColor">
        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
      </svg>
      <span>Review Assts</span>
    </li>
    <li
      class:active={currentState == 'manageWorkers'}
      on:click={() => changeState('manageWorkers')}>
      <svg fill="currentColor" viewBox="0 0 26 24" xmlns="http://www.w3.org/2000/svg"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      <span>Manage Workers</span>
    </li>
    <li on:click={exportData}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 20">
        <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
      </svg>
      <span>Export Data</span>
    </li>
  </ul>
  <hr class="w-56 mt-2 mb-2 border-t-2 border-gray-500" />
  <ul>
    <li on:click={showSettings}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      <span class="text-sm">Settings</span>
    </li>
  </ul>
</div>
