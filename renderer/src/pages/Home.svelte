<script>
  import { onMount } from 'svelte';
  const { ipcRenderer } = require('electron');
  import Modal from '../components/Modal.svelte';

  // INPUTS
  export let mturk;

  // VARIABLES
  let showModal = false;
  let modalType;
  let modalText;
  // Trick to wait to make sure the mturk object is available from App.svelte
  $: mturkReady = mturk ? getAccountBalance() : undefined;
  let accountBalance = 'Loading...';
  let numHITs = 'Loading...';
  let numAssts = 'Loading...';
  let numWorkers = 'Loading...';

  // FUNCTIONS
  // Query mturk API for account balance
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

  // Get number of docs in each db
  const countDocs = async () => {
    let docs = await ipcRenderer.invoke('countDocs');
    numHITs = docs.hits || '0';
    numAssts = docs.assts || '0';
    numWorkers = docs.workers || '0';
  }

  // Get doc counts on component load
  onMount(async () => {
    await countDocs();
  });

</script>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<div class="container">
  <div class="columns">
    <div class="column">
      <p>Account Balance: {accountBalance}</p>
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
      <button on:click={() => showModal = true}>Show</button>
    </div>
  </div>
</div>
