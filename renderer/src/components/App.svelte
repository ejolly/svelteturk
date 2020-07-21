<script>
  // consume electron API
  const { ipcRenderer } = require('electron');
  import { onMount } from 'svelte';

  let myItems = [];
  let newItem = '';

  const findAll = (ev, items) => {
    myItems = [];
    if (items) {
      items.forEach((item) => (myItems = [...myItems, item]));
      console.log(myItems);
    }
  };

  const insert = () => {
    console.log('adding item');
    ipcRenderer.send('insert', { item: newItem });
    newItem = '';
  };

  const clearAll = () => {
    console.log('clearing items');
    ipcRenderer.send('clearAll');
  };

  const refresh = () => ipcRenderer.send('findAll');
  const backup = () => ipcRenderer.send('export'); 

  // Event handlers for responses from the ipcMain process
  ipcRenderer.on('inserted', refresh);
  ipcRenderer.on('foundAll', findAll);
  ipcRenderer.on('clearedAll', findAll);

  onMount(() => refresh());
</script>

<main>
  <form on:submit|preventDefault={insert}>
    <input type="text" placeholder="new item" bind:value={newItem} />
    <button type="submit">Add item</button>
    <button type="button" on:click={clearAll}>Clear all</button>
    <button type="button" on:click={backup}>Export DB</button>
  </form>
  <ul>
    {#each myItems as item}
      <li>{item.item}</li>
    {/each}
  </ul>
</main>

