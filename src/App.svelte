<script>
  import { onMount } from 'svelte';
  import AdminLogin from './components/AdminLogin.svelte';
  import AdminPanel from './components/AdminPanel.svelte';
  import Loading from './components/Loading.svelte';
  import { db, auth } from './utils.js';

  let loggedIn;
  let cred;
  let loading = true;

  onMount(async () => {
    try {
      auth.onAuthStateChanged(async (user) => {
        if (!user) {
          loggedIn = false;
        } else {
          const resp = await db.ref('admin/cred').once('value');
          cred = resp.val();
          loggedIn = true;
        }
        loading = false;
      });
    } catch (error) {
      console.error(error);
    }
  });
</script>

{#if loading}
  <Loading>Loading...</Loading>
{:else if loggedIn}
  <AdminPanel {cred} />
{:else}
  <AdminLogin />
{/if}
