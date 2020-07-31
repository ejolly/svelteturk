<script>
  import { createEventDispatcher } from 'svelte';
  const { ipcRenderer } = require('electron');
  import Modal from '../components/Modal.svelte';

  // VARIABLES
  let showModal = false;
  let modalText;
  let modalType;
  const dispatch = createEventDispatcher();

  // FUNCTIONS
  // Tell App.svelte to "route" to a different page
  const changeState = (state) => {
    dispatch('changeState', {
      state: state,
    });
  };
  // Export all nedb files to json
  const exportData = async () => {
    try {
      const resp = await ipcRenderer.invoke('export')
      modalText = resp.text;
      modalType = resp.type;
    } catch (err) {
      console.error(err);
      modalText = err;
      modalType = 'error';
    }
    showModal = true;
  }
</script>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<aside class="menu has-text-white">
  <p class="menu-label">Menu</p>
  <ul class="menu-list">
    <li>
      <a href="javascript:;" on:click={() => changeState('home')}>Home</a>
    </li>
    <li>
      <a href="javascript:;" on:click={() => changeState('createHIT')}>Create HIT</a>
    </li>
    <li>
      <a href="javascript:;" on:click={() => changeState('reviewHITs')}>Review HITs</a>
    </li>
  </ul>
  <hr>
  <button class="button is-info" on:click={exportData}>Export Data</button>
</aside>
