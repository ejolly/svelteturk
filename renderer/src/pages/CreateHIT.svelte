<script>
  import { fly, fade } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';
  import Dialogue from '../components/Dialogue.svelte';
  import Input from '../components/Input.svelte';
  import { HITSchema, extractErrors } from '../components/utils.js';

  const { ipcRenderer } = require('electron');

  // INPUTS
  export let mturk;

  // VARIABLES
  let showModal = false;
  let modalType;
  let modalText;
  let showDialogue = false;
  let whichDialogue = 'save';
  let saveError = false;
  let saveErrorText = 'Required';
  let loadError = false;
  let saveName = '';
  let loadNames;
  let loadTemplates;
  let loadName;
  let errors = {};
  const qualifications = ['--Unselect All--', '> 95% Approval', 'Adult only', 'US Only', 'Masters'];
  let hitParams = {
    assignmentDuration: 3600,
    description: '',
    lifetime: 86400,
    reward: '1',
    title: '',
    autoApprovalDelay: 10,
    keywords: 'research,experiment',
    maxAssignments: 2,
    externalURL: '',
    selectedQuals: ['--Unselect All--'],
  };
  let hitParamsInfo = {
    assignmentDuration: 'Time (s) Worker has to complete a HIT',
    description: 'Details about HIT',
    lifetime: 'Total time (s) HIT is available to be completed',
    reward: 'Payment to Worker in USD after completion',
    title: 'Title of HIT',
    autoApprovalDelay: 'Delay (s) before Worker is auto-paid',
    keywords: 'Comma separated (no-spaces) list of HIT keywords',
    maxAssignments: '',
    externalURL: 'URL of your experiment/survey/task',
    selectedQuals: 'Qualifications a Worker must have to complete your HIT',
  };
  $: {
    if (hitParams.selectedQuals.includes('--Unselect All--')) {
      hitParams['selectedQuals'] = [];
    }
  }
  $: {
    if (hitParams.maxAssignments) {
      if (hitParams.maxAssignments > 9) {
        hitParamsInfo['maxAssignments'] = 'Additional assts limit: none Mturk fee: 40%';
      } else {
        hitParamsInfo['maxAssignments'] = `Additional assts limit: ${
          9 - hitParams.maxAssignments
        } Mturk fee: 20%`;
      }
    }
  }

  $: externalQuestion = `
  <ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">
  <ExternalURL>${hitParams.externalURL}</ExternalURL>
  <FrameHeight>900</FrameHeight>
  </ExternalQuestion>`;

  // FUNCTIONS
  // Load previously saved HITs from db and refresh reactive vars
  const loadSavedHITs = async () => {
    loadTemplates = await ipcRenderer.invoke('findHITTemplates');
    loadNames = loadTemplates.map((elem) => elem['name']);
    loadName = undefined;
  };
  // Create a HIT, validate hit params, and save it to db
  const createHIT = async () => {
    try {
      await HITSchema.validate(hitParams, { abortEarly: false });
      errors = {};
      const resp = await mturk
        .createHIT({
          AssignmentDurationInSeconds: hitParams.assignmentDuration,
          Description: hitParams.description,
          LifetimeInSeconds: hitParams.lifetime,
          Reward: hitParams.reward,
          Title: hitParams.title,
          AutoApprovalDelayInSeconds: hitParams.autoApprovalDelay,
          Keywords: hitParams.keywords,
          MaxAssignments: hitParams.maxAssignments,
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
        LifetimeInSeconds: hitParams.lifetime,
        Expiration: resp.HIT.Expiration.toString(),
        AssignmentDurationInSeconds: resp.HIT.AssignmentDurationInSeconds,
        HITReviewStatus: resp.HIT.HITReviewStatus,
        NumberOfAssignmentsPending: resp.HIT.NumberOfAssignmentsPending,
        NumberOfAssignmentsAvailable: resp.HIT.NumberOfAssignmentsAvailable,
        NumberOfAssignmentsCompleted: resp.HIT.NumberOfAssignmentsCompleted,
        ExternalURL: hitParams.externalURL,
        Qualifications: hitParams.selectedQuals,
      });
      modalText = dbResp.text;
      modalType = dbResp.type;
      showModal = true;
    } catch (err) {
      if (err.name === 'ValidationError') {
        errors = extractErrors(err);
      } else {
        console.error(err);
        modalText = err;
        modalType = 'error';
        showModal = true;
      }
    }
  };

  // Open save dialogue and validate hit params
  const openSave = async () => {
    try {
      await HITSchema.validate(hitParams, { abortEarly: false });
      await loadSavedHITs();
      errors = {};
      whichDialogue = 'save';
      showDialogue = true;
    } catch (err) {
      errors = extractErrors(err);
    }
  };

  // Save hit template and validate hit params
  const saveTemplate = async () => {
    saveError = !!!saveName;
    if (!saveError) {
      if (loadNames.includes(saveName)) {
        saveErrorText = 'This name already exists';
        saveError = true;
      } else {
        try {
          const dbResp = await ipcRenderer.invoke('saveHITTemplate', {
            name: saveName,
            assignmentDuration: hitParams.assignmentDuration,
            description: hitParams.description,
            lifetime: hitParams.lifetime,
            reward: hitParams.reward,
            title: hitParams.title,
            autoApprovalDelay: hitParams.autoApprovalDelay,
            keywords: hitParams.keywords,
            maxAssignments: hitParams.maxAssignments,
            externalURL: hitParams.externalURL,
            selectedQuals: hitParams.selectedQuals,
          });
          modalText = dbResp.text;
          modalType = dbResp.type;
          showDialogue = false;
          showModal = true;
        } catch (err) {
          console.error(err);
          modalText = err;
          modalType = 'error';
        }
        showDialogue = false;
        showModal = true;
      }
      saveName = '';
    }
  };

  // Open load dialogue
  const openLoad = async () => {
    whichDialogue = 'load';
    await loadSavedHITs();
    showDialogue = true;
  };

  // Load hit template
  const loadTemplate = async () => {
    loadError = !!!loadName;
    if (!loadError) {
      hitParams = loadTemplates.filter((elem) => elem['name'] === loadName)[0];
      showDialogue = false;
    }
  };

  // Delete a hit template
  const deleteTemplate = async () => {
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
</style>

<Modal bind:showModal bind:modalType>
  <p>{modalText}</p>
</Modal>
<Dialogue bind:showDialogue on:close={() => (showDialogue = false)}>
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
        <div class="flex flex-row items-center justify-center space-x-4">
          <button
            class="button"
            on:click|preventDefault={loadTemplate}
            disabled={loadNames.length === 0}>
            Load
          </button>
          <button
            class="button"
            on:click|preventDefault={deleteTemplate}
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
        <button on:click|preventDefault={saveTemplate} disabled={!saveName} class="button">
          Save
        </button>
      </div>
    </form>
  {/if}
</Dialogue>
<div class="w-full h-screen" in:fly={{ y: 200, duration: 250 }}>
  <form class="w-full" on:submit|preventDefault={createHIT}>
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/3 px-3">
        <Input
          label="Title"
          type="text"
          error={errors.title}
          displayError={!!errors.title}
          displayInfo={!!!errors.title}
          info={hitParamsInfo.title}
          bind:value={hitParams.title} />
      </div>
      <div class="w-1/3 px-3">
        <Input
          label="Keywords"
          type="text"
          error={errors.keywords}
          displayError={!!errors.keywords}
          displayInfo={!!!errors.keywords}
          info={hitParamsInfo.keywords}
          bind:value={hitParams.keywords} />
      </div>
      <div class="w-1/3 px-3">
        <Input
          label="Experiment URL"
          type="text"
          error={errors.externalURL}
          displayError={!!errors.externalURL}
          displayInfo={!!!errors.externalUrl}
          info={hitParamsInfo.externalURL}
          bind:value={hitParams.externalURL} />
      </div>
    </div>
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/5 px-3">
        <Input
          label="Reward"
          type="text"
          error={errors.reward}
          displayError={!!errors.reward}
          displayInfo={!!!errors.reward}
          info={hitParamsInfo.reward}
          bind:value={hitParams.reward} />
      </div>
      <div class="w-1/5 px-3">
        <Input
          label="Approval Delay"
          type="number"
          error={errors.autoApprovalDelay}
          displayError={!!errors.autoApprovalDelay}
          displayInfo={!!!errors.autoApprovalDelay}
          info={hitParamsInfo.autoApprovalDelay}
          bind:value={hitParams.autoApprovalDelay} />
      </div>
      <div class="w-1/5 px-3">
        <Input
          label="Duration"
          type="number"
          error={errors.assignmentDuration}
          displayError={!!errors.assignmentDuration}
          displayInfo={!!!errors.assignmentDuration}
          info={hitParamsInfo.assignmentDuration}
          bind:value={hitParams.assignmentDuration} />
      </div>
      <div class="w-1/5 px-3">
        <Input
          label="Lifetime"
          type="number"
          error={errors.lifetime}
          displayError={!!errors.lifetime}
          displayInfo={!!!errors.lifetime}
          info={hitParamsInfo.lifetime}
          bind:value={hitParams.lifetime} />
      </div>
      <div class="w-1/5 px-3">
        <Input
          label="Max Assignments"
          type="number"
          error={errors.maxAssignments}
          displayError={!!errors.maxAssignments}
          displayInfo={!!!errors.maxAssignments}
          info={hitParamsInfo.maxAssignments}
          bind:value={hitParams.maxAssignments} />
      </div>
    </div>
    <div class="flex flex-wrap mb-4 -mx-3">
      <div class="w-1/3 px-3">
        <label>Qualifications</label>
        <select
          multiple
          bind:value={hitParams.selectedQuals}
          class="block w-full h-40 px-4 py-2 overflow-y-auto text-gray-700 bg-gray-200 rounded outline-none">
          {#each qualifications as qual}
            <option value={qual}>{qual}</option>
          {/each}
        </select>
        <p class="info-text">{hitParamsInfo.selectedQuals}</p>
      </div>
      <div class="w-2/3 px-3">
        <Input
          label="Description"
          type="textarea"
          error={errors.description}
          displayError={!!errors.description}
          displayInfo={!!!errors.description}
          info={hitParamsInfo.description}
          bind:value={hitParams.description} />
      </div>
    </div>
    <div class="w-full px-3 text-center font-quantico">
      <p>This is some info</p>
    </div>
    <hr class="block w-full mt-2 mb-4 border-gray-500" />
    <div class="flex flex-wrap items-center justify-center mb-6 -mx-3 space-x-4">
      <button class="button" type="submit"> Create HIT </button>
      <button class="button" on:click|preventDefault={openLoad}> Load Template </button>
      <button class="button" on:click|preventDefault={openSave}> Save Template </button>
      <button class="button" type="reset" on:click|preventDefault={() => (errors = {})}>
        Clear
      </button>
    </div>
  </form>
</div>
