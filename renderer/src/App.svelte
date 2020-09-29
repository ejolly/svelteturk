<script>
  import { onMount } from 'svelte';

  import Tailwindcss from './Tailwindcss.svelte';
  import SidebarHeader from './components/SidebarHeader.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Footer from './components/Footer.svelte';
  import Modal from './components/Modal.svelte';
  import CreateHIT from './pages/CreateHIT.svelte';
  import Home from './pages/Home.svelte';
  import ManageHITs from './pages/ManageHITs.svelte';
  import ReviewAssts from './pages/ReviewAssts.svelte';
  import { logger } from './components/logger.js';

  const { ipcRenderer } = require('electron');

  // VARIABLES
  // credentials passed from ipcMain "backend"
  let awsKey;
  let awsSecret;
  // current app view ("state")
  let currentState = 'createHIT';
  // main Mturk object on which API methods are called
  let mturk;
  // Mturk object availability status (e.g. no internet connection)
  let mturkReady = false;
  // Mturk mode
  let live = false;
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
    const endpoint = live
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
      mturk.live = live;
      mturkReady = true;
      logger.info(`Mturk ready with endpoint: ${mturk.endpoint.host}`);
      window.mturk = mturk;
    } catch (err) {
      logger.error(err);
      modalText = err;
      modalType = 'error';
      showModal = true;
    }
  };

  // Handle getting credentials from ipcMain "backend" and
  // immediately initializing the Mturk API
  // triggered on component mount
  const getCredentials = async () => {
    const credentials = await ipcRenderer.invoke('getCredentials');
    awsKey = credentials.accessKeyId;
    awsSecret = credentials.secretAccessKey;
    initMTurk();
  };

  // Change the app view ("state"); triggered by Sidebar
  const updateState = (ev) => {
    currentState = ev.detail.state;
  };

  // Switch Mturk modes; triggered by SidebarHeader
  const switchMode = (ev) => {
    mturkReady = false;
    live = ev.detail.live;
    initMTurk();
  };

  // Get credentials on component load
  onMount(async () => {
    await getCredentials();
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
    @apply text-xs italic text-purple-500;
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
<div class="w-screen h-screen">
  <!-- Sidebar, fixed position and width-->
  <nav class="fixed top-0 left-0 w-64 p-4 ml-1 bg-white">
    <SidebarHeader {live} {mturkReady} on:switchMturkMode={switchMode} />
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
