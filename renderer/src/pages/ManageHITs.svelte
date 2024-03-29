<script>
  import { onMount, onDestroy } from 'svelte';
  import { fly, slide } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import Modal from '../components/Modal.svelte';
  import Dialogue from '../components/Dialogue.svelte';
  import { deleteDoc, updateDoc, wait, formatDate } from '../components/utils.js';
  import { userSettings, live } from '../components/store';
  import { stLog, userLog } from '../components/logger';

  const { ipcRenderer, shell } = require('electron');

  // INPUTS
  export let mturk;
  export let tableHeaders = [
    'Status',
    'Title',
    'HITId',
    'HITTypeId',
    'Created',
    'Expiration',
    'Unique Workers',
    'Pending',
    'Available',
    'Completed',
  ];

  // VARIABLES
  let search = '';
  let timer;
  let hits = [];
  let hitsFiltered = [];
  let hitTypes = [];
  let showModal = false;
  let modalText;
  let modalType;
  let showDialogue = false;
  let HITDrawerOpen = false;
  let selectedHITType = 'all';
  let whichDialogue = '';
  let extendTime = 60;
  let extendError = false;
  let additionalAssts = 1;
  let addAsstsError = false;
  let addAsstsErrorReason = 'Placeholder error message';
  let refreshFromAWS;
  // The row DOM element
  let rowDOM;
  // The specific hit in JS
  let selectedHIT;
  // Preview URL
  let previewURL;
  // Reactive boolean for styling
  $: rowSelected = !!selectedHIT;
  $: recruitable =
    rowSelected && selectedHIT.MaxAssignments !== 9 && selectedHIT.HITStatus !== 'Reviewable';
  $: endAble = rowSelected && selectedHIT.HITStatus === 'Assignable';
  const resetDataFromMode = async () => {
    await clearSelection();
    await clearSearch();
    await getHITs();
  };
  $: if ($live) {
    (async () => await resetDataFromMode())();
  } else {
    (async () => await resetDataFromMode())();
  }

  // FUNCTIONS
  // Get all hits from db
  const getHITs = async () => {
    stLog.info('REQ findHITs');
    hits = await ipcRenderer.invoke('findHits', $live);
    hitTypes = [...new Set(hits.map((e) => e.HITTypeId))];
    if (selectedHITType === 'all') {
      hitsFiltered = hits;
    } else {
      hitsFiltered = hits.filter((e) => e.HITTypeId === selectedHITType);
    }
  };

  const refreshHITs = async () => {
    stLog.info('REFRESH HITs');
    const refreshIcon = document.getElementById('refresh-icon');
    refreshIcon.classList.remove('text-gray-600');
    refreshIcon.classList.add('animate-spin', 'text-purple-700');
    try {
      stLog.info('REQ Mturk: getHIT ALL');
      // NOTE: Promise.all because order doesn't matter and we don't want error blocking
      await Promise.all(
        hits.map(async (hit) => {
          const resp = await mturk.getHIT({ HITId: hit.HITId }).promise();
          await updateDoc(
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
          await wait(1000);
        })
      );
      await getHITs();
      refreshIcon.classList.remove('animate-spin', 'text-purple-700');
      refreshIcon.classList.add('text-gray-600');
    } catch (err) {
      stLog.error(err);
      modalText = err;
      modalType = 'error';
      showModal = true;
    }
  };

  const clearSelection = () => {
    selectedHIT = undefined;
    previewURL = undefined;
    if (rowDOM) {
      rowDOM.classList.remove('bg-purple-200');
      rowDOM.classList.add('hoverable');
      rowDOM = undefined;
    }
    showDialogue = false;
    extendTime = 60;
    additionalAssts = 1;
    addAsstsErrorReason = 'Placeholder error message';
    addAsstsError = false;
  };

  const openHITLink = () => {
    shell.openExternal(previewURL);
  };

  const selectRow = (ev, hit) => {
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
        selectedHIT = hit;
      }
    } else {
      userLog.info('Select row');
      rowDOM = ev.target.parentNode;
      rowDOM.classList.add('bg-purple-200');
      rowDOM.classList.remove('hoverable');
      selectedHIT = hit;
    }
    if (selectedHIT) {
      previewURL = mturk.endpoint.host.includes('sandbox')
        ? `https://workersandbox.mturk.com/mturk/preview?groupId=${selectedHIT.HITGroupId}`
        : `https://worker.mturk.com/mturk/preview?groupId=${selectedHIT.HITGroupId}`;
    }
  };

  const deleteHIT = async () => {
    userLog.info(`Delete assignment ${selectedHIT._id}`);
    const resp = await deleteDoc('hits', selectedHIT._id);
    modalText = resp.text;
    modalType = resp.type;
    showModal = true;
    stLog.info(resp.text);
    clearSelection();
    await getHITs();
  };

  const endHIT = async () => {
    userLog.info('End HIT');
    try {
      stLog.info(`REQ Mturk: updateExpirationForHIT (end) ${selectedHIT.HITId}`);
      let resp = await mturk
        .updateExpirationForHIT({
          ExpireAt: new Date(0),
          HITId: selectedHIT.HITId,
        })
        .promise();
      stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
      stLog.info(`REQ Mturk: getHIT ${selectedHIT.HITId}`);
      resp = await mturk.getHIT({ HITId: selectedHIT.HITId }).promise();
      stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
      // TODO: LOGS: Use resp.header object to store server time log and action
      const dbResp = await updateDoc(
        'hits',
        { _id: selectedHIT._id },
        {
          $set: { Expiration: resp.HIT.Expiration.toString(), HITStatus: resp.HIT.HITStatus },
        }
      );
      if (dbResp.type === 'success') {
        modalText = 'HIT ended and db updated successfully!';
        modalType = 'success';
      } else {
        modalText = 'HIT ended successfully but could not update db. See console.';
        modalType = 'notifcation';
        stLog.info(dbResp);
      }
      showModal = true;
      await getHITs();
    } catch (err) {
      stLog.error(err);
      modalText = err;
      modalType = 'error';
      showModal = true;
    }
    clearSelection();
  };

  const showHITInfo = () => {
    userLog.info('Show HIT details');
    whichDialogue = 'info';
    showDialogue = true;
  };

  const showHITExtend = () => {
    userLog.info('Show HIT extend');
    whichDialogue = 'extend';
    showDialogue = true;
  };

  const showAddAssts = () => {
    userLog.info('Show add assignments');
    whichDialogue = 'add';
    showDialogue = true;
  };

  const addAsstsToHIT = async () => {
    userLog.info(`Add assignments to HIT ${selectedHIT.HITId}`);
    if (Number.isInteger(additionalAssts) && additionalAssts >= 1) {
      if (selectedHIT.MaxAssignments < 10 && selectedHIT.MaxAssignments + additionalAssts >= 10) {
        addAsstsError = true;
        addAsstsErrorReason = 'This HIT is limited to a total of 9 assignments';
        userLog.error(addAsstsError);
      } else {
        addAsstsError = false;
        try {
          stLog.info(`REQ Mturk: createAdditionalAssignmentsForHIT ${selectedHIT.HITId}`);
          let resp = await mturk
            .createAdditionalAssignmentsForHIT({
              HITId: selectedHIT.HITId,
              NumberOfAdditionalAssignments: additionalAssts,
            })
            .promise();
          stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
          stLog.info(`REQ Mturk: getHIT ${selectedHIT.HITId}`);
          resp = await mturk.getHIT({ HITId: selectedHIT.HITId }).promise();
          stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
          const dbResp = await updateDoc(
            'hits',
            { _id: selectedHIT._id },
            {
              $set: { MaxAssignments: resp.HIT.MaxAssignments },
            }
          );
          if (dbResp.type === 'success') {
            modalText = 'New assignments added successfully!';
            modalType = 'success';
          } else {
            modalText = 'New assignments added, but could not update db. See console!';
            modalType = 'notifcation';
          }
          stLog.info(dbResp);
          showModal = true;
          await getHITs();
        } catch (err) {
          stLog.error(err);
          modalText = err;
          modalType = 'error';
          showModal = true;
        }
        clearSelection();
      }
    } else {
      addAsstsError = true;
      addAsstsErrorReason = 'Must be a valid number (minimum 1)';
      userLog.error(addAsstsErrorReason);
    }
  };

  const extendHIT = async () => {
    userLog.info(`Extend HIT expiration ${selectedHIT.HITId}`);
    if (selectedHIT.HITStatus !== 'Disposed') {
      let update = parseInt(extendTime, 10);
      if (Number.isInteger(update) && update >= 60) {
        extendError = false;
        const now = Date.now();
        // NOTE: Adding 1 here because minimum time must be 60s and entering 60 submits a request for 59s to aws
        update = (update + 1) * 1000;
        const updatedTime = new Date(now + update);
        try {
          stLog.info(`REQ Mturk: updateExpirationForHIT ${selectedHIT.HITId}`);
          let resp = await mturk
            .updateExpirationForHIT({
              ExpireAt: updatedTime,
              HITId: selectedHIT.HITId,
            })
            .promise();
          stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
          stLog.info(`REQ Mturk: getHIT ${selectedHIT.HITId}`);
          resp = await mturk.getHIT({ HITId: selectedHIT.HITId }).promise();
          stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
          const dbResp = await updateDoc(
            'hits',
            { _id: selectedHIT._id },
            {
              $set: { Expiration: resp.HIT.Expiration.toString(), HITStatus: resp.HIT.HITStatus },
            }
          );
          if (dbResp.type === 'success') {
            modalText = 'HIT extended and db updated successfully!';
            modalType = 'success';
          } else {
            modalText = 'HIT extended successfully but could not update db. See console.';
            modalType = 'notifcation';
          }
          stLog.info(dbResp);
          showModal = true;
          await getHITs();
        } catch (err) {
          stLog.error(err);
          modalText = err;
          modalType = 'error';
          showModal = true;
        }
      } else {
        extendError = true;
        userLog.error('Form validation error');
      }
    } else {
      modalText = 'HIT has been disposed';
      modalType = 'error';
      showModal = true;
      userLog.error(modalText);
    }
    clearSelection();
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
      userLog.info(`Search for ${search}`);
    }, 400);
  };

  const clearSearch = () => {
    userLog.info('Clear search');
    search = '';
    clearTimeout(timer);
    hitsFiltered = hits;
  };

  const toggleHITTypeSelect = () => {
    HITDrawerOpen = !HITDrawerOpen;
  };
  // Because on some elements outside the dropdown we always just want to close thise dropdown
  const closeHITTypeSelect = () => {
    HITDrawerOpen = false;
  };

  const changeHITType = async (hitTypeId) => {
    userLog.info(`Change HITType to ${hitTypeId}`);
    selectedHITType = hitTypeId;
    toggleHITTypeSelect();
    await getHITs();
  };
  onMount(async () => {
    // Load hits from local db
    await getHITs();
    // NOTE: this is commented out so that user navigation around the app doesn't keep triggering refreshes, which can take long if there are lots of hits
    // Get their latest statuses
    // await refreshHITs();
    // Start an auto-refreshing API call every refreshFrequency seconds
    refreshFromAWS = setInterval(refreshHITs, $userSettings.refreshFrequency * 1000);
    stLog.info('Auto HIT refreshing started');
  });

  onDestroy(() => {
    clearInterval(refreshFromAWS);
    console.log('Auto HIT refreshing stopped');
  });
</script>

<style>
  .header {
    @apply mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase sticky border-b border-gray-200 px-4 py-3 bg-gray-100;
  }
  .selected {
    @apply text-purple-600;
  }
  .selected:hover {
    @apply bg-transparent;
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
  .tooltip .tooltip-text {
    @apply invisible p-1 absolute z-50 inline-block font-quantico text-sm rounded-lg bg-gray-700 text-white -ml-48 -mt-16 max-w-md;
  }
  .tooltip:hover .tooltip-text {
    @apply visible;
  }
  .tooltip .tooltip-text-toggle {
    @apply invisible p-1 font-quantico absolute z-50 inline-block text-sm rounded-lg bg-gray-700 text-white -mt-10;
  }
  .tooltip:hover .tooltip-text-toggle {
    @apply visible;
  }
</style>

<Modal bind:showModal bind:modalType bind:modalText />
<Dialogue bind:showDialogue on:close={clearSelection}>
  {#if whichDialogue === 'extend'}
    <form class="w-full">
      <div class="flex flex-col items-center px-3">
        <label class="self-start">Additional Duration</label>
        <input type="number" bind:value={extendTime} placeholder="time in seconds" min="60" />
        <p class="self-start error-text" class:visible={extendError} class:invisible={!extendError}>
          Must be a valid time in seconds (minimum 60)
        </p>
        <button on:click|preventDefault={extendHIT} class="button" disabled={!extendTime}>
          Submit
        </button>
      </div>
    </form>
  {:else if whichDialogue === 'add'}
    <form class="w-full">
      <div class="flex flex-col items-center px-3">
        <label class="self-start">Additional Workers</label>
        <input
          type="number"
          bind:value={additionalAssts}
          placeholder="number of assignments"
          min="1" />
        <p
          class="self-start error-text"
          class:visible={addAsstsError}
          class:invisible={!addAsstsError}>
          {addAsstsErrorReason}
        </p>
        <button on:click|preventDefault={addAsstsToHIT} class="button" disabled={!additionalAssts}>
          Submit
        </button>
      </div>
    </form>
  {:else if whichDialogue === 'info'}
    <div class="container">
      <form class="w-full">
        <div class="flex flex-wrap mb-6 -mx-3">
          <div class="w-1/3 px-3">
            <label>Title</label>
            <input readonly type="text" bind:value={selectedHIT.Title} />
          </div>
          <div class="w-1/3 px-3">
            <label>Keywords</label>
            <input type="text" readonly bind:value={selectedHIT.Keywords} />
          </div>
          <div class="w-1/3 px-3">
            <label>Experiment URL</label>
            <input type="text" readonly bind:value={selectedHIT.ExternalURL} />
          </div>
        </div>
        <div class="flex flex-wrap mb-6 -mx-3">
          <div class="w-1/4 px-3">
            <label>Hit Id</label>
            <input readonly type="text" bind:value={selectedHIT.HITId} />
          </div>
          <div class="w-1/4 px-3">
            <label>Hit Type Id</label>
            <input readonly type="text" bind:value={selectedHIT.HITTypeId} />
          </div>
          <div class="w-1/4 px-3">
            <label>Created</label>
            <input type="text" readonly bind:value={selectedHIT.CreationTime} />
          </div>
          <div class="w-1/4 px-3">
            <label>Expires</label>
            <input type="text" readonly bind:value={selectedHIT.Expiration} />
          </div>
        </div>
        <div class="flex flex-wrap mb-6 -mx-3">
          <div class="w-1/5 px-3">
            <label>Reward</label>
            <input type="text" readonly bind:value={selectedHIT.Reward} />
          </div>
          <div class="w-1/5 px-3">
            <label>Auto Approval Delay</label>
            <input type="text" readonly bind:value={selectedHIT.AutoApprovalDelayInSeconds} />
          </div>
          <div class="w-1/5 px-3">
            <label>Duration</label>
            <input type="text" readonly bind:value={selectedHIT.AssignmentDurationInSeconds} />
          </div>
          <div class="w-1/5 px-3">
            <label>Lifetime</label>
            <input type="text" readonly bind:value={selectedHIT.LifetimeInSeconds} />
          </div>
          <div class="w-1/5 px-3">
            <label>Unique Workers</label>
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
        <div class="flex flex-wrap mb-6">
          <div class="w-full px-3">
            <label for="">Link</label>
            <input
              type="text"
              readonly
              bind:value={previewURL}
              class="cursor-pointer"
              on:click={openHITLink} />
          </div>
        </div>
      </form>
    </div>
  {/if}
</Dialogue>
<div
  class="container w-full h-screen"
  in:fly={{ y: 200, duration: 250 }}
  on:click|self={closeHITTypeSelect}>
  <div class="flex justify-between mb-2" on:click|self={closeHITTypeSelect}>
    <div class="inline-flex items-center px-4 py-2 truncate">
      <!-- Dropdown selector -->
      <div class="tooltip">
        <span class="tooltip-text-toggle"
          >HITTypeIds group repeat participation HITs and are controlled by the Repeat Participation
          field when creating a HIT
        </span>
        <div class="relative inline-block">
          <div on:click={toggleHITTypeSelect}>
            <span class="rounded shadow">
              <button
                type="button"
                class="inline-flex justify-center w-full px-4 py-2 text-sm font-bold leading-5 tracking-wide text-gray-700 uppercase bg-white border border-gray-300 rounded-md hover:text-purple-600 focus:outline-none focus:none active:bg-gray-500 active:text-gray-800"
                id="options-menu"
                aria-haspopup="true"
                aria-expanded="true">
                Choose HIT Type Id <svg
                  class="w-5 h-5 ml-2 -mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor">
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
              class="fixed z-50 w-56 mt-2 origin-top-right rounded shadow font-quantico"
              transition:slide={{ easing: cubicInOut, duration: 200 }}>
              <div class="bg-white rounded shadow">
                <div
                  class="py-1"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="options-menu">
                  <div
                    class="block px-4 py-2 leading-5 text-gray-700 outline-none cursor-pointer hover:bg-purple-100"
                    class:selected={selectedHITType === 'all'}
                    role="menuitem"
                    on:click={() => changeHITType('all')}>
                    <p class="text-base uppercase">Show All</p>
                  </div>
                  {#each hitTypes as hitType}
                    <div
                      class="block px-4 py-2 leading-5 text-gray-700 outline-none cursor-pointer hover:bg-purple-100"
                      class:selected={hitType === selectedHITType}
                      role="menuitem"
                      on:click={() => changeHITType(hitType)}>
                      <p class="text-sm">{hitType.slice(0, 6)}</p>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
      <p class="py-2 pl-4 pr-2 font-bold tracking-wide text-gray-700 uppercase">
        Total:
        {hitsFiltered.length}
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
      <button on:click|preventDefault={showHITInfo} class="button">Details</button>
      <div class="tooltip">
        <button on:click|preventDefault={showAddAssts} class="button" disabled={!recruitable}
          >Recruit</button>
        {#if !recruitable}
          {#if selectedHIT && selectedHIT.HITStatus === 'Reviewable'}
            <span class="tooltip-text"
              >This HIT has expired. Extend the HIT first in order to recruit more Workers.</span>
          {:else}
            <span class="tooltip-text"
              >This HIT was originally created with 9 or fewer max assignments. You can only create
              a new HIT which will be available to repeat Workers.</span>
          {/if}
        {/if}
      </div>
      <button on:click|preventDefault={showHITExtend} class="button">Extend</button>
      <div class="tooltip">
        <button on:click|preventDefault={endHIT} class="button" disabled={!endAble}>End</button>
        {#if !endAble}<span class="tooltip-text"> This HIT has already ended </span>{/if}
      </div>
      <button on:click|preventDefault={deleteHIT} class="button">Delete</button>
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
        {#each hitsFiltered as hit}
          <tr on:click={(ev) => selectRow(ev, hit)} class="hoverable">
            <td type="text">{hit.HITStatus}</td>
            <td type="text">{hit.Title}</td>
            <td type="text">{hit.HITId.slice(0, 6)}</td>
            <td type="text">{hit.HITTypeId.slice(0, 6)}</td>
            <td type="number">{formatDate(hit.CreationTime)}</td>
            <td type="text">{formatDate(hit.Expiration)}</td>
            <td type="text">{hit.MaxAssignments}</td>
            <td type="text">{hit.NumberOfAssignmentsPending}</td>
            <td type="text">{hit.NumberOfAssignmentsAvailable}</td>
            <td type="text">{hit.NumberOfAssignmentsCompleted}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
