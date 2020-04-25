<script>
  // Main app page that guards administration panel via firebase login
  import { onMount } from 'svelte';
  import AdminLogin from './components/AdminLogin.svelte';
  import AWSLogin from './components/AWSLogin.svelte';
  import AdminPanel from './components/AdminPanel.svelte';
  import { db, auth } from './utils.js';

  let loggedIn = false;
  let missingAWS = false;
  let AWSConfig;

  // On App startup check if a user is logged in and show them the login form if not
  // if they are check if aws credentials exists in the database, if they do persist
  // them and pass them to AdminPanel, otherwise ask user to submit them for storage
  onMount(async () => {
    try {
      await auth.onAuthStateChanged(async (user) => {
        if (user) {
          db.ref('admin').once('value', (snapshot) => {
            if (!snapshot.exists()) {
              loggedIn = true;
              missingAWS = true;
            } else {
              AWSConfig = snapshot.val();
              loggedIn = true;
              missingAWS = false;
            }
          });
        } else {
          loggedIn = false;
        }
      });
    } catch (error) {
      console.error(error);
    }
  });
</script>

{#if !loggedIn}
  <AdminLogin />
{:else if missingAWS}
  <AWSLogin on:savedAWS={() => (missingAWS = false)} />
{:else}
  <AdminPanel {AWSConfig} />
{/if}
