<script>
  import { fly } from 'svelte/transition';
  import Modal from '../components/Modal.svelte';
  import Dialogue from '../components/Dialogue.svelte';
  import Input from '../components/Input.svelte';
  import {
    HITSchema,
    extractErrors,
    formatQuals,
    checkForDuplicateHIT,
    asyncGenerator,
    wait,
  } from '../components/utils.js';
  import { userSettings, live } from '../components/store';
  import { stLog, userLog } from '../components/logger';

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
  let generatedHITTypeId;
  let creatingHITs = false;
  let hitParams = {
    assignmentDuration: 3600,
    description: '',
    lifetime: 86400,
    reward: '1.00',
    title: '',
    autoApprovalDelay: 10,
    keywords: 'research,experiment',
    maxAssignments: 2,
    numHITs: 1,
    externalURL: '',
    selectedQuals: ['--Unselect All--'],
  };
  let hitParamsInfo = {
    assignmentDuration: 'Time (s) Worker has to complete a HIT',
    description: 'Details about HIT',
    lifetime: 'Total time (s) HIT is available on Mturk',
    reward: 'Worker payment in USD',
    title: 'Title of HIT',
    autoApprovalDelay: 'Delay (s) before Worker is auto-paid',
    keywords: 'Comma separated (no-spaces) list of HIT keywords',
    maxAssignments: '',
    numHITs: 'Number of times each Worker can complete your HIT',
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
        hitParamsInfo['maxAssignments'] = 'Max Limit: None | Mturk fee: 40%';
      } else {
        hitParamsInfo['maxAssignments'] = `Max Limit: 9 | Mturk fee: 20%`;
      }
    }
  }

  $: externalQuestion = `
  <ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">
  <ExternalURL>${hitParams.externalURL}</ExternalURL>
  <FrameHeight>900</FrameHeight>
  </ExternalQuestion>`;
  $: if ($live) {
    clearForm();
  } else {
    clearForm();
  }

  // FUNCTIONS
  // Load previously saved HITs from db and refresh reactive vars
  const loadSavedHITs = async () => {
    stLog.info('REQ: findHITTemplates');
    loadTemplates = await ipcRenderer.invoke('findHITTemplates', $live);
    loadNames = loadTemplates.map((elem) => elem['name']);
    loadName = undefined;
  };

  const makeHIT = async () => {
    userLog.info('Create HIT');
    try {
      await HITSchema.validate(hitParams, { abortEarly: false });
      errors = {};
      const qualArray = formatQuals(hitParams.selectedQuals, $live);
      stLog.info('REQ Mturk: createHITType');
      const resp = await mturk
        .createHITType({
          AssignmentDurationInSeconds: hitParams.assignmentDuration,
          Description: hitParams.description,
          Reward: hitParams.reward,
          Title: hitParams.title,
          AutoApprovalDelayInSeconds: hitParams.autoApprovalDelay,
          Keywords: hitParams.keywords,
          QualificationRequirements: qualArray,
        })
        .promise();
      stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
      generatedHITTypeId = resp.HITTypeId;
      stLog.info(`Generated HITTypeId: ${generatedHITTypeId}`);
      if (hitParams.numHITs === 1) {
        stLog.info('Repeat Workers = 1');
        const matchingHITs = await checkForDuplicateHIT(generatedHITTypeId);
        if (matchingHITs) {
          stLog.info('Existing HITs found');
          whichDialogue = 'confirm';
          showDialogue = true;
          userLog.info('Show confirmation');
        } else {
          await createHIT('single');
        }
      } else {
        creatingHITs = true;
        stLog.info(`Repeat Workers = ${hitParams.numHITs}`);
        for (let _i of asyncGenerator(hitParams.numHITs)) {
          await createHIT('multiple');
          await wait(1000);
        }
        creatingHITs = false;
        modalText = `${hitParams.numHITs} HITs created successfully!`;
        modalType = 'success';
        showModal = true;
        stLog.info(modalText);
      }
    } catch (err) {
      if (err.name === 'ValidationError') {
        errors = extractErrors(err);
        userLog.error(`Validation Errors: ${JSON.stringify(errors)}`);
      } else {
        stLog.error(err);
        modalText = err;
        modalType = 'error';
        showModal = true;
      }
    }
  };
  // Create a HIT, validate hit params, and save it to db
  const createHIT = async (type) => {
    showDialogue = false;
    stLog.info('REQ Mturk: createHITWithHITType');
    const resp = await mturk
      .createHITWithHITType({
        HITTypeId: generatedHITTypeId,
        MaxAssignments: hitParams.maxAssignments,
        LifetimeInSeconds: hitParams.lifetime,
        Question: externalQuestion,
      })
      .promise();
    stLog.info(`RES Mturk: ${resp.$response.httpResponse.statusCode}`);
    const dbResp = await ipcRenderer.invoke(
      'insertHIT',
      {
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
      },
      $live
    );
    if (type === 'single') {
      modalText = dbResp.text;
      modalType = dbResp.type;
      showModal = true;
      stLog.info(modalText);
    }
  };

  // Open save dialogue and validate hit params
  const openSave = async () => {
    userLog.info('Open save HIT Template');
    try {
      await HITSchema.validate(hitParams, { abortEarly: false });
      await loadSavedHITs();
      errors = {};
      whichDialogue = 'save';
      showDialogue = true;
    } catch (err) {
      errors = extractErrors(err);
      userLog.error(`Validation Errors: ${JSON.stringify(errors)}`);
    }
  };

  // Save hit template and validate hit params
  const saveTemplate = async () => {
    userLog.info('Save HIT Template');
    saveError = !!!saveName;
    if (!saveError) {
      if (loadNames.includes(saveName)) {
        saveErrorText = 'This name already exists';
        saveError = true;
        userLog.error(saveErrorText);
      } else {
        try {
          stLog.info('REQ: saveHITTemplate');
          const dbResp = await ipcRenderer.invoke(
            'saveHITTemplate',
            {
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
              numHITs: hitParams.numHITs,
            },
            $live
          );
          modalText = dbResp.text;
          modalType = dbResp.type;
          showDialogue = false;
          showModal = true;
          stLog.info(modalText);
        } catch (err) {
          stLog.error(err);
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
    userLog.info('Open load HIT Template');
    whichDialogue = 'load';
    await loadSavedHITs();
    showDialogue = true;
  };

  // Load hit template
  const loadTemplate = async () => {
    userLog.info('Load HIT Template');
    loadError = !!!loadName;
    if (!loadError) {
      hitParams = loadTemplates.filter((elem) => elem['name'] === loadName)[0];
      showDialogue = false;
    }
  };

  // Delete a hit template
  const deleteTemplate = async () => {
    userLog.info('Delete HIT Template');
    loadError = !!!loadName;
    if (!loadError) {
      stLog.info('REQ: deleteHITTemplate');
      const resp = await ipcRenderer.invoke('deleteHITTemplate', loadName, $live);
      modalText = resp.text;
      modalType = resp.type;
      showModal = true;
      showDialogue = false;
      stLog.info(modalText);
    }
  };

  const clearForm = () => {
    userLog.info('Clear createHIT form');
    errors = {};
    hitParams = {
      assignmentDuration: '',
      description: '',
      lifetime: 86400,
      reward: '',
      title: '',
      autoApprovalDelay: '',
      keywords: '',
      maxAssignments: '',
      numHITs: '',
      externalURL: '',
      selectedQuals: [],
    };
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
  {:else if whichDialogue === 'confirm'}
    <div class="container">
      <form class="w-full">
        <div class="flex flex-col items-center w-full px-3 space-y-2">
          <h2 class="mx-auto mb-2 text-2xl">Duplicate HIT Found!</h2>
          <p class="max-w-md">
            You set Repeat Partipation to 1 but in the past you've made a HIT with the same
            parameters. If you proceed with creating this HIT
            <span class="font-semibold">previous Workers will be able to participate again</span>.
          </p>
          <p class="max-w-md">
            Click confirm to proceed otherwise close this window and use the
            <span class="font-semibold">Recruit button</span>
            on the
            <span class="font-semibold"> Manage HITs page </span>
            to recruit more unique Workers.
          </p>
          <button on:click|preventDefault={() => createHIT('single')} class="button">
            Confirm
          </button>
        </div>
      </form>
    </div>
  {/if}
</Dialogue>
<div class="w-full h-screen" in:fly={{ y: 200, duration: 250 }}>
  <form class="w-full" on:submit|preventDefault={makeHIT}>
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/3 px-3">
        <Input
          label="Title"
          type="text"
          error={errors.title}
          displayError={!!errors.title}
          displayInfo={!!!errors.title && $userSettings.createHITHelpers}
          info={hitParamsInfo.title}
          bind:value={hitParams.title} />
      </div>
      <div class="w-1/3 px-3">
        <Input
          label="Keywords"
          type="text"
          error={errors.keywords}
          displayError={!!errors.keywords}
          displayInfo={!!!errors.keywords && $userSettings.createHITHelpers}
          info={hitParamsInfo.keywords}
          bind:value={hitParams.keywords} />
      </div>
      <div class="w-1/3 px-3">
        <Input
          label="Experiment URL"
          type="text"
          error={errors.externalURL}
          displayError={!!errors.externalURL}
          displayInfo={!!!errors.externalUrl && $userSettings.createHITHelpers}
          info={hitParamsInfo.externalURL}
          bind:value={hitParams.externalURL} />
      </div>
    </div>
    <div class="flex flex-wrap mb-6 -mx-3">
      <div class="w-1/6 px-3">
        <Input
          label="Reward"
          type="text"
          error={errors.reward}
          displayError={!!errors.reward}
          displayInfo={!!!errors.reward && $userSettings.createHITHelpers}
          info={hitParamsInfo.reward}
          bind:value={hitParams.reward} />
      </div>
      <div class="w-1/6 px-3">
        <Input
          label="Auto Approval Delay"
          type="number"
          error={errors.autoApprovalDelay}
          displayError={!!errors.autoApprovalDelay}
          displayInfo={!!!errors.autoApprovalDelay && $userSettings.createHITHelpers}
          info={hitParamsInfo.autoApprovalDelay}
          bind:value={hitParams.autoApprovalDelay} />
      </div>
      <div class="w-1/6 px-3">
        <Input
          label="Duration"
          type="number"
          error={errors.assignmentDuration}
          displayError={!!errors.assignmentDuration}
          displayInfo={!!!errors.assignmentDuration && $userSettings.createHITHelpers}
          info={hitParamsInfo.assignmentDuration}
          bind:value={hitParams.assignmentDuration} />
      </div>
      <div class="w-1/6 px-3">
        <Input
          label="Lifetime"
          type="number"
          error={errors.lifetime}
          displayError={!!errors.lifetime}
          displayInfo={!!!errors.lifetime && $userSettings.createHITHelpers}
          info={hitParamsInfo.lifetime}
          bind:value={hitParams.lifetime} />
      </div>
      <div class="w-1/6 px-3">
        <Input
          label="Unique Workers"
          type="number"
          error={errors.maxAssignments}
          displayError={!!errors.maxAssignments}
          displayInfo={!!!errors.maxAssignments && $userSettings.createHITHelpers}
          info={hitParamsInfo.maxAssignments}
          bind:value={hitParams.maxAssignments} />
      </div>
      <div class="w-1/6 px-3">
        <Input
          label="Repeat Participation"
          type="number"
          error={errors.numHITs}
          displayError={!!errors.numHITs}
          displayInfo={!!!errors.numHITs && $userSettings.createHITHelpers}
          info={hitParamsInfo.numHITs}
          bind:value={hitParams.numHITs} />
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
        {#if $userSettings.createHITHelpers}
          <p class="info-text">{hitParamsInfo.selectedQuals}</p>
        {/if}
      </div>
      <div class="w-2/3 px-3">
        <Input
          label="Description"
          type="textarea"
          error={errors.description}
          displayError={!!errors.description}
          displayInfo={!!!errors.description && $userSettings.createHITHelpers}
          info={hitParamsInfo.description}
          bind:value={hitParams.description} />
      </div>
    </div>
    <hr class="block w-full mt-2 mb-4 border-gray-500" />
    <div class="flex flex-wrap items-center justify-center mb-6 -mx-3 space-x-4">
      <button class="button" type="submit">
        {#if creatingHITs}
          <svg
            id="refresh-icon"
            class="w-6 h-6 text-purple-700 rounded cursor-pointer stroke-current animate-spin"
            viewBox="0 0 24 24"
            stroke-width="2.25"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <path d="M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5" />
          </svg>
        {:else}Create HIT{/if}
      </button>
      <button class="button" on:click|preventDefault={openLoad}> Load Template </button>
      <button class="button" on:click|preventDefault={openSave}> Save Template </button>
      <button class="button" on:click|preventDefault={clearForm}> Clear </button>
    </div>
  </form>
</div>
