<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';
  import { deleteDoc } from '../components/utils.js';

  const { ipcRenderer } = require('electron');

  // INPUTS

  // VARIABLES
  let rowSelected = false;
  let search = '';
  let timer;
  let hits = [];
  let hitsFiltered = [];
  let selectedHITId;
  let showModal = false;
  let modalText;
  let modalType;

  // FUNCTIONS
  // Get all hits from db
  const getHits = async () => {
    hits = await ipcRenderer.invoke('findHits');
    hitsFiltered = hits;
    console.log(hits);
  };
  const selectRow = (ev, hit) => {
    // Get all rows
    const rows = document.getElementsByClassName('table-row');
    // Get click row
    const row = ev.target.parentNode;
    // If clicked row already has class unselected it and all other rows
    if (row.className === 'table-row is-selected') {
      for (const r of rows) {
        r.className = 'table-row';
      }
      rowSelected = false;
      selectedHITId = undefined;
    } else {
      // Otherwise unselect everything else first then select this one
      for (const r of rows) {
        r.className = 'table-row';
      }
      row.className += ' is-selected';
      rowSelected = true;
      selectedHITId = hit._id;
    }
  };

  const deleteHIT = async (ev) => {
    const resp = await deleteDoc('hits', selectedHITId);
    modalText = resp.text;
    modalType = resp.type;
    showModal = true;
    await getHits();
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
          <button class="button is-warning">End HIT</button>
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
              <!-- TODO: match values to table columns -->
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
