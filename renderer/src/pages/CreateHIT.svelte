<script>
  import { fly, fade } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let mturk;

  // VARIABLES
  let showModal = false;
  let modalType;
  let modalText;
  // Create HIT vars
  let assignmentDuration = 3600;
  let description = '';
  let lifetime = 86400;
  let reward = '1';
  let title = '';
  let autoApprovalDelay = 10;
  let keywords = 'research,experiment';
  let maxAssignments = 2;
  let externalURL = 'https://jovial-murdock-ae4d0b.netlify.com/';
  let selectedQuals = ['--Unselect All--'];
  const qualifications = ['--Unselect All--', '> 95% Approval', 'Adult only', 'US Only', 'Masters'];
  $: {
    if (selectedQuals.includes('--Unselect All--')) {
      selectedQuals = [];
    }
  }

  $: externalQuestion = `
  <ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">
  <ExternalURL>${externalURL}</ExternalURL>
  <FrameHeight>900</FrameHeight>
  </ExternalQuestion>`;

  // FUNCTIONS
  // Create a HIT and save it to db
  const createHIT = async () => {
    console.log('create HIT');
    try {
      const resp = await mturk
        .createHIT({
          AssignmentDurationInSeconds: assignmentDuration,
          Description: description,
          LifetimeInSeconds: lifetime,
          Reward: reward,
          Title: title,
          AutoApprovalDelayInSeconds: autoApprovalDelay,
          Keywords: keywords,
          MaxAssignments: maxAssignments,
          Question: externalQuestion,
        })
        .promise();
      // TODO: LOGS use resp.header to get server time
      const dbResp = await ipcRenderer.invoke('insertHIT', {
        HITId: resp.HIT.HITId,
        HITTypeId: resp.HIT.HITTypeId,
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
      });
      modalText = dbResp.text;
      modalType = dbResp.type;
    } catch (err) {
      console.error(err);
      modalText = err;
      modalType = 'error';
    }
    showModal = true;
  };
</script>

<style>
  .minheight {
    min-height: 9rem !important;
  }
</style>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<div class="container" in:fly={{ y: 200, duration: 250 }}>
  <form on:submit|preventDefault={createHIT}>
    <div class="columns">
      <div class="column">
        <div class="field">
          <label class="label">Title</label>
          <div class="control">
            <input type="text" class="input" bind:value={title} required />
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label class="label">Keywords</label>
          <div class="control">
            <input type="text" class="input" bind:value={keywords} required />
            <p class="help">Comma separated with no spaces</p>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label class="label">Experiment URL</label>
          <div class="control">
            <input type="text" class="input" bind:value={externalURL} required />
          </div>
        </div>
      </div>
    </div>
    <div class="columns">
      <div class="column">
        <div class="field">
          <label class="label">Reward</label>
          <div class="control">
            <input type="text" class="input" bind:value={reward} required />
            <p class="help">Don't include $</p>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label class="label">Approval Delay</label>
          <div class="control">
            <input type="text" class="input" bind:value={autoApprovalDelay} required />
            <p class="help">In seconds</p>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label class="label">Duration</label>
          <div class="control">
            <input type="text" class="input" bind:value={assignmentDuration} required />
            <p class="help">In seconds. Default 1hr.</p>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label class="label">Lifetime</label>
          <div class="control">
            <input type="text" class="input" bind:value={lifetime} required />
            <p class="help">In seconds</p>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label class="label">Max Assignments</label>
          <div class="control">
            <input type="text" class="input" bind:value={maxAssignments} required />
            <p class="help">Number of available HITs</p>
          </div>
        </div>
      </div>
    </div>
    <div class="columns">
      <div class="column is-narrow">
        <div class="field">
          <label class="label">Qualifications</label>
          <div class="control">
            <div class="select is-multiple minheight">
              <select multiple bind:value={selectedQuals}>
                {#each qualifications as qual}
                  <option value={qual}>{qual}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="field">
          <label class="label">Description</label>
          <div class="control">
            <textarea class="textarea minheight" placeholder="" bind:value={description} required />
          </div>
        </div>
      </div>
    </div>
    <div class="columns">
      <div class="column">
        <div class="field">
          <div class="control">
            <button class="button is-success">Create HIT</button>
          </div>
        </div>
      </div>
    </div>
  </form>
</div>
