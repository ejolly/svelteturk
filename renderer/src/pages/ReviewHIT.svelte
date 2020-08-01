<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';
  import { deleteDoc, updateDoc } from '../components/utils.js';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let mturk;

  // VARIABLES
  /* let rowSelected = false; */
  let search = '';
  let timer;
  let hits = [];
  let hitsFiltered = [];
  let selectedHITId;
  let selectedHITMTurkId;
  let showModal = false;
  let modalText;
  let modalType;
  // The row DOM element
  let rowDOM;
  // The specific hit in JS
  let selectedHIT;
  // Reactive boolean for styling
  $: rowSelected = selectedHIT ? true : false;

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
    rowDOM = ev.target.parentNode;
    // Saved selected hit
    selectedHIT = hit;
    // Update
    updateTableRows();
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
  .status {
    pointer-events: none;
  }
  .control.has-icons-right .icon {
    pointer-events: auto !important;
  }
</style>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<div class="container" in:fly={{ y: 200, duration: 250 }}>
  <div class="columns">
    <div class="column has-text-left">
      <div class="columns">
        <div class="column is-full">
          <div class="field is-grouped">
            <p class="control">
              <button class="button is-link">Approve All HITs</button>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="column has-text-right">
      <div class="field is-grouped" class:is-invisible={!rowSelected}>
        <p class="control">
          <button class="button is-warning" on:click={endHIT}>End HIT</button>
        </p>
        <p class="control">
          <button class="button is-success">Approve HIT</button>
        </p>
        <p class="control">
          <button class="button is-danger" on:click={deleteHIT}>Delete from db</button>
        </p>
      </div>
    </div>
  </div>
  <hr />
  <div class="columns">
    <div class="column is-full">
      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <p>
              <strong>Total HITs:</strong>
              {hitsFiltered.length}
            </p>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <div class="field">
              <p class="control has-icons-right">
                <input
                  class="input"
                  type="text"
                  placeholder="Find a HIT"
                  bind:value={search}
                  on:keyup={() => filterEntries()} />
                {#if search}
                  <span class="icon is-small is-right" on:click={clearSearch}>
                    <i class="fas fa-times" />
                  </span>
                {/if}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="table-container">
        <table class="table is-hoverable">
          <thead>
            <tr>
              <th />
              <th>HITId</th>
              <th>HITTypeId</th>
              <th>Creation Time</th>
              <th>Title</th>
              <th>Status</th>
              <th>Max Assignments</th>
              <th>Expiration</th>
              <th>Review Status</th>
              <th># Pending</th>
              <th># Available</th>
              <th># Completed</th>
            </tr>
          </thead>
          <tbody>
            {#each hitsFiltered as hit}
              <tr class="table-row" on:click={(ev) => selectRow(ev, hit)}>
                <td>
                  <span class="tag is-success status">Complete</span>
                </td>
                <td type="text">{hit.HITId}</td>
                <td type="text">{hit.HITTypeId}</td>
                <td type="number">{formatDate(hit.CreationTime)}</td>
                <td type="text">{hit.Title}</td>
                <td type="text">{hit.HITStatus}</td>
                <td type="text">{hit.MaxAssignments}</td>
                <td type="text">{formatDate(hit.Expiration)}</td>
                <td type="text">{hit.HITReviewStatus}</td>
                <td type="text">{hit.NumberOfAssignmentsPending}</td>
                <td type="text">{hit.NumberOfAssignmentsAvailable}</td>
                <td type="text">{hit.NumberOfAssignmentsCompleted}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
