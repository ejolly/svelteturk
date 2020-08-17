<script>
  import { onMount } from 'svelte';

  import Tailwindcss from './Tailwindcss.svelte';
  import SidebarHeader from './components/SidebarHeader.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Footer from './components/Footer.svelte';
  import Modal from './components/Modal.svelte';
  import CreateHIT from './pages/CreateHIT.svelte';
  import Home from './pages/Home.svelte';
  import ReviewHIT from './pages/ReviewHIT.svelte';

  const { ipcRenderer } = require('electron');

  // VARIABLES
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
      state: 'reviewHITs',
      title: 'Review HITs',
      component: ReviewHIT,
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
      mturkReady = true;
      console.log(mturk.endpoint.host);
    } catch (err) {
      console.error(err);
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
    console.log('receiving credentials...');
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

<svelte:window bind:online={mturkReady} />
<Tailwindcss />
<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<div class="flex flex-col w-screen h-screen">
  <!-- Spacer to prevent scrolled text to appear under fixed page titles-->
  <div class="fixed top-0 w-full h-8 bg-white" />
  <!-- Main responsive container -->
  <div class="flex flex-row flex-grow pr-4 overflow-auto">
    <!-- Sidebar, fixed width-->
    <nav class="fixed left-0 w-64 p-4 ml-1 bg-white">
      <SidebarHeader {live} {mturkReady} on:switchMturkMode={switchMode} />
      <Sidebar on:changeState={updateState} />
    </nav>
    <!-- Page, flex but offset width of sidebar -->
    <main class="flex flex-col flex-grow p-4 ml-64">
      <!-- Page Title fixed to prevent scrolling with content-->
      <header class="fixed top-0 w-4/5 h-20 mt-4 text-5xl text-gray-900 bg-white">
        {title}
        <hr class="border-gray-500" />
      </header>
      <!-- Page Content-->
      <div class="flex flex-row flex-grow p-1 mt-24">
        <svelte:component this={component} {mturk} />
      </div>
    </main>
  </div>
  <!-- Footer for contact info -->
  <footer class="fixed bottom-0 w-full bg-white">
    <Footer />
  </footer>
</div>
