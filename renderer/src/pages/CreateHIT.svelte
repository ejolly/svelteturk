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
  let formError = false;
  // Create HIT vars
  let assignmentDuration = 3600;
  let description = '';
  let lifetime = 86400;
  let reward = '1';
  let title = '';
  let autoApprovalDelay = 10;
  let keywords = 'research,experiment';
  let maxAssignments = 2;
  let externalURL = '';
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
  // Check to make sure no fields are empty
  const checkFields = () => {
    formError = false;
    const fieldVals = [
      assignmentDuration,
      description,
      lifetime,
      reward,
      title,
      autoApprovalDelay,
      keywords,
      maxAssignments,
      externalURL,
      selectedQuals,
    ];
    if (fieldVals.some((elem) => elem === undefined || elem === '')) {
      formError = true;
      console.error('form error');
      console.log(fieldVals);
    }
  };

  // Create a HIT and save it to db
  const createHIT = async () => {
    console.log('create HIT');
    checkFields();
    if (!formError) {
      try {
        const resp = await mturk
          .createHIT({
            AssignmentDurationInSeconds: parseInt(assignmentDuration),
            Description: description,
            LifetimeInSeconds: parseInt(lifetime),
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
      console.log('hit submitted');
    }
  };

  // save a HIT template to the db
  const saveHIT = async () => {
    console.log('save HIT');
    checkFields();
  };

  // load a HIT template to the db
  const loadHIT = async () => {
    console.log('load HIT');
  };
</script>

<style>
  input {
    @apply block w-full px-4 py-2 text-gray-700 bg-gray-200 border rounded outline-none;
  }
  label {
    @apply block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase;
  }
  .error-text {
    @apply text-xs italic text-red-500;
  }
</style>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<div class="container" in:fly={{ y: 200, duration: 250 }}>
  <form class="w-full">
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/3 px-3">
        <label>Title</label>
        <input class:border-red-500={formError && title === ''} type="text" bind:value={title} />
        <p
          class="error-text"
          class:visible={formError && title === ''}
          class:invisible={!formError || title !== ''}>
          Required
        </p>
      </div>
      <div class="w-1/3 px-3">
        <label>Keywords</label>
        <input type="text" bind:value={keywords} />
      </div>
      <div class="w-1/3 px-3">
        <label>Experiment URL</label>
        <input
          class:border-red-500={formError && externalURL === ''}
          type="text"
          bind:value={externalURL} />
        <p
          class="error-text"
          class:visible={formError && externalURL === ''}
          class:invisible={!formError || externalURL !== ''}>
          Required
        </p>
      </div>
    </div>
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/5 px-3">
        <label>Reward</label>
        <input class:border-red-500={formError && reward === ''} type="text" bind:value={reward} />
        <p
          class="error-text"
          class:visible={formError && reward === ''}
          class:invisible={!formError || reward !== ''}>
          Required
        </p>
      </div>
      <div class="w-1/5 px-3">
        <label>Approval Delay</label>
        <input
          class:border-red-500={formError && autoApprovalDelay === ''}
          type="text"
          bind:value={autoApprovalDelay} />
        <p
          class="error-text"
          class:visible={formError && autoApprovalDelay === ''}
          class:invisible={!formError || autoApprovalDelay !== ''}>
          Required
        </p>
      </div>
      <div class="w-1/5 px-3">
        <label>Duration</label>
        <input
          class:border-red-500={formError && assignmentDuration === ''}
          type="text"
          bind:value={assignmentDuration} />
        <p
          class="error-text"
          class:visible={formError && assignmentDuration === ''}
          class:invisible={!formError || assignmentDuration !== ''}>
          Required
        </p>
      </div>
      <div class="w-1/5 px-3">
        <label>Lifetime</label>
        <input
          class:border-red-500={formError && lifetime === ''}
          type="text"
          bind:value={lifetime} />
        <p
          class="error-text"
          class:visible={formError && lifetime === ''}
          class:invisible={!formError || lifetime !== ''}>
          Required
        </p>
      </div>
      <div class="w-1/5 px-3">
        <label>Max Assignments</label>
        <input
          class:border-red-500={formError && maxAssignments === ''}
          type="text"
          bind:value={maxAssignments} />
        <p
          class="error-text"
          class:visible={formError && maxAssignments === ''}
          class:invisible={!formError || maxAssignments !== ''}>
          Required
        </p>
      </div>
    </div>
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/3 px-3">
        <label>Qualifications</label>
        <select
          multiple
          class="block w-full h-40 px-4 py-2 overflow-y-auto text-gray-700 bg-gray-200 rounded outline-none">
          {#each qualifications as qual}
            <option value={qual}>{qual}</option>
          {/each}
        </select>
      </div>
      <div class="w-2/3 px-3">
        <label>Description</label>
        <textarea
          class="block w-full h-40 px-4 py-2 mb-2 overflow-y-auto text-gray-700 bg-gray-200 border rounded outline-none resize-none"
          class:border-red-500={formError && description === ''}
          type="text"
          bind:value={description} />
        <p
          class="error-text"
          class:visible={formError && description === ''}
          class:invisible={!formError || description !== ''}>
          Required
        </p>
      </div>
    </div>
    <hr class="block w-full mt-2 mb-4 border-gray-500" />
    <div class="flex flex-wrap items-center justify-center mb-6 -mx-3 space-x-4">
      <button
        on:click|preventDefault={createHIT}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 font-quantico focus:outline-none active:outline-none">
        Create HIT
      </button>
      <button
        on:click|preventDefault={saveHIT}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 hover:border-purple-400 font-quantico focus:outline-none active:outline-none">
        Save Details
      </button>
      <button
        on:click={loadHIT}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 font-quantico focus:outline-none active:outline-none">
        Load Details
      </button>
    </div>
  </form>
</div>
