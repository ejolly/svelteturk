<script>
  import { onMount } from 'svelte';

  // import toast from 'bulma-toast';
  import CreateHIT from './components/CreateHIT.svelte';
  import Home from './components/Home.svelte';

  const { ipcRenderer } = require('electron');

  let awsKey;
  let awsSecret;
  let currentState = 'home';
  let mturk;
  let mturkReady = false;
  let sandbox = true;
  $: endpoint = sandbox
    ? 'https://mturk-requester-sandbox.us-east-1.amazonaws.com'
    : 'https://mturk-requester.us-east-1.amazonaws.com';
  const stateMap = [
    {
      state: 'home',
      title: 'Home',
      component: Home
    },
    /* { */
    /*   state: 'hits', */
    /*   title: 'HIT Management', */
    /*   component: HITs, */
    /* }, */
    /* { */
    /*   state: 'firebase-participants', */
    /*   title: 'Participants', */
    /*   component: Participants, */
    /* }, */
    {
      state: 'mturk-createhit',
      title: 'Create HIT',
      component: CreateHIT
    }
  ];

  $: [currentObj] = stateMap.filter((obj) => obj.state === currentState);
  $: title = currentObj.title;
  $: component = currentObj.component;

  const receiveCredentials = (ev, credentials) => {
    console.log('receiving credentials...');
    awsKey = credentials.accessKeyId;
    awsSecret = credentials.secretAccessKey;
    console.log(`Key: ${awsKey}\nSecret: ${awsSecret}`);
  };

  ipcRenderer.on('credentials', receiveCredentials);

  const createHIT = () => {
    console.log('create HIT');
  };

  const initMTurk = () => {
    // eslint-disable-next-line no-undef
    mturk = new AWS.MTurk({
      region: 'us-east-1',
      endpoint,
      // eslint-disable-next-line no-undef
      accessKeyId: awsKey,
      // eslint-disable-next-line no-undef
      secretAccessKey: awsSecret
    });
    mturkReady = true;
    console.log(`Sandbox mode ${sandbox}`);
  };

  const accountBalance = async () => {
    try {
      const resp = await mturk.getAccountBalance().promise();
      console.log(resp.AvailableBalance);
      // toast.toast({
      //   message: `Account Balance: $${resp.AvailableBalance}`,
      //   type: 'is-primary',
      //   position: 'top-center',
      //   pauseonHover: true,
      //   dismissible: true,
      //   duration: 5000,
      //   animate: { in: 'fadeInDown', out: 'fadeOutUp' }
      // });
    } catch (error) {
      console.error(error);
    }
  };

  const logcreateHIT = (ev) => {
    ipcRenderer.send('insert', ev.detail);
  };
  onMount(() => {
    ipcRenderer.send('getCredentials');
  });
</script>

<style>
  .is-scrollable {
    overflow-y: auto;
  }

  .dashboard {
    display: flex;
    flex-direction: row;
  }
  .dashboard.is-full-height {
    height: 100vh;
  }
  .dashboard-panel {
    display: flex;
    flex-direction: column;
    padding: 2rem 1.5rem;
    flex: 0 0 25rem;
    height: 100%;
  }
  .dashboard-panel.is-medium {
    flex: 0 0 20rem;
  }
  .dashboard-panel-header {
    margin-bottom: 2rem;
  }
  .dashboard-main {
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
</style>

<svelte:head>
  <script src="https://sdk.amazonaws.com/js/aws-sdk-2.590.0.min.js" on:load={initMTurk}>

  </script>
</svelte:head>
<div class="dashboard is-full-height">
  <div class="dashboard-panel is-medium has-thick-padding has-background-grey-lighter">
    <header class="dashboard-panel-header">
      <div class="has-text-centered">
        <h1 class="is-size-3">Svelte-Turk</h1>
        <span class="tag" class:is-primary={mturkReady} class:is-danger={!mturkReady}>
          Mturk
          {#if !mturkReady}Not{/if}
          Ready
        </span>
        <label class="checkbox is-block">
          <input type="checkbox" bind:checked={sandbox} on:change={initMTurk} />
          Sandbox
        </label>
        <hr />
      </div>
    </header>
    <div class="dashboard-panel-content">
      <aside class="menu has-text-white">
        <p class="menu-label">Menu</p>
        <ul class="menu-list">
          <li>
            <a href="javascript:;" on:click={() => (currentState = 'home')}>Home</a>
          </li>
          <li>
            <a href="javascript:;" on:click={() => (currentState = 'mturk-createhit')}>
              Create HIT
            </a>
          </li>
          <li>
            <a on:click={createHIT}>Review HITs</a>
          </li>
        </ul>
      </aside>
    </div>
  </div>
  <div class="dashboard-main is-scrollable">
    <section class="section">
      <p class="title is-size-2">{title}</p>
      <hr />
      <section>
        <svelte:component this={component} {mturk} on:createHIT={logcreateHIT} />
      </section>
    </section>
  </div>
</div>
