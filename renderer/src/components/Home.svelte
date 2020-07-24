<script>
  import { onMount } from 'svelte';

  export let mturk;
  // Trick to wait to make sure the mturk object is available from App.svelte
  $: mturkReady = mturk ? getAccountBalance() : undefined;

  let accountBalance = 'Loading...';
  let numHITs = 'Loading...';
  let numAssts = 'Loading...';
  let numWorkers = 'Loading...';

  const getAccountBalance = async () => {
    try {
      const resp = await mturk.getAccountBalance().promise();
      accountBalance = `$${resp.AvailableBalance}`;
    } catch (error) {
      console.error(error);
    }
  };

  const getHITs = () => {
    // ipcRenderer get hits
  };
  const getAssts = () => {
    // ipcRenderer get hits
  };
  const getWorkers = () => {
    // ipcRenderer get hits
  };
</script>

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
</div>
