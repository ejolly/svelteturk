<script>
  import { onMount } from 'svelte';

  let showSpinner = false;

  onMount(() => {
    setTimeout(() => {
      showSpinner = true;
    }, 1800);
  });
</script>

<style>
  .loader {
    border-top-color: #000;
    animation: spinner 1.5s linear infinite;
    margin-top: 12rem;
  }
  @keyframes spinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .grow {
    animation: grow 1.5s linear;
  }
  @keyframes grow {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .logo {
    @apply text-purple-400 font-quantico;
    font-size: 3rem;
  }
  .move-down {
    animation: logo 1.5s linear;
  }
  @keyframes logo {
    from {
      transform: translateY(-10rem);
    }
    to {
      transform: translateY(0px);
    }
  }
  .logo-text {
    font-size: 6rem;
    animation: logo-text 1.5s linear;
  }
  @keyframes logo-text {
    from {
      transform: translateY(10rem);
    }
    to {
      transform: translateY(0px);
    }
  }
</style>

<div class="flex items-center justify-center w-screen h-screen bg-gray-100">
  {#if showSpinner}
    <div class="w-20 h-20 ease-linear border-8 border-purple-400 rounded-full loader" />
  {/if}
  <div class="absolute grow">
    <div class="inline-flex items-center p-2">
      <svg
        class="w-10 h-10 mb-12 text-purple-400 fill-current stroke-current move-down"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20">
        <path
          d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0
      01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0
      000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115
      11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364
      0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0
      01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
      </svg>
      <sup class="logo move-down">Svelte</sup>
      <span class="logo-text font-quantico">Turk</span>
    </div>
  </div>
</div>
