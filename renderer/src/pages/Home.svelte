<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';
  import { stLog } from '../components/logger';
  import { live } from '../components/store';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let mturk;

  // VARIABLES
  let showModal = false;
  let modalType;
  let modalText = 'lots of text here';
  // Make accountBalance reactive with respect to mturk which comes from App.svelte
  // This re-executes getAccountBalance() whenever mturk changes
  // mturk changes when SidebarHeader dispatches to App.svelte, which then
  // reinitializes mturk and passes it here triggering the re-execution
  // In the HTML we use Svelte's await syntax because for a brief period
  // accountBalance is an promise that's waiting to be resolve in getAccountBalance()
  // this ensures that "Loading..." is rendered while waiting
  const getAccountBalance = async () => {
    try {
      stLog.info('REQ Mturk: getAccountBalance');
      const resp = await mturk.getAccountBalance().promise();
      accountBalance = `${resp.AvailableBalance}`;
      stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
    } catch (err) {
      stLog.error(err);
      showModal = true;
      modalType = 'error';
      modalText = `Error getting account balance! ${error}`;
    }
  };
  $: accountBalance = mturk ? getAccountBalance() : undefined;
  let numHITs = 'Loading...';
  let numAssts = 'Loading...';
  let numWorkers = 'Loading...';
  $: if ($live) {
    countDocs();
  } else {
    countDocs();
  }
  // FUNCTIONS
  // Query mturk API for account balance

  // Get number of docs in each db
  const countDocs = async () => {
    stLog.info('REQ: countDocs');
    const docs = await ipcRenderer.invoke('countDocs', $live);
    numHITs = docs.hits || '0';
    numAssts = docs.assts || '0';
    numWorkers = docs.workers || '0';
  };

  // Get doc counts on component load
  onMount(async () => {
    await countDocs();
  });
</script>

<style>
  .label {
    @apply font-sans text-xs font-bold tracking-wide uppercase text-gray-700;
  }
</style>

<Modal bind:showModal bind:modalType bind:modalText />
<div class="container w-full h-screen">
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 font-quantico"
    in:fly={{ y: 200, duration: 250 }}>
    <div class="py-8 text-center">
      <div class="md:border-r">
        <div class="label">Account Balance</div>
        <div class="mb-2 text-grey-darker">
          <span class="text-xl text-purple-600 align-top">$</span>
          <span class="text-3xl">
            {#await accountBalance}Loading...{:then accountBalance}{accountBalance}{/await}
          </span>
        </div>
      </div>
    </div>
    <div class="py-8 text-center">
      <div class="lg:border-r">
        <div class="label">Created HITs</div>
        <div class="mb-2 text-grey-darker">
          <span class="text-xl text-purple-600 align-top">+</span>
          <span class="text-3xl">{numHITs}</span>
        </div>
      </div>
    </div>
    <div class="py-8 text-center">
      <div class="md:border-r">
        <div class="flex-no-wrap label">Submitted Assignments</div>
        <div class="mb-2 text-grey-darker">
          <span class="text-xl text-purple-600 align-top">+</span>
          <span class="text-3xl">{numAssts}</span>
        </div>
      </div>
    </div>
    <div class="py-8 text-center">
      <div>
        <div class="label">Unique Workers</div>
        <div class="mb-2 text-grey-darker">
          <span class="text-xl text-purple-600 align-top">+</span>
          <span class="text-3xl">{numWorkers}</span>
        </div>
      </div>
    </div>
  </div>
</div>
