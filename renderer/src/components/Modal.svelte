<script>
  let shown = false;
  export function show() {
    shown = true;
  }
  export function hide() {
    shown = false;
  }
</script>

<style>
  .shrink {
    width: 25%;
  }
</style>
<svelte:window
  on:keydown={(e) => {
    if (e.keyCode == 27) {
      hide();
    }
  }} />
{#if shown}
  <div class="modal is-active is-centered">
    <div class="modal-background" />
    <div class="modal-card shrink">
      <header class="modal-card-head">
        <p class="modal-card-title has-text-centered"></p>
        <button on:click={hide} class="delete" aria-label="close" />
      </header>
      <section class="modal-card-body has-text-centered">
        <slot/>
      </section>
      <footer class="modal-card-foot is-centered">
      </footer>
    </div>
  </div>
{/if}
