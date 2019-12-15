<script>
  import toast from 'bulma-toast';
  import { auth } from '../utils.js';
  import Home from './Home.svelte';
  import HITs from './HITs.svelte';
  import CreateHIT from './CreateHIT.svelte';
  import Participants from './Participants.svelte';

  export let cred;
  let currentState = 'home';
  let mturk;
  let loading = false;
  const stateMap = [
    {
      state: 'home',
      title: 'Home',
      component: Home
    },
    {
      state: 'hits',
      title: 'HIT Management',
      component: HITs
    },
    {
      state: 'firebase-participants',
      title: 'Participants',
      component: Participants
    },
    {
      state: 'mturk-createhit',
      title: 'Create HIT',
      component: CreateHIT
    }
  ];

  $: [currentObj] = stateMap.filter((obj) => obj.state === currentState);
  $: title = currentObj.title;
  $: component = currentObj.component;

  const logout = async () => {
    try {
      loading = true;
      await auth.signOut();
    } catch (error) {
      console.error(error);
    }
    loading = false;
  };

  const createHIT = () => {
    console.log('create HIT');
  };

  const initMTurk = () => {
    // eslint-disable-next-line no-undef
    mturk = new AWS.MTurk({
      region: 'us-east-1',
      endpoint: 'https://mturk-requester-sandbox.us-east-1.amazonaws.com',
      accessKeyId: cred.accessKeyId,
      secretAccessKey: cred.secretAccessKey
    });
  };

  const accountBalance = async () => {
    try {
      const resp = await mturk.getAccountBalance().promise();
      toast.toast({
        message: `Account Balance: $${resp.AvailableBalance}`,
        type: 'is-primary',
        position: 'top-center',
        pauseonHover: true,
        duration: 5000,
        animate: { in: 'fadeIn', out: 'fadeOut' }
      });
    } catch (error) {
      console.error(error);
    }
  };
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
  .dashboard-panel.left {
    flex: 0 0 25rem;
  }
  .dashboard-panel.right {
    flex: 0 0 25rem;
  }
  .dashboard-panel.has-thick-padding {
    padding: 3rem 2rem;
  }
  .dashboard-panel.is-one-quarter {
    flex: 0 0 25%;
  }
  .dashboard-panel.is-half {
    flex: 0 0 50%;
  }
  .dashboard-panel.is-one-third {
    flex: 0 0 33.3333333333%;
  }
  .dashboard-panel.is-small {
    flex: 0 0 15rem;
  }
  .dashboard-panel.is-medium {
    flex: 0 0 20rem;
  }
  .dashboard-panel.is-large {
    flex: 0 0 30rem;
  }
  .dashboard-panel-header.is-centered,
  .dashboard-panel-content.is-centered,
  .dashboard-panel-footer.is-centered {
    display: flex;
    justify-content: center;
  }
  .dashboard-panel-header {
    margin-bottom: 2rem;
  }
  .dashboard-panel-main {
    flex: 1;
  }
  .dashboard-panel-footer {
    margin-top: 2rem;
  }
  .dashboard-main {
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .dashboard-main .navbar.is-fixed-top {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
  }
  .dashboard-main .footer {
    flex: 1;
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
        <hr />
      </div>
    </header>
    <div class="dashboard-panel-content">
      <aside class="menu has-text-white">
        <p class="menu-label">Home</p>
        <ul class="menu-list">
          <li>
            <a href="javascript:;" on:click={() => (currentState = 'home')}>Overview</a>
          </li>
          <li>
            <a href="javascript:;" on:click={accountBalance}>Account Balance</a>
          </li>
        </ul>
        <p class="menu-label">Firebase</p>
        <ul class="menu-list">
          <li>
            <a href="javascript:;" on:click={() => (currentState = 'firebase-participants')}>
              Participants
            </a>
            <a href="javascript:;" on:click={createHIT}>Stimuli</a>
          </li>
        </ul>
        <p class="menu-label">HITs</p>
        <ul class="menu-list">
          <li>
            <a href="javascript:;" on:click={() => (currentState = 'mturk-createhit')}>
              Create HITs
            </a>
          </li>
          <li>
            <a href="javascript:;" on:click={createHIT}>Replenish HITs</a>
          </li>
          <li>
            <a href="javascript:;" on:click={createHIT}>End HITs</a>
          </li>
          <li>
            <a href="javascript:;" on:click={createHIT}>Review HITs</a>
          </li>
        </ul>
        <p class="menu-label">Assignments</p>
        <ul class="menu-list">
          <li>
            <a href="javascript:;" on:click={createHIT}>Approve Assignments</a>
          </li>
          <li>
            <a href="javascript:;" on:click={createHIT}>See Assignments</a>
          </li>
        </ul>
        <p class="menu-label">
          <button class="button is-primary" class:is-loading={loading} on:click={logout}>
            Log Out
          </button>
        </p>
      </aside>
    </div>
  </div>
  <div class="dashboard-main is-scrollable">
    <section class="section">
      <p class="title is-size-2">{title}</p>
      <hr />
      <section>
        <svelte:component this={component} />
      </section>
    </section>
  </div>
</div>
