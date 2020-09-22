<script>
  import { onMount, onDestroy } from 'svelte';
  import { fly, slide } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import Modal from '../components/Modal.svelte';
  import Dialogue from '../components/Dialogue.svelte';
  import { deleteDoc, updateDoc, wait, formatDate } from '../components/utils.js';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let mturk;

  // VARIABLES
  const refreshFrequency = 30000;
  const spinnerDuration = 5000;
  let search = '';
  let timer;
  let assts = [];
  let hits = [];
  let asstsFiltered = [];
  let showModal = false;
  let modalText;
  let modalType;
  let showDialogue = false;
  let HITDrawerOpen = false;
  let whichDialogue = '';
  let requesterFeedback = '';
  let bonusAmount = '';
  let bonusError = false;
  let refreshFromAWS;
  let rowDOM;
  let selectedAsst;
  let selectedHIT = 'all';
  let tableHeaders = [
    'Status',
    'Asst Id',
    'Worker Id',
    'HIT Id',
    'Accepted',
    'Submitted',
    'Reviewed',
    'Bonus',
    'Bonus Time',
  ];
  $: rowSelected = !!selectedAsst;

  // FUNCTIONS
  const getAssts = async () => {
    if (selectedHIT === 'all') {
      assts = await ipcRenderer.invoke('findAssts');
    } else {
      assts = await ipcRenderer.invoke('findAsstsForHIT', selectedHIT.HITId);
    }
    asstsFiltered = assts;
  };

  const getHITs = async () => {
    hits = await ipcRenderer.invoke('findHits');
    selectedHIT = 'all';
  };

  const refreshAssts = async () => {
    if (selectedHIT === 'all') {
      modalText = 'Choose a specific HIT to refresh assignments';
      modalType = 'notification';
      showModal = true;
    } else {
      console.log(
        `Refreshing Assts for HIT ${selectedHIT.HITId} from AWS at: ${new Date().toString()}`
      );
      const refreshIcon = document.getElementById('refresh-icon');
      refreshIcon.classList.remove('text-gray-600');
      refreshIcon.classList.add('animate-spin', 'text-purple-700');
      try {
        const resp = await mturk.listAssignmentsForHIT({ HITId: selectedHIT.HITId }).promise();
        const Assignments = await resp.Assignments;
        for (const asst of Assignments) {
          const dbResp = await updateDoc(
            'assts',
            { AsstId: asst.AssignmentId },
            {
              $set: {
                WorkerId: asst.WorkerId,
                HITId: asst.HITId,
                Status: asst.AssignmentStatus,
                AutoApprovalTime: asst.AutoApprovalTime,
                AcceptTime: asst.AcceptTime,
                SubmitTime: asst.SubmitTime,
                ReviewTime: asst.ApprovalTime || asst.RejectionTime || asst.AutoApprovalTime,
                RequesterFeedback: asst.RequesterFeedback,
              },
            },
            { upsert: true }
          );
        }
        await getAssts();
        refreshIcon.classList.remove('animate-spin', 'text-purple-700');
        refreshIcon.classList.add('text-gray-600');
      } catch (err) {
        console.error(err);
        modalText = err;
        modalType = 'error';
        showModal = true;
      }
    }
  };

  const selectRow = (ev, asst) => {
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
        selectedAsst = asst;
      }
    } else {
      rowDOM = ev.target.parentNode;
      rowDOM.classList.add('bg-purple-200');
      rowDOM.classList.remove('hoverable');
      selectedAsst = asst;
    }
  };

  const clearSearch = () => {
    search = '';
    filterEntries();
  };

  const clearSelection = () => {
    selectedAsst = undefined;
    bonusAmount = '';
    requesterFeedback = '';
    bonusError = false;
    if (rowDOM) {
      rowDOM.classList.remove('bg-purple-200');
      rowDOM.classList.add('hoverable');
      rowDOM = undefined;
    }
    showDialogue = false;
  };

  const filterEntries = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      asstsFiltered = assts.filter((obj) => {
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

  const approveAsst = async () => {
    if (selectedAsst.Status === 'Submitted') {
      try {
        const resp = await mturk.approveAssignment({ AssignmentId: selectedAsst.AsstId }).promise();
        if (resp.$response.httpResponse.statusCode === 200) {
          const dbResp = await updateDoc(
            'assts',
            { AsstId: selectedAsst.AsstId },
            {
              $set: {
                Status: 'Approved',
                ReviewTime: new Date().toString(),
              },
            }
          );
          if (dbResp.type === 'success') {
            modalText = 'Asst approved and db updated successfully!';
            modalType = 'success';
          } else {
            modalText = 'Asst approved but could not update db. See console.';
            modalType = 'notification';
            console.log(dbResp);
          }
        } else {
          modalText = 'Something unexpected happened! See console.';
          modalType = 'notification';
        }
        showModal = true;
        await getAssts();
      } catch (err) {
        console.error(err);
        modalText = err;
        modalType = 'error';
        showModal = true;
      }
    } else {
      modalText = 'Assignment has already been reviewed!';
      modalType = 'notification';
      showModal = true;
    }
    clearSelection();
  };

  const approveAll = async () => {
    const statuses = asstsFiltered.map((e) => e['Status']);
    if (statuses.every((e) => ['Approved', 'Rejected'].includes(e))) {
      modalText = 'All assignments already reviewed!';
      modalType = 'notification';
      showModal = true;
    } else {
      const refreshIcon = document.getElementById('refresh-icon');
      refreshIcon.classList.remove('text-gray-600');
      refreshIcon.classList.add('animate-spin', 'text-purple-700');
      try {
        for (const asst of asstsFiltered) {
          if (asst.Status === 'Submitted') {
            console.log(`Approval request for: ${asst.AsstId}`);
            const resp = await mturk.approveAssignment({ AssignmentId: asst.AsstId }).promise();
            if (resp.$response.httpResponse.statusCode === 200) {
              const dbResp = await updateDoc(
                'assts',
                { AsstId: asst.AsstId },
                {
                  $set: {
                    Status: 'Approved',
                    ReviewTime: new Date().toString(),
                  },
                }
              );
              await wait(1000);
            }
          } else {
            console.log(`Already reviewd: ${asst.AsstId}`);
          }
        }
        await getAssts();
        modalText = 'All assignments approved successfully!';
        modalType = 'success';
      } catch (err) {
        console.error(err);
        modalText = err;
        modalType = 'error';
      }
      showModal = true;
      clearSelection();
      await getAssts();
      refreshIcon.classList.remove('animate-spin', 'text-purple-700');
      refreshIcon.classList.add('text-gray-600');
    }
  };

  const showRejectAsst = () => {
    if (selectedAsst.Status === 'Submitted') {
      whichDialogue = 'reject-single';
      showDialogue = true;
    } else {
      modalText = 'Assignment has already been reviewed!';
      modalType = 'notification';
      showModal = true;
      clearSelection();
    }
  };

  const rejectAsst = async () => {
    try {
      const resp = await mturk
        .rejectAssignment({
          AssignmentId: selectedAsst.AsstId,
          RequesterFeedback: requesterFeedback,
        })
        .promise();
      if (resp.$response.httpResponse.statusCode === 200) {
        const dbResp = await updateDoc(
          'assts',
          { AsstId: selectedAsst.AsstId },
          {
            $set: {
              Status: 'Rejected',
              ReviewTime: new Date().toString(),
              RequesterFeedback: requesterFeedback,
            },
          }
        );
        if (dbResp.type === 'success') {
          modalText = 'Assignment rejected and db updated successfully!';
          modalType = 'success';
        } else {
          modalText = 'Assignment rejected but could not update db. See console.';
          modalType = 'notification';
          console.log(dbResp);
        }
      } else {
        modalText = 'Something unexpected happened! See console.';
        modalType = 'notification';
      }
      showModal = true;
      await getAssts();
    } catch (err) {
      console.error(err);
      modalText = err;
      modalType = 'error';
      showModal = true;
    }
    clearSelection();
  };

  const showBonusAll = () => {
    whichDialogue = 'bonus-all';
    showDialogue = true;
  };

  const bonusAll = async () => {
    const amount = parseInt(bonusAmount, 10);
    if (Number.isInteger(amount) && amount >= 0) {
      bonusError = false;
      showDialogue = false;
      const refreshIcon = document.getElementById('refresh-icon');
      refreshIcon.classList.remove('text-gray-600');
      refreshIcon.classList.add('animate-spin', 'text-purple-700');
      try {
        for (const asst of asstsFiltered) {
          const resp = await mturk
            .sendBonus({
              AssignmentId: asst.AsstId,
              BonusAmount: bonusAmount,
              Reason: requesterFeedback,
              WorkerId: asst.WorkerId,
            })
            .promise();
          if (resp.$response.httpResponse.statusCode === 200) {
            const dbResp = await updateDoc(
              'assts',
              { AsstId: asst.AsstId },
              {
                $set: {
                  Bonus: amount,
                  BonusTime: new Date().toString(),
                },
              }
            );
            await wait(1000);
          }
        }
        modalText = 'All assignments bonused successfully!';
        modalType = 'success';
      } catch (err) {
        console.error(err);
        modalText = err;
        modalType = 'error';
      }
      showModal = true;
      clearSelection();
      await getAssts();
      refreshIcon.classList.remove('animate-spin', 'text-purple-700');
      refreshIcon.classList.add('text-gray-600');
    } else {
      bonusError = true;
    }
  };

  const toggleHITSelect = () => {
    HITDrawerOpen = !HITDrawerOpen;
  };

  // Because on some elements outside the dropdown we always just want to close thise dropdown
  const closeHITSelect = () => {
    HITDrawerOpen = false;
  };

  const deleteAsst = async () => {
    const resp = await deleteDoc('assts', selectedAsst._id);
    modalText = resp.text;
    modalType = resp.type;
    showModal = true;
    clearSelection();
    await getAssts();
  };

  const changeHIT = async (hit) => {
    selectedHIT = hit;
    toggleHITSelect();
    await getAssts();
  };

  onMount(async () => {
    await getHITs();
    await getAssts();
  });
</script>

<style>
  button {
    @apply px-4 py-2 text-gray-800 bg-gray-200 rounded;
  }
  button:hover {
    @apply text-purple-600 bg-purple-100;
  }
  button:active {
    @apply outline-none;
  }
  button:focus {
    @apply outline-none;
  }
  .header {
    @apply mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase sticky border-b border-gray-200 px-4 py-3 bg-gray-100;
  }
  .selected {
    @apply text-purple-600;
  }
  .selected:hover {
    @apply bg-transparent;
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
  .dialogue {
    width: 25rem;
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
    <div class="dialogue">
      <form class="w-full">
        <div class="flex flex-col items-center px-3">
          {#if whichDialogue === 'reject-single'}
            <label class="self-start">Requestor Feedback</label>
            <input
              type="text"
              bind:value={requesterFeedback}
              placeholder="provide a reason for rejection" />
            <button
              on:click|preventDefault={rejectAsst}
              class="px-4 py-2 m-2 text-gray-800 bg-gray-200 rounded font-quantico hover:bg-purple-100 focus:outline-none active:outline-none"
              class:disabled={requesterFeedback === ''}
              disabled={requesterFeedback === ''}>
              Submit
            </button>
          {:else if whichDialogue === 'bonus-all'}
            <label class="self-start">Bonus in USD</label>
            <input type="text" bind:value={bonusAmount} placeholder="enter a number" />
            <p class="error-text" class:visible={bonusError} class:invisible={!bonusError}>
              Must be a valid number greater than 0
            </p>
            <label class="self-start">Bonus Reason</label>
            <input
              type="text"
              bind:value={requesterFeedback}
              placeholder="tell the worker why they're receiving a bonus" />
            <button
              on:click|preventDefault={bonusAll}
              class="px-4 py-2 m-2 text-gray-800 bg-gray-200 rounded font-quantico hover:bg-purple-100 focus:outline-none active:outline-none"
              class:disabled={bonusAmount === '' || requesterFeedback === ''}
              disabled={bonusAmount === '' || requesterFeedback === ''}>
              Submit
            </button>
          {/if}
        </div>
      </form>
    </div>
  </Dialogue>
{/if}
<div class="container h-screen" in:fly={{ y: 200, duration: 250 }} on:click|self={closeHITSelect}>
  <div class="flex justify-between mb-2" on:click|self={closeHITSelect}>
    <div class="inline-flex items-center px-4 py-2">
      <!-- Dropdown selector -->
      <div class="relative inline-block">
        <div on:click={toggleHITSelect}>
          <span class="rounded shadow">
            <button
              type="button"
              class="inline-flex justify-center w-full px-4 py-2 text-sm font-bold leading-5 tracking-wide text-gray-700 uppercase bg-white border border-gray-300 rounded-md hover:text-purple-600 focus:outline-none focus:none active:bg-gray-500 active:text-gray-800"
              id="options-menu"
              aria-haspopup="true"
              aria-expanded="true">
              Choose HIT <svg class="w-5 h-5 ml-2 -mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </span>
        </div>
        {#if HITDrawerOpen}
          <div
            class="absolute z-50 w-56 mt-2 origin-top-right rounded shadow font-quantico"
            transition:slide={{ easing: cubicInOut, duration: 200 }}>
            <div class="bg-white rounded shadow">
              <div
                class="py-1"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu">
                <div
                  class="block px-4 py-2 leading-5 text-gray-700 outline-none cursor-pointer hover:bg-purple-100"
                  class:selected={selectedHIT === 'all'}
                  role="menuitem"
                  on:click={() => changeHIT('all')}>
                  <p class="text-base uppercase">Show All</p>
                </div>
                {#each hits as hit}
                  <div
                    class="block px-4 py-2 leading-5 text-gray-700 outline-none cursor-pointer hover:bg-purple-100"
                    class:selected={hit.HITId === selectedHIT.HITId}
                    role="menuitem"
                    on:click={() => changeHIT(hit)}>
                    <p class="text-base">{hit.Title}</p>
                    <p class="text-sm">{hit.HITId.slice(0, 6)}</p>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
      <p class="px-4 py-2 font-bold tracking-wide text-gray-700 uppercase">
        Total: {asstsFiltered.length}
      </p>
      <p>
        <svg
          on:click={refreshAssts}
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
    <div class="inline-flex items-center px-4 py-2 space-x-4 font-quantico">
      {#if rowSelected}
        <button on:click|preventDefault={approveAsst}>Approve</button>
        <button on:click|preventDefault={showRejectAsst}> Reject </button>
        <button on:click|preventDefault={deleteAsst}> Delete from db </button>
      {:else}
        <button on:click|preventDefault={approveAll}>Approve All</button>
        <button on:click|preventDefault={showBonusAll}>Bonus All</button>
      {/if}
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
      {#each asstsFiltered as asst}
        <tr on:click={(ev) => selectRow(ev, asst)} class="hoverable">
          <td type="text">{asst.Status}</td>
          <td type="text">{asst.AsstId.slice(0, 6)}</td>
          <td type="text">{asst.WorkerId}</td>
          <td type="text">{asst.HITId.slice(0, 6)}</td>
          <td type="number">{formatDate(asst.AcceptTime)}</td>
          <td type="text">{formatDate(asst.SubmitTime)}</td>
          <td type="text">{asst.ReviewTime ? formatDate(asst.ReviewTime) : ''}</td>
          <td type="text">{asst.Bonus ? `$${asst.Bonus}` : ''}</td>
          <td type="text">{asst.BonusTime ? formatDate(asst.BonusTime) : ''}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
