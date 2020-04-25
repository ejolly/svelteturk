<script>
  // Simple form component to collect AWS credentials one time and store them in firebase
  import { createEventDispatcher } from 'svelte';
  import { db } from '../utils.js';

  const dispatch = createEventDispatcher();
  let loading = false;
  let accessKeyId = '';
  let secretAccessKey = '';
  let noaccessKeyIdMessage = false;
  let nosecretAccessKeyMessage = false;

  const submit = async () => {
    if (!accessKeyId) {
      noaccessKeyIdMessage = true;
    } else if (!secretAccessKey) {
      nosecretAccessKeyMessage = true;
    } else {
      loading = true;
      try {
        await db.ref('admin').set({
          accessKeyId,
          secretAccessKey
        });
        dispatch('savedAWS');
      } catch (error) {
        console.error(error);
      }
    }
  };
</script>

<section class="section">
  <div class="container">
    <div class="columns is-centered">
      <div class="column is-half">
        <div class="card">
          <div class="card-header">
            <div class="card-header-title is-centered">
              <div class="has-text-centered">
                <h1 class="title">AWS Credentials</h1>
                <h2 class="subtitle is-size-6">
                  Please perform a one time setup by entering your AWS credentials
                </h2>
              </div>
            </div>
          </div>
          <div class="card-content">
            <form on:submit|preventDefault={submit}>
              <div class="field">
                <label class="label">Access Key Id</label>
                <div class="control has-icons-left">
                  <input
                    class="input"
                    type="text"
                    placeholder=""
                    name="accessKeyId"
                    bind:value={accessKeyId}
                    required />
                  <span class="icon is-small is-left">
                    <i class="fas fa-envelope" />
                  </span>
                </div>
                {#if noaccessKeyIdMessage}
                  <p class="help is-danger">Please enter your AWS access key id</p>
                {/if}
              </div>
              <div class="field">
                <label class="label">Access Key Secret</label>
                <div class="control has-icons-left">
                  <input
                    class="input"
                    type="text"
                    placeholder=""
                    name="accessKeySecret"
                    bind:value={secretAccessKey}
                    required />
                  <span class="icon is-small is-left">
                    <i class="fas fa-lock" />
                  </span>
                </div>
                {#if nosecretAccessKeyMessage}
                  <p class="help is-danger">Please enter your AWS access key secret</p>
                {/if}
              </div>
              <div class="field">
                <p class="control">
                  <button class="button is-primary" class:is-loading={loading} type="submit">
                    Submit
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
