<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';
  import { deleteDoc, updateDoc } from '../components/utils.js';

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
  /* let rowSelected = false; */
  let search = '';
  let timer;
  let hits = [];
  let hitsFiltered = [];
  let showModal = false;
  let modalText;
  let modalType;
  // The row DOM element
  let rowDOM;
  // The specific hit in JS
  let selectedHIT;
  // Reactive boolean for styling
  $: rowSelected = !!selectedHIT;

  // FUNCTIONS
  // Get all hits from db
  const getHits = async () => {
    hits = await ipcRenderer.invoke('findHits');
    hitsFiltered = hits;
    console.log(hits);
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
  const selectRow = (ev, hit) => {
    // Save clicked row
    if (rowDOM) {
      if (rowDOM === ev.target.parentNode) {
        selectedHIT = undefined;
        rowDOM.classList.remove('bg-purple-200');
        rowDOM.classList.add('hoverable');
        rowDOM = undefined;
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
    // Update
    // updateTableRows();
    console.log(`Selected HIT: ${selectedHIT ? selectedHIT.HITId : 'no hit selected'}`);
  };

  const deleteHIT = async (ev) => {
    const resp = await deleteDoc('hits', selectedHIT._id);
    modalText = resp.text;
    modalType = resp.type;
    showModal = true;
    await getHits();
    updateTableRows();
  };

  const endHIT = async (ev) => {
    try {
      const resp = await mturk
        .updateExpirationForHIT({
          ExpireAt: new Date(0),
          HITId: selectedHIT.HITId,
        })
        .promise();
      console.log(resp);
      // TODO: LOGS: Use resp.header object to store server time log and action
      if (resp.$response.httpResponse.statusCode === 200) {
        const dbResp = await updateDoc('hits', selectedHIT._id, {
          $set: { HITStatus: 'Unassignable' },
        });
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
      await getHits();
    } catch (err) {
      console.error(err);
      modalText = err;
      modalType = 'error';
      showModal = true;
    }
    updateTableRows();
  };

  const extendHIT = async (ev) => {
    console.log('extend HIT');
  };

  const formatDate = (date) => {
    const dateTime = new Date(date);
    const year = dateTime.getFullYear() - 2000;
    const month = dateTime.getMonth();
    const day = dateTime.getDate();
    let hours = dateTime.getHours();
    let ampm;
    if (hours > 12) {
      ampm = 'pm';
      hours -= 12;
    } else if (hours === 12) {
      ampm = 'pm';
    } else {
      ampm = 'am';
    }
    hours = hours > 12 ? hours - 12 : hours;
    let minutes = dateTime.getMinutes();
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${month}/${day}/${year} - ${hours}:${minutes}${ampm}`;
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
    await getHits();
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
</style>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<!---->
<div class="container" in:fly={{ y: 200, duration: 250 }}>
  <div class="flex justify-between mb-2">
    <p class="px-4 py-2 font-bold tracking-wide text-gray-700 uppercase">
      Total HITs: {hitsFiltered.length}
    </p>
    <div
      class="inline-flex items-center px-4 py-2 space-x-4"
      class:invisible={!rowSelected}
      class:visible={rowSelected}>
      <button
        on:click|preventDefault={extendHIT}
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
        class="text-gray-700 bg-gray-200 outline-none focus:outline-none"
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
