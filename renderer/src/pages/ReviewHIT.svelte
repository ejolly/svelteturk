<script>
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';
  import Dialogue from '../components/Dialogue.svelte';
  import { deleteDoc, updateDoc, wait, formatDate } from '../components/utils.js';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let mturk;
  export let tableHeaders = [
    'Title',
    'Status',
    'HITId',
    'Created',
    'Expiration',
    'Max Assts',
    'Review',
    'Pending',
    'Available',
    'Completed',
  ];

  // VARIABLES
  const refreshFrequency = 30000;
  const spinnerDuration = 5000;
  let search = '';
  let timer;
  let hits = [];
  let hitsFiltered = [];
  let showModal = false;
  let modalText;
  let modalType;
  let showDialogue = false;
  let whichDialogue = '';
  let extendTime = '';
  let extendError = false;
  let refreshFromAWS;
  // The row DOM element
  let rowDOM;
  // The specific hit in JS
  let selectedHIT;
  // Reactive boolean for styling
  $: rowSelected = !!selectedHIT;

  // FUNCTIONS
  // Get all hits from db
  const getHITs = async () => {
    hits = await ipcRenderer.invoke('findHits');
    hitsFiltered = hits;
  };

  const refreshHITs = async () => {
    console.log(`Refreshing HITs from AWS at: ${new Date().toString()}`);
    const refreshIcon = document.getElementById('refresh-icon');
    refreshIcon.classList.remove('text-gray-600');
    refreshIcon.classList.add('animate-spin', 'text-purple-700');
    setTimeout(() => {
      refreshIcon.classList.remove('animate-spin', 'text-purple-700');
      refreshIcon.classList.add('text-gray-600');
    }, spinnerDuration);
    try {
      hits.forEach(async (hit) => {
        const resp = await mturk.getHIT({ HITId: hit.HITId }).promise();
        const dbResp = await updateDoc(
          'hits',
          { HITId: resp.HIT.HITId },
          {
            $set: {
              HITTypeId: resp.HIT.HITTypeId,
              HITGroupId: resp.HIT.HITGroupId,
              HITLayoutId: resp.HIT.HITLayoutId,
              CreationTime: resp.HIT.CreationTime.toString(),
              Title: resp.HIT.Title,
              Description: resp.HIT.Description,
              Keywords: resp.HIT.Keywords,
              HITStatus: resp.HIT.HITStatus,
              MaxAssignments: resp.HIT.MaxAssignments,
              Reward: resp.HIT.Reward,
              AutoApprovalDelayInSeconds: resp.HIT.AutoApprovalDelayInSeconds,
              Expiration: resp.HIT.Expiration.toString(),
              AssignmentDurationInSeconds: resp.HIT.AssignmentDurationInSeconds,
              HITReviewStatus: resp.HIT.HITReviewStatus,
              NumberOfAssignmentsPending: resp.HIT.NumberOfAssignmentsPending,
              NumberOfAssignmentsAvailable: resp.HIT.NumberOfAssignmentsAvailable,
              NumberOfAssignmentsCompleted: resp.HIT.NumberOfAssignmentsCompleted,
            },
          }
        );
        // Asynchronously wait 1s between API calls so we don't get rate limited
        await wait(1000);
      });
      await getHITs();
    } catch (err) {
      console.error(err);
      modalText = err;
      modalType = 'error';
      showModal = true;
    }
  };

  const updateTableRows = () => {
    // Get all rows manually by css because they could have changed
    const tableRows = document.getElementsByClassName('table-row');
    // If clicked row already has class unselected it and all other rows
    if (rowDOM.className === 'table-row is-selected') {
      for (const r of tableRows) {
        r.className = 'table-row';
      }
      selectedHIT = undefined;
      rowDOM = undefined;
    } else {
      // Otherwise unselect everything else first then select this one
      for (const r of tableRows) {
        r.className = 'table-row';
      }
      rowDOM.className += ' is-selected';
    }
  };

  const clearSelection = () => {
    selectedHIT = undefined;
    rowDOM.classList.remove('bg-purple-200');
    rowDOM.classList.add('hoverable');
    rowDOM = undefined;
    showDialogue = false;
    extendTime = '';
  };

  const selectRow = (ev, hit) => {
    // Save clicked row
    if (rowDOM) {
      if (rowDOM === ev.target.parentNode) {
        clearSelection();
      } else {
        rowDOM.classList.remove('bg-purple-200');
        rowDOM.classList.add('hoverable');
        rowDOM = ev.target.parentNode;
        rowDOM.classList.add('bg-purple-200');
        rowDOM.classList.remove('hoverable');
        selectedHIT = hit;
      }
    } else {
      rowDOM = ev.target.parentNode;
      rowDOM.classList.add('bg-purple-200');
      rowDOM.classList.remove('hoverable');
      selectedHIT = hit;
    }
  };

  const deleteHIT = async (ev) => {
    const resp = await deleteDoc('hits', selectedHIT._id);
    modalText = resp.text;
    modalType = resp.type;
    showModal = true;
    clearSelection();
    await getHITs();
  };

  const endHIT = async (ev) => {
    try {
      const resp = await mturk
        .updateExpirationForHIT({
          ExpireAt: new Date(0),
          HITId: selectedHIT.HITId,
        })
        .promise();
      // TODO: LOGS: Use resp.header object to store server time log and action
      if (resp.$response.httpResponse.statusCode === 200) {
        // TODO: We don't want to manually set status, instead we should make another getHIT API
        // becauese if they end a hit when it's already expired it'll update the local db, but the next refresh from mturk will change the status back to reviewable
        const dbResp = await updateDoc(
          'hits',
          { _id: selectedHIT._id },
          {
            $set: { Expiration: Date().toString() },
          }
        );
        if (dbResp.type === 'success') {
          modalText = 'HIT ended and db updated successfully!';
          modalType = 'success';
        } else {
          modalText = 'HIT ended successfully but could not update db. See console.';
          modalType = 'notifcation';
          console.log(dbResp);
        }
      } else {
        modalText = 'Something unexpected happened! See console.';
        modalType = 'notification';
      }
      showModal = true;
      await getHITs();
    } catch (err) {
      console.error(err);
      modalText = err;
      modalType = 'error';
      showModal = true;
    }
    clearSelection();
  };

  const showHITInfo = async (ev) => {
    whichDialogue = 'info';
    showDialogue = true;
  };

  const showHITExtend = () => {
    whichDialogue = 'extend';
    showDialogue = true;
  };

  const extendHIT = async (ev) => {
    let update = parseInt(extendTime, 10);
    if (Number.isInteger(update) && update >= 60) {
      extendError = false;
      const now = Date.now();
      // TODO: figure out
      // Adding 1 here because minimum time must be 60s and entering 60 submits a request for 59s to aws
      update = (update + 1) * 1000;
      const updatedTime = new Date(now + update);
      try {
        const resp = await mturk
          .updateExpirationForHIT({
            ExpireAt: updatedTime,
            HITId: selectedHIT.HITId,
          })
          .promise();
        // TODO: LOGS: Use resp.header object to store server time log and action
        if (resp.$response.httpResponse.statusCode === 200) {
          // TODO: We don't want to manually set status, instead we should make another getHIT API
          // becauese if they end a hit when it's already expired it'll update the local db, but the next refresh from mturk will change the status back to reviewable
          const dbResp = await updateDoc(
            'hits',
            { _id: selectedHIT._id },
            {
              $set: { Expiration: updatedTime.toString() },
            }
          );
          if (dbResp.type === 'success') {
            modalText = 'HIT extended and db updated successfully!';
            modalType = 'success';
          } else {
            modalText = 'HIT extended successfully but could not update db. See console.';
            modalType = 'notifcation';
            console.log(dbResp);
          }
        } else {
          modalText = 'Something unexpected happened! See console.';
          modalType = 'notification';
        }
        showModal = true;
        await getHITs();
      } catch (err) {
        console.error(err);
        modalText = err;
        modalType = 'error';
        showModal = true;
      }
      clearSelection();
    } else {
      extendError = true;
    }
  };

  const filterEntries = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      hitsFiltered = hits.filter((obj) => {
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
    }, 400);
  };

  const clearSearch = () => {
    search = '';
    filterEntries();
  };

  onMount(async () => {
    // Load hits from local db
    await getHITs();
    // Start an auto-refreshing API call every refreshFrequency seconds
    refreshFromAWS = setInterval(refreshHITs, refreshFrequency);
    console.log(`Auto HIT refreshing started on: ${new Date().toString()}`);
  });

  onDestroy(() => {
    clearInterval(refreshFromAWS);
    console.log(`Auto HIT refreshing ended on: ${new Date().toString()}`);
  });
</script>

<style>
  .header {
    @apply mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase sticky border-b border-gray-200 px-4 py-3 bg-gray-100;
  }
  td {
    @apply border-t border-gray-300 px-4 py-3 text-gray-700;
  }
  .hoverable:hover {
    @apply bg-purple-100;
  }
  label {
    @apply block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase;
  }
  input {
    @apply block w-full px-4 py-2 text-gray-700 bg-gray-200 border rounded outline-none;
  }
  .disabled {
    @apply opacity-50 cursor-not-allowed select-none;
  }
  .error-text {
    @apply text-xs italic text-red-500;
  }
</style>

<Modal {showModal} {modalType} on:close={() => (showModal = false)}>
  <p>{modalText}</p>
</Modal>
{#if showDialogue}
  <Dialogue on:close={clearSelection}>
    {#if whichDialogue === 'extend'}
      <form class="w-full">
        <div class="flex flex-col items-center px-3">
          <label class="self-start">Additional Duration</label>
          <input type="text" bind:value={extendTime} placeholder="time in seconds" />
          <p
            class="self-start error-text"
            class:visible={extendError}
            class:invisible={!extendError}>
            Must be a valid time in seconds (minimum 60)
          </p>
          <button
            on:click|preventDefault={extendHIT}
            class="px-4 py-2 m-2 text-gray-800 bg-gray-200 rounded font-quantico hover:bg-purple-100 focus:outline-none active:outline-none"
            class:disabled={extendTime === ''}
            disabled={extendTime === ''}>
            Submit
          </button>
        </div>
      </form>
    {:else if whichDialogue === 'info'}
      <div class="container">
        <form class="w-full">
          <div class="flex flex-wrap mb-6 -mx-3">
            <div class="w-1/4 px-3">
              <label>Title</label>
              <input readonly type="text" bind:value={selectedHIT.Title} />
            </div>
            <div class="w-1/4 px-3">
              <label>Keywords</label>
              <input type="text" readonly bind:value={selectedHIT.Keywords} />
            </div>
            <div class="w-1/4 px-3">
              <label>Experiment URL</label>
              <input type="text" readonly bind:value={selectedHIT.ExternalURL} />
            </div>
            <div class="w-1/4 px-3">
              <label>Hit Id</label>
              <input readonly type="text" bind:value={selectedHIT.HITId} />
            </div>
          </div>
          <div class="flex flex-wrap mb-6 -mx-3">
            <div class="w-3/12 px-3">
              <label>Created</label>
              <input type="text" readonly bind:value={selectedHIT.CreationTime} />
            </div>
            <div class="w-3/12 px-3">
              <label>Expires</label>
              <input type="text" readonly bind:value={selectedHIT.Expiration} />
            </div>
            <div class="w-2/12 px-3">
              <label>Reward</label>
              <input type="text" readonly bind:value={selectedHIT.Reward} />
            </div>
            <div class="w-2/12 px-3">
              <label>Approval Delay</label>
              <input type="text" readonly bind:value={selectedHIT.AutoApprovalDelayInSeconds} />
            </div>
            <div class="w-2/12 px-3">
              <label>Max Assignments</label>
              <input type="text" readonly bind:value={selectedHIT.MaxAssignments} />
            </div>
          </div>
          <div class="flex flex-wrap mb-6 -mx-3">
            <div class="w-1/3 px-3">
              <label>Qualifications</label>
              <select
                multiple
                class="block w-full h-40 px-4 py-2 overflow-y-auto text-gray-700 bg-gray-200 rounded outline-none">
                {#each selectedHIT.Qualifications || [] as qual}
                  <option disabled value={qual}>{qual}</option>
                {/each}
              </select>
            </div>
            <div class="w-2/3 px-3">
              <label>Description</label>
              <textarea
                class="block w-full h-40 px-4 py-2 mb-2 overflow-y-auto text-gray-700 bg-gray-200 border rounded outline-none resize-none"
                type="text"
                readonly
                bind:value={selectedHIT.Description} />
            </div>
          </div>
        </form>
      </div>
    {/if}
  </Dialogue>
{/if}
<div class="container" in:fly={{ y: 200, duration: 250 }}>
  <div class="flex justify-between mb-2">
    <div class="inline-flex items-center px-4 py-2">
      <p class="px-4 py-2 font-bold tracking-wide text-gray-700 uppercase">
        Total: {hitsFiltered.length}
      </p>
      <p>
        <svg
          on:click={refreshHITs}
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
    <div
      class="inline-flex items-center px-4 py-2 space-x-4"
      class:invisible={!rowSelected}
      class:visible={rowSelected}>
      <button
        on:click|preventDefault={showHITInfo}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 hover:border-purple-400 font-quantico focus:outline-none active:outline-none">
        HIT Details
      </button>
      <button
        on:click|preventDefault={showHITExtend}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 font-quantico focus:outline-none active:outline-none">
        Extend HIT
      </button>
      <button
        on:click|preventDefault={endHIT}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 hover:border-purple-400 font-quantico focus:outline-none active:outline-none">
        End HIT
      </button>
      <button
        on:click|preventDefault={deleteHIT}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 font-quantico focus:outline-none active:outline-none">
        Delete from db
      </button>
    </div>
    <div class="inline-flex items-center h-10 px-4 py-2 bg-gray-200 rounded">
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
        class="w-4 h-4 fill-current"
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
  <table class="w-full table-auto">
    <thead>
      <tr>
        {#each tableHeaders as header}
          <th class="header">{header}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each hitsFiltered as hit}
        <tr on:click={(ev) => selectRow(ev, hit)} class="hoverable">
          <td type="text">{hit.Title}</td>
          <td type="text">{hit.HITStatus}</td>
          <td type="text">{hit.HITId.slice(0, 6)}</td>
          <td type="number">{formatDate(hit.CreationTime)}</td>
          <td type="text">{formatDate(hit.Expiration)}</td>
          <td type="text">{hit.MaxAssignments}</td>
          <td type="text">{hit.HITReviewStatus}</td>
          <td type="text">{hit.NumberOfAssignmentsPending}</td>
          <td type="text">{hit.NumberOfAssignmentsAvailable}</td>
          <td type="text">{hit.NumberOfAssignmentsCompleted}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
