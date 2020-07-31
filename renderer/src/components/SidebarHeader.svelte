<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';

  // INPUTS
  export let mturkReady;
  export let live;

  // VARIABLES
  const dispatch = createEventDispatcher();
  // eslint-disable-next-line no-nested-ternary
  $: mode = mturkReady && window.navigator.onLine ? (live ? 'Live' : 'Sandbox') : 'Error';
  let showModal = false;
  let modalType;
  let modalText;

  // FUNCTIONS
  // Tell App.svelte to reinitialize Mturk object with different endpoint
  const switchMturkMode = () => {
    if (window.navigator.onLine) {
      dispatch('switchMturkMode', {
        live
      });
    } else {
      modalText = 'No internet connectivity!';
      modalType = 'error';
      showModal = true;
    }
  };
</script>

<Modal {showModal} {modalType}>
  <p>{modalText}</p>
</Modal>
<div class="has-text-centered">
  <h1 class="is-size-3">Svelte-Turk</h1>
  <div class="tags has-addons is-centered">
    <span class="tag is-dark">mode</span>
    <span
      class="tag"
      class:is-primary={mturkReady && live}
      class:is-danger={!mturkReady}
      class:is-warning={mturkReady && !live}>
      {mode}
    </span>
  </div>
  <div class="field">
    <input
      id="sandboxSwitch"
      type="checkbox"
      class="switch is-rounded"
      class:is-primary={live}
      bind:checked={live}
      on:change={switchMturkMode} />
    <label for="sandboxSwitch" />
  </div>
  <hr />
</div>
