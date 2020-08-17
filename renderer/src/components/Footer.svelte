<script>
  const { shell } = require('electron');

  const openGH = () => {
    shell.openExternal('https://github.com/ejolly/svelte-turk');
  };
</script>

<style>
  li {
    @apply inline-flex items-center px-2 py-1 text-lg text-gray-800 rounded cursor-pointer;
  }
  img {
    @apply w-6 h-6;
  }
  .tooltip .tooltip-text {
    @apply invisible p-1 absolute z-50 inline-block text-sm rounded-lg bg-gray-700 text-white -ml-10 -mt-10;
  }
  .tooltip:hover .tooltip-text {
    @apply visible;
  }
</style>

<footer class="flex flex-col items-center p-1 border-t-2 border-gray-700 b-1">
  <ul>
    <li class="tooltip">
      <a href="mailto:eshin.jolly@gmail.com">
        <img alt="email" src="https://img.icons8.com/ios-filled/50/000000/email-open.png" />
      </a>
      <span class="tooltip-text">Email Eshin</span>
    </li>
    <li class="tooltip">
      <img
        alt="github"
        src="https://img.icons8.com/material-outlined/48/000000/github.png"
        on:click={openGH} />
      <span class="tooltip-text">Github source code</span>
    </li>
  </ul>
</footer>
