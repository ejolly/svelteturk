<script>
  import { onMount } from 'svelte';
  import { db } from '../utils.js';

  let participants = [];
  // For testing
  // const participants = [
  //   {
  //     assignmentId: 'debugdRqEW',
  //     currentState: 'instructions',
  //     currentTrial: 1,
  //     hitId: 'debugzG2yr',
  //     startTime: 1576279764733,
  //     trialOrder: [
  //       's01_TimRiggins.wav',
  //       's01_CoachTaylor.wav',
  //       's01_BuddyGarrity.wav',
  //       's01_LandryClarke.wav',
  //       's01_JulieTaylor.wav',
  //       's01_TamiTaylor.wav',
  //       's01_MattSaracen.wav',
  //       's01_LylaGarrity.wav',
  //       's01_JasonStreet.wav',
  //       's01_SmashWilliams.wav'
  //     ],
  //     workerId: 'debugomUfs'
  //   },
  //   {
  //     assignmentId: 'test-assignment',
  //     currentState: 'quiz',
  //     currentTrial: 1,
  //     hitId: 'test-hit',
  //     quiz_start: 1576340034657,
  //     startTime: 1576339962895,
  //     trialOrder: [
  //       's01_BuddyGarrity.wav',
  //       's01_SmashWilliams.wav',
  //       's01_LandryClarke.wav',
  //       's01_JulieTaylor.wav',
  //       's01_LylaGarrity.wav',
  //       's01_JasonStreet.wav',
  //       's01_MattSaracen.wav',
  //       's01_TimRiggins.wav',
  //       's01_TamiTaylor.wav',
  //       's01_CoachTaylor.wav'
  //     ],
  //     workerId: 'test-worker'
  //   }
  // ];
  let rowSelected = false;
  let search = '';
  let timer;
  let participantsFiltered = [];

  const selectRow = (ev) => {
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
    } else {
      // Otherwise unselect everything else first then select this one
      for (const r of rows) {
        r.className = 'table-row';
      }
      row.className += ' is-selected';
      rowSelected = true;
    }
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
      participantsFiltered = participants.filter((obj) => {
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
    db.ref('participants').on('value', (snapshot) => {
      participants = [];
      snapshot.forEach((doc) => {
        participants.push(doc.val());
      });
      participants = participants;
      participantsFiltered = participants;
    });
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
        <button class="button is-danger">End Experiment</button>
      </p>
      <p class="control">
        <button class="button is-success">Approve HIT</button>
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
            <strong>Total Participants:</strong>
            {participantsFiltered.length}
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
                placeholder="Find a participant"
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
            <th>Worker Id</th>
            <th>Experiment State</th>
            <th>Current Trial</th>
            <th>Started HIT</th>
            <th>HIT Id</th>
            <th>Assignment Id</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each participantsFiltered as participant}
            <tr class="table-row" on:click={selectRow}>
              <td type="text">{participant.workerId}</td>
              <td type="text">{participant.currentState}</td>
              <td type="number">{participant.currentTrial}</td>
              <td type="text">{formatDate(participant.startTime)}</td>
              <td type="text">{participant.hitId}</td>
              <td type="text">{participant.assignmentId}</td>
              <td>
                <span class="tag is-primary status">Complete</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
