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
  <form class="w-full" on:submit|preventDefault={createHIT}>
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/3 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Title
        </label>
        <input
          class="block w-full px-4 py-2 text-gray-700 bg-gray-200 rounded"
          type="text"
          bind:value={title}
          required />
      </div>
      <div class="w-1/3 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Keywords
        </label>
        <input
          class="block w-full px-4 py-2 mb-2 text-gray-700 bg-gray-200 rounded"
          type="text"
          bind:value={keywords}
          required />
      </div>
      <div class="w-1/3 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Experiment URL
        </label>
        <input
          class="block w-full px-4 py-2 mb-2 text-gray-700 bg-gray-200 rounded"
          type="text"
          bind:value={externalURL}
          required />
      </div>
    </div>
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/5 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Reward
        </label>
        <input
          class="block w-full px-4 py-2 text-gray-700 bg-gray-200 rounded"
          type="text"
          bind:value={reward}
          required />
      </div>
      <div class="w-1/5 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Approval Delay
        </label>
        <input
          class="block w-full px-4 py-2 mb-2 text-gray-700 bg-gray-200 rounded"
          type="text"
          bind:value={autoApprovalDelay}
          required />
      </div>
      <div class="w-1/5 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Duration
        </label>
        <input
          class="block w-full px-4 py-2 mb-2 text-gray-700 bg-gray-200 rounded"
          type="text"
          bind:value={assignmentDuration}
          required />
      </div>
      <div class="w-1/5 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Lifetime
        </label>
        <input
          class="block w-full px-4 py-2 mb-2 text-gray-700 bg-gray-200 rounded"
          type="text"
          bind:value={lifetime}
          required />
      </div>
      <div class="w-1/5 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Max Assignments
        </label>
        <input
          class="block w-full px-4 py-2 mb-2 text-gray-700 bg-gray-200 rounded"
          type="text"
          bind:value={maxAssignments}
          required />
      </div>
    </div>
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/3 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Qualifications
        </label>
        <select
          multiple
          class="block w-full h-40 px-4 py-2 overflow-y-auto text-gray-700 bg-gray-200 rounded">
          {#each qualifications as qual}
            <option value={qual}>{qual}</option>
          {/each}
        </select>
      </div>
      <div class="w-2/3 px-3">
        <label class="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase">
          Description
        </label>
        <textarea
          class="block w-full h-40 px-4 py-2 mb-2 overflow-y-auto text-gray-700 bg-gray-200 rounded resize-none"
          type="text"
          bind:value={description}
          required />
      </div>
    </div>
    <hr class="block w-full mt-2 mb-4 border-gray-500" />
    <div class="flex flex-wrap items-center justify-center mb-6 -mx-3 space-x-4">
      <button
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 font-quantico focus:outline-none active:outline-none">
        Create HIT
      </button>
      <button
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 hover:border-purple-400 font-quantico focus:outline-none active:outline-none">
        Save Details
      </button>
      <button
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 font-quantico focus:outline-none active:outline-none">
        Load Details
      </button>
    </div>
  </form>
</div>
