<script>
  import { fly, fade } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';
  import Dialogue from '../components/Dialogue.svelte';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let mturk;

  // VARIABLES
  let showModal = false;
  let modalType;
  let modalText;
  let formError = false;
  let showDialogue = false;
  let whichDialogue = 'save';
  let saveError = false;
  let saveErrorText = 'Required';
  let loadError = false;
  let saveName = '';
  let loadNames;
  let loadTemplates;
  let loadName;
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
  // TODO: add URL validation for externalURL
  // TODO: add numeric checking for assignmentDuration, lifetime, reward, autoApprovalDelay, maxAssignments
  // TODO: add comma separated list checking for keywords
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
    }
  };
  const clearForm = () => {
    assignmentDuration = '';
    description = '';
    lifetime = '';
    reward = '';
    title = '';
    autoApprovalDelay = '';
    keywords = '';
    maxAssignments = '';
    externalURL = '';
    selectedQuals = [];
  };
  // Load previously saved HITs from db and refresh reactive vars
  const loadSavedHITs = async () => {
    loadTemplates = await ipcRenderer.invoke('findHITTemplates');
    loadNames = loadTemplates.map((elem) => elem['name']);
    loadName = undefined;
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
            Reward: reward.toString(),
            Title: title,
            AutoApprovalDelayInSeconds: parseInt(autoApprovalDelay),
            Keywords: keywords,
            MaxAssignments: parseInt(maxAssignments),
            Question: externalQuestion,
          })
          .promise();
        // TODO: LOGS use resp.header to get server time
        const dbResp = await ipcRenderer.invoke('insertHIT', {
          HITId: resp.HIT.HITId,
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

  // Open save dialogue
  const openSave = async () => {
    checkFields();
    if (!formError) {
      whichDialogue = 'save';
      await loadSavedHITs();
      showDialogue = true;
    }
  };

  // Actually save hit
  const saveTemplate = async () => {
    console.log('save Template');
    saveError = !!!saveName;
    if (!saveError) {
      if (loadNames.includes(saveName)) {
        saveErrorText = 'This name already exists';
        saveError = true;
      } else {
        try {
          const dbResp = await ipcRenderer.invoke('saveHITTemplate', {
            name: saveName,
            assignmentDuration: parseInt(assignmentDuration),
            description: description,
            lifetime: parseInt(lifetime),
            reward: parseInt(reward),
            title: title,
            autoApprovalDelay: parseInt(autoApprovalDelay),
            keywords: keywords,
            maxAssignments: parseInt(maxAssignments),
            externalURL: externalURL,
            selectedQuals: selectedQuals,
          });
          modalText = dbResp.text;
          modalType = dbResp.type;
          console.log('hit template saved');
        } catch (err) {
          console.error(err);
          modalText = err;
          modalType = 'error';
        }
        showDialogue = false;
        showModal = true;
        saveName = '';
      }
    }
  };

  // Open load dialogue
  const openLoad = async () => {
    whichDialogue = 'load';
    await loadSavedHITs();
    showDialogue = true;
    console.log(loadTemplates);
  };

  // Actualy load hit
  const loadTemplate = async () => {
    console.log('load Template');
    loadError = !!!loadName;
    if (!loadError) {
      const HITData = loadTemplates.filter((elem) => elem['name'] === loadName)[0];
      ({
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
      } = HITData);
      showDialogue = false;
    }
  };
  // Delete a hit template
  const deleteTemplate = async () => {
    console.log('delete Template');
    console.log(loadName);
    loadError = !!!loadName;
    if (!loadError) {
      const resp = await ipcRenderer.invoke('deleteHITTemplate', loadName);
      modalText = resp.text;
      modalType = resp.type;
      showModal = true;
      showDialogue = false;
    }
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
  .disabled {
    @apply opacity-50 cursor-not-allowed;
  }
</style>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
{#if showDialogue}
  <Dialogue on:close={() => (showDialogue = false)}>
    {#if whichDialogue === 'load'}
      <form class="w-full">
        <div class="flex flex-col items-center px-3">
          <label class="self-start">
            {#if loadNames.length === 0}No Templates Found{:else}Select Template{/if}
          </label>
          <select
            bind:value={loadName}
            class="block w-full px-4 py-2 leading-tight text-gray-700 bg-gray-200 rounded outline-none">
            {#each loadNames as name}
              <option value={name}>{name}</option>
            {/each}
          </select>
          <p class="self-start error-text" class:visible={loadError} class:invisible={!loadError}>
            Required
          </p>
          <div class="flex flex-row items-center">
            <button
              on:click|preventDefault={loadTemplate}
              class="px-4 py-2 m-2 text-gray-800 bg-gray-200 rounded font-quantico hover:bg-purple-100 focus:outline-none active:outline-none"
              class:disabled={loadNames.length === 0}
              disabled={loadNames.length === 0}>
              Load
            </button>
            <button
              on:click|preventDefault={deleteTemplate}
              class="px-4 py-2 m-2 text-gray-800 bg-gray-200 rounded font-quantico hover:bg-purple-100 focus:outline-none active:outline-none"
              class:disabled={loadNames.length === 0}
              disabled={loadNames.length === 0}>
              Delete
            </button>
          </div>
        </div>
      </form>
    {:else if whichDialogue === 'save'}
      <form class="w-full">
        <div class="flex flex-col items-center px-3">
          <label class="self-start">Template Name</label>
          <input class:border-red-500={saveError} type="text" bind:value={saveName} />
          <p class="self-start error-text" class:visible={saveError} class:invisible={!saveError}>
            {saveErrorText}
          </p>
          <button
            on:click|preventDefault={saveTemplate}
            disabled={!saveName}
            class:disabled={!saveName}
            class="px-4 py-2 m-auto text-gray-800 bg-gray-200 rounded font-quantico hover:bg-purple-100 focus:outline-none active:outline-none">
            Save
          </button>
        </div>
      </form>
      <!-- Load-->
    {/if}
  </Dialogue>
{/if}
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
          bind:value={selectedQuals}
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
        on:click|preventDefault={openSave}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 hover:border-purple-400 font-quantico focus:outline-none active:outline-none">
        Save Template
      </button>
      <button
        on:click|preventDefault={openLoad}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 font-quantico focus:outline-none active:outline-none">
        Load Template
      </button>
      <button
        on:click|preventDefault={clearForm}
        class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-purple-100 font-quantico focus:outline-none active:outline-none">
        Clear
      </button>
    </div>
  </form>
</div>
