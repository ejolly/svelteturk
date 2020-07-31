<script>
  // Reusuable notification component that displays the top of the screen
  import { fly } from 'svelte/transition';

  // INPUTS
  export let showModal = false;
  export let modalType = 'notification';

  // FUNCTIONS
  // Change modal style
  const setType = () => {
    let color;
    if (modalType === 'notification') {
      color = 'is-info';
    } else if (modalType === 'error') {
      color = 'is-danger';
    } else if (modalType === 'success') {
      color = 'is-primary';
    }
    return `notification ${color}`;
  };
</script>

<style>
  .notification {
    position: absolute;
    z-index: 999;
    top: 0.1rem;
    left: 45%;
    width: 35%;
    text-align: center;
  }
</style>

{#if showModal}
  <div class={setType()} transition:fly={{ y: -200, duration: 500 }}>
    <button class="delete" on:click={() => (showModal = false)} />
    <slot />
  </div>
{/if}
