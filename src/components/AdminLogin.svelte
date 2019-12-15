<script>
  import { auth } from '../utils.js';

  let email;
  let password;
  let invalidPassword = false;
  let invalidUser = false;
  let invalidMessage = '';
  let invalidUserMessage = '';
  let loading = false;

  const login = async (ev) => {
    invalidPassword = false;
    invalidUser = false;
    if (!password) {
      invalidPassword = true;
      invalidMessage = 'A password is required';
    } else {
      loading = true;
      try {
        loading = true;
        await auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        if (error.code === 'auth/wrong-password') {
          invalidPassword = true;
          invalidMessage = 'Incorrect password';
        } else if (error.code === 'auth/user-not-found') {
          invalidUser = true;
          invalidUserMessage = 'No account with this email found';
        }
      }
      loading = false;
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
                <h1 class="title">Welcome</h1>
                <h2 class="subtitle is-size-6">Please login to continue</h2>
              </div>

            </div>
          </div>
          <div class="card-content">
            <form on:submit|preventDefault={login}>
              <div class="field">
                <label class="label">Email</label>
                <div class="control has-icons-left">
                  <input
                    class={invalidUser ? 'input is-danger' : 'input'}
                    type="email"
                    placeholder=""
                    name="email"
                    bind:value={email} />
                  <span class="icon is-small is-left">
                    <i class="fas fa-envelope" />
                  </span>
                </div>
                {#if invalidUser}
                  <p class="help is-danger">{invalidUserMessage}</p>
                {/if}
              </div>
              <div class="field">
                <label class="label">Password</label>
                <div class="control has-icons-left">
                  <input
                    class={invalidPassword ? 'input is-danger' : 'input'}
                    type="password"
                    placeholder=""
                    name="password"
                    bind:value={password} />
                  <span class="icon is-small is-left">
                    <i class="fas fa-lock" />
                  </span>
                </div>
                {#if invalidPassword}
                  <p class="help is-danger">{invalidMessage}</p>
                {/if}
              </div>
              <div class="field">
                <p class="control">
                  <button class="button is-primary" class:is-loading={loading} type="submit">
                    Login
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
