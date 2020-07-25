<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  const changeState = (state) => {
    dispatch('changeState', {
      state: state,
    });
  };
</script>

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
</aside>
