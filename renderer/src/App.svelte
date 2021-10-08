<script>
  import { onMount } from 'svelte';

  import Tailwindcss from './Tailwindcss.svelte';
  import SidebarHeader from './components/SidebarHeader.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Footer from './components/Footer.svelte';
  import Splash from './components/Splash.svelte';
  import Modal from './components/Modal.svelte';
  import CreateHIT from './pages/CreateHIT.svelte';
  import Home from './pages/Home.svelte';
  import ManageHITs from './pages/ManageHITs.svelte';
  import ManageWorkers from './pages/ManageWorkers.svelte';
  import ReviewAssts from './pages/ReviewAssts.svelte';
  import { stLog, userLog } from './components/logger.js';
  import { userSettings, live } from './components/store.js';
  import { wait } from './components/utils';

  const { ipcRenderer } = require('electron');

  // VARIABLES
  let loading = true;
  let ready = false;
  let updating = false;
  let updateComplete = false;
  // credentials passed from ipcMain "backend"
  let awsKey;
  let awsSecret;
  // current app view ("state")
  let currentState = 'home';
  // main Mturk object on which API methods are called
  let mturk;
  // Mturk object availability status (e.g. no internet connection)
  let mturkReady = false;
  // Mturk mode
  let showModal = false;
  let modalText;
  let modalType;
  // app routes/views/states
  const stateMap = [
    {
      state: 'home',
      title: 'Home',
      component: Home,
    },
    {
      state: 'createHIT',
      title: 'Create HIT',
      component: CreateHIT,
    },
    {
      state: 'manageHITs',
      title: 'Manage HITs',
      component: ManageHITs,
    },
    {
      state: 'manageWorkers',
      title: 'Manage Workers',
      component: ManageWorkers,
    },
    {
      state: 'reviewAssts',
      title: 'Review Assignments',
      component: ReviewAssts,
    },
  ];

  // Reactive component "routing" based on the currentState
  $: [currentObj] = stateMap.filter((obj) => obj.state === currentState);
  $: title = currentObj.title;
  $: component = currentObj.component;

  // FUNCTIONS
  // Initialize the Mturk API object
  const initMTurk = () => {
    const endpoint = $live
      ? 'https://mturk-requester.us-east-1.amazonaws.com'
      : 'https://mturk-requester-sandbox.us-east-1.amazonaws.com';
    try {
      // eslint-disable-next-line no-undef
      mturk = new AWS.MTurk({
        region: 'us-east-1',
        endpoint,
        // eslint-disable-next-line no-undef
        accessKeyId: awsKey,
        // eslint-disable-next-line no-undef
        secretAccessKey: awsSecret,
      });
      mturk.live = $live;
      mturkReady = true;
      stLog.info(`Mturk ready with endpoint: ${mturk.endpoint.host}`);
      window.mturk = mturk;
    } catch (err) {
      stLog.error(err);
      modalText = err;
      modalType = 'error';
      showModal = true;
    }
  };

  // Allow accessing 'backend' API via a global call() function
  const bindAPI = () => {
    window.callResult = undefined;
    window.call = async function (args) {
      const resp = await ipcRenderer.invoke(...arguments);
      window.callResult = resp;
    };
    stLog.info('API now available in window');
  };

  // Startup app by:
  // 1. Getting aws credentials
  // 2. Reading user settings from db and saving to a svelte store
  // 3. Initializing mturk object
  const initialize = async () => {
    stLog.info('REQ: initialize');
    const resp = await ipcRenderer.invoke('initialize');
    if (resp.userWantsToUpdate) {
      updating = true;
    } else {
      awsKey = resp.awsCredentials.accessKeyId;
      awsSecret = resp.awsCredentials.secretAccessKey;
      userSettings.set(resp.userSettings);
      initMTurk();
      bindAPI();
      await wait(3000);
      ready = true;
      stLog.info('app ready');
    }
  };

  // Change the app view ("state"); triggered by Sidebar
  const updateState = (ev) => {
    currentState = ev.detail.state;
    userLog.info(`Page changed to ${currentState}`);
  };

  // Switch Mturk modes; triggered by SidebarHeader
  const switchMode = (ev) => {
    userLog.info(`Mturk live changed to ${$live}`);
    mturkReady = false;
    initMTurk();
  };

  // Get credentials on component load
  onMount(async () => {
    await initialize();
    ipcRenderer.on('updateComplete', (ev, msg) => {
      updateComplete = true;
    });
  });
</script>

<style global>
  @import '../../node_modules/typeface-quantico/index.css';
  .header {
    margin-top: 3.41rem;
    margin-left: 19rem;
  }
  .main {
    margin-left: 19rem;
    margin-top: 9rem;
  }
  .button {
    @apply px-4 py-2 text-gray-800 bg-gray-200 rounded font-quantico;
  }
  .button:hover:enabled {
    @apply text-purple-600 bg-purple-100;
  }
  .button:active {
    @apply outline-none;
  }
  .button:focus {
    @apply outline-none;
  }
  .button:disabled {
    @apply opacity-50 cursor-not-allowed select-none;
  }
  .error-text {
    @apply text-xs italic text-red-500;
  }
  .info-text {
    @apply text-xs text-purple-500;
  }
  .table-container {
    @apply overflow-auto;
    height: 60%;
  }
  td {
    @apply border-t border-gray-300 px-4 py-3 text-gray-700 truncate;
    max-width: 11rem;
  }
</style>

<svelte:window bind:online={mturkReady} />
<Tailwindcss />
<Modal bind:showModal bind:modalType bind:modalText />
<!-- Main app container full window size not responsive-->
{#if !ready}
  <Splash {updating} {updateComplete} />
{:else}
  <div class="w-screen h-screen">
    <!-- Sidebar, fixed position and width-->
    <nav class="fixed top-0 left-0 w-64 p-4 ml-1">
      <SidebarHeader {mturkReady} on:switchMturkMode={switchMode} />
      <Sidebar {currentState} on:changeState={updateState} />
    </nav>
    <!-- Page Title fixed to prevent scrolling with content-->
    <header
      class="fixed top-0 left-0 w-full text-5xl text-gray-900 bg-transparent header font-quantico">
      {title}
      <hr class="w-64 border-t-2 border-gray-500" />
    </header>
    <!-- Main page, flex but offset width of sidebar and header -->
    <div class="flex pr-4 mr-8 main">
      <div class="w-full overflow-auto">
        <svelte:component this={component} {mturk} />
      </div>
    </div>
    <!-- Footer for contact info -->
    <Footer />
  </div>
{/if}
