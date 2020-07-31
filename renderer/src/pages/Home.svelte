<script>
  import { onMount } from 'svelte';
  import { slide, fly, fade } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let mturk;

  // VARIABLES
  let showModal = false;
  let modalType;
  let modalText;
  // Make accountBalance reactive with respect to mturk which comes from App.svelte
  // This re-executes getAccountBalance() whenever mturk changes
  // mturk changes when SidebarHeader dispatches to App.svelte, which then
  // reinitializes mturk and passes it here triggering the re-execution
  // In the HTML we use Svelte's await syntax because for a brief period
  // accountBalance is an promise that's waiting to be resolve in getAccountBalance()
  // this ensures that "Loading..." is rendered while waiting
  const getAccountBalance = async () => {
    try {
      const resp = await mturk.getAccountBalance().promise();
      accountBalance = `$${resp.AvailableBalance}`;
    } catch (error) {
      console.error(error);
      showModal = true;
      modalType = 'error';
      modalText = `Error getting account balance! ${error}`;
    }
  };
  $: accountBalance = mturk ? getAccountBalance() : undefined;
  let numHITs = 'Loading...';
  let numAssts = 'Loading...';
  let numWorkers = 'Loading...';

  // FUNCTIONS
  // Query mturk API for account balance

  // Get number of docs in each db
  const countDocs = async () => {
    const docs = await ipcRenderer.invoke('countDocs');
    numHITs = docs.hits || '0';
    numAssts = docs.assts || '0';
    numWorkers = docs.workers || '0';
  };

  // Get doc counts on component load
  onMount(async () => {
    await countDocs();
  });
</script>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<div class="container" in:fly={{ y: 200, duration: 250 }}>
  <div class="columns">
    <div class="column">
      {#await accountBalance}
        <p>Account Balance: Loading...</p>
      {:then accountBalance}
        <p>Account Balance: {accountBalance}</p>
      {/await}
    </div>
  </div>
  <div class="columns">
    <div class="column">
      <p>Number of HITs: {numHITs}</p>
    </div>
  </div>
  <div class="columns">
    <div class="column">
      <p>Number of Assignments: {numAssts}</p>
    </div>
  </div>
  <div class="columns">
    <div class="column">
      <p>Number of Workers: {numWorkers}</p>
    </div>
  </div>
  <div class="columns">
    <div class="column">
      <!-- Example modal usage -->
      <button on:click={() => (showModal = true)}>Show</button>
    </div>
  </div>
</div>
