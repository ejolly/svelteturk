<script>
  const { shell } = require('electron');

  const openGH = () => {
    shell.openExternal('https://github.com/ejolly/svelte-turk');
  };
</script>

<style>
  li {
    @apply inline-flex items-center px-2 py-1 mx-4 text-lg text-gray-800 rounded cursor-pointer;
  }
  .tooltip .tooltip-text {
    @apply invisible p-1 absolute z-50 inline-block text-sm rounded-lg bg-gray-700 text-white -ml-10 -mt-10;
  }
  .tooltip:hover .tooltip-text {
    @apply visible;
  }
  svg {
    @apply w-6 h-6;
  }
</style>

<footer class="flex flex-col items-center p-0 border-t-2 border-gray-500">
  <ul>
    <li class="tooltip">
      <a href="mailto:eshin.jolly@gmail.com">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke-width="1.75"
          stroke="#718096"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" />
          <line x1="10" y1="14" x2="21" y2="3" />
          <path d="M21 3L14.5 21a.55 .55 0 0 1 -1 0L10 14L3 10.5a.55 .55 0 0 1 0 -1L21 3" />
        </svg>
      </a>
      <span class="tooltip-text">Email Eshin</span>
    </li>
    <li class="tooltip">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke-width="1.75"
        stroke="#718096"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        on:click={openGH}>
        <path stroke="none" d="M0 0h24v24H0z" />
        <path
          d="M9 19c-4.286 1.35-4.286-2.55-6-3m12 5v-3.5c0-1 .099-1.405-.5-2 2.791-.3 5.5-1.366
          5.5-6.04a4.567 4.567 0 0 0 -1.333 -3.21 4.192 4.192 0 00-.08-3.227s-1.05-.3-3.476
          1.267a12.334 12.334 0 0 0 -6.222 0C6.462 2.723 5.413 3.023 5.413 3.023a4.192 4.192 0 0 0
          -.08 3.227A4.566 4.566 0 004 9.486c0 4.64 2.709 5.68 5.5 6.014-.591.589-.56 1.183-.5 2V21" />
      </svg>
      <span class="tooltip-text">Github source code</span>
    </li>
    <li class="tooltip">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke-width="1.75"
        stroke="#718096"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" />
        <path
          d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12
          8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308
          1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497
          -3.753C20.18 7.773 21.692 5.25 22 4.009z" />
      </svg>
      <span class="tooltip-text">Twitter @Eshjolly</span>
    </li>
  </ul>
</footer>
