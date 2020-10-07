<script>
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';
  import Dialogue from '../components/Dialogue.svelte';
  import { updateDoc, formatDate } from '../components/utils.js';
  import { stLog, userLog } from '../components/logger';
  import { live } from '../components/store';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let mturk;
  export let tableHeaders = [
    'WorkerId',
    'Assts',
    'HITs',
    'Payments',
    'Bonuses',
    'Most Recent Asst',
    'Most Recent HIT',
    'Last Contacted',
  ];

  // VARIABLES
  let search = '';
  let timer;
  let workers = [];
  let workersFiltered = [];
  let showModal = false;
  let modalText;
  let modalType;
  let showDialogue = false;
  let whichDialogue = '';
  let messageSubject = '';
  let messageText = '';
  // The row DOM element
  let rowDOM;
  // The specific hit in JS
  let selectedWorker;
  // Reactive boolean for styling
  $: rowSelected = !!selectedWorker;
  const resetDataFromMode = async () => {
    clearSelection();
    clearSearch();
    await getWorkers();
  };
  $: if ($live) {
    (async () => await resetDataFromMode())();
  } else {
    (async () => await resetDataFromMode())();
  }
  // FUNCTIONS
  // Get all hits from db
  const getWorkers = async () => {
    stLog.info('REQ findWorkers');
    workers = await ipcRenderer.invoke('findWorkers', $live);
    workersFiltered = workers;
  };

  const clearSelection = () => {
    selectedWorker = undefined;
    if (rowDOM) {
      rowDOM.classList.remove('bg-purple-200');
      rowDOM.classList.add('hoverable');
      rowDOM = undefined;
    }
    showDialogue = false;
    messageSubject = '';
    messageText = '';
  };

  const selectRow = (ev, worker) => {
    // Save clicked row
    if (rowDOM) {
      if (rowDOM === ev.target.parentNode) {
        userLog.info('Unselect row');
        clearSelection();
      } else {
        userLog.info('Select different row');
        rowDOM.classList.remove('bg-purple-200');
        rowDOM.classList.add('hoverable');
        rowDOM = ev.target.parentNode;
        rowDOM.classList.add('bg-purple-200');
        rowDOM.classList.remove('hoverable');
        selectedWorker = worker;
      }
    } else {
      userLog.info('Select row');
      rowDOM = ev.target.parentNode;
      rowDOM.classList.add('bg-purple-200');
      rowDOM.classList.remove('hoverable');
      selectedWorker = worker;
    }
  };

  // Change me to contact worker
  const contactWorkers = async () => {
    userLog.info(`Contact workers`);
    const refreshIcon = document.getElementById('refresh-icon');
    refreshIcon.classList.remove('text-gray-600');
    refreshIcon.classList.add('animate-spin', 'text-purple-700');
    let workersToContact;
    try {
      if (rowSelected) {
        stLog.info(`REQ Mturk: notifyWorkers ${selectedWorker.WorkerId}`);
        workersToContact = [selectedWorker.WorkerId];
      } else {
        workersToContact = workersFiltered.map((e) => e.WorkerId);
        stLog.info(`REQ Mturk: notifyWorkers multiple`);
      }
      let resp = await mturk
        .notifyWorkers({
          MessageText: messageText,
          Subject: messageSubject,
          WorkerIds: workersToContact,
        })
        .promise();
      let timeNow = new Date().toString();
      stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
      await Promise.all(
        workersToContact.map(async (worker) => {
          await updateDoc(
            'workers',
            { _id: worker._id },
            {
              $set: {
                lastContacted: timeNow,
                lastMessage: messageText,
                lastSubject: messageSubject,
              },
            }
          );
        })
      );
      modalText = 'Worker(s) successfully emailed';
      modalType = 'success';
      stLog.info(modalText);
    } catch (err) {
      stLog.error(err);
      modalText = err;
      modalType = 'error';
    }
    showModal = true;
    clearSelection();
    await getWorkers();
    refreshIcon.classList.remove('animate-spin', 'text-purple-700');
    refreshIcon.classList.add('text-gray-600');
  };

  // Change me to show all HITs or assignments for worker
  const showContactWorkers = () => {
    userLog.info('Show contact worker');
    whichDialogue = 'contact-worker';
    showDialogue = true;
  };

  const filterEntries = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      workersFiltered = workers.filter((obj) => {
        const vals = Object.values(obj);
        const filteredVals = vals.filter((val) => {
          let formattedVal;
          if (typeof val === 'number' && val > 1000) {
            formattedVal = formatDate(val);
          } else {
            formattedVal = String(val);
          }
          return formattedVal.indexOf(search) !== -1;
        });
        return filteredVals.length !== 0;
      });
      userLog.info(`Search for ${search}`);
    }, 400);
  };

  const clearSearch = () => {
    userLog.info('Clear search');
    search = '';
    clearTimeout(timer);
    workersFiltered = workers;
  };

  onMount(async () => {
    // Load data from local db
    await getWorkers();
  });
</script>

<style>
  .header {
    @apply mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase sticky border-b border-gray-200 px-4 py-3 bg-gray-100;
  }
  .hoverable:hover {
    @apply bg-purple-100;
  }
  label {
    @apply block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase;
  }
  input {
    @apply block w-full px-4 py-2 mb-2 text-gray-700 bg-gray-200 border rounded outline-none;
  }
  textarea {
    @apply block w-full h-40 px-4 py-2 overflow-y-auto text-gray-700 bg-gray-200 border rounded outline-none resize-none;
  }
</style>

<Modal bind:showModal bind:modalType bind:modalText />
<Dialogue bind:showDialogue on:close={clearSelection}>
  {#if whichDialogue === 'contact-worker'}
    <div class="container">
      <form class="w-full">
        <div class="flex flex-col items-center px-3">
          {#if !rowSelected}
            <h3 class="text-lg">This will be sent to {workersFiltered.length} Workers</h3>
          {/if}
          <label class="self-start">Subject</label>
          <input
            type="text"
            bind:value={messageSubject}
            placeholder="your email subject line"
            min="60" />
          <label class="self-start">Body</label>
          <textarea class="mb-2" cols="40" bind:value={messageText} placeholder="your email body" />
          <button
            on:click|preventDefault={contactWorkers}
            class="button"
            disabled={!messageSubject}>
            Submit
          </button>
        </div>
      </form>
    </div>
  {/if}
</Dialogue>
<div class="w-full h-screen" in:fly={{ y: 200, duration: 250 }}>
  <div class="flex justify-between mb-2">
    <div class="inline-flex items-center px-4 py-2 truncate">
      <p class="py-2 pl-4 pr-2 font-bold tracking-wide text-gray-700 uppercase">
        Total:
        {workersFiltered.length}
      </p>
      <p>
        <svg
          on:click={getWorkers}
          id="refresh-icon"
          class="w-6 h-6 text-gray-600 rounded cursor-pointer stroke-current hover:bg-purple-200 hover:rounded-lg hover:text-purple-700"
          viewBox="0 0 24 24"
          stroke-width="2.25"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" />
          <path d="M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5" />
        </svg>
      </p>
    </div>
    <div class="inline-flex items-center px-4 py-2 space-x-4">
      <button on:click|preventDefault={showContactWorkers} class="button">
        {#if rowSelected}Contact{:else}Contact All{/if}
      </button>
    </div>
    <div class="inline-flex items-center h-10 px-4 py-2 mt-1 bg-gray-200 rounded">
      <svg class="w-6 h-6 mr-2 fill-current" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414
          1.414l-4.816-4.816A6 6 0 012 8z"
          clip-rule="evenodd" />
      </svg>
      <input
        class="text-gray-700 bg-gray-200 border-none outline-none focus:outline-none"
        type="text"
        placeholder="Search..."
        bind:value={search}
        on:keyup={() => filterEntries()} />
      <svg
        class="w-4 h-4 cursor-pointer fill-current"
        class:invisible={!search}
        class:visible={search}
        viewBox="0 0 20 20"
        on:click={clearSearch}>
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293
          4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293
          5.707a1 1 0 010-1.414z"
          clip-rule="evenodd" />
      </svg>
    </div>
  </div>
  <div class="table-container">
    <table class="w-full table-auto">
      <thead>
        <tr>
          {#each tableHeaders as header}
            <th class="w-1/12 truncate header">{header}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each workersFiltered as worker}
          <tr on:click={(ev) => selectRow(ev, worker)} class="hoverable">
            <td type="text">{worker.WorkerId}</td>
            <td type="text">{worker.Assignments.length}</td>
            <td type="text">{worker.HITs.length}</td>
            <td type="text">{`$${worker.totalPayments}`}</td>
            <td type="text">{`$${worker.totalBonuses ? worker.totalBonuses : 0}`}</td>
            <td type="text">{worker.recentAsst.slice(0, 6)}</td>
            <td type="text">{worker.recentHIT.slice(0, 6)}</td>
            <td type="text">{worker.lastContacted ? formatDate(worker.lastContacted) : 'Never'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
