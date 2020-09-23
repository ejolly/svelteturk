# Svelte Turk modes of operation

Using the toggle at the top of the sidebar, you can quickly switch between sandbox or live modes for interacting with Mturk.

### Sandbox mode

Sandbox mode is useful for testing HIT and Assignment creation and management. It functions in exactly the same way as live mode, but no money is ever drawn from your account. Instead your account will always have a balance of $10,000 and HITs created in this mode are only visible in the [worker sandbox](https://workersandbox.mturk.com/) so they cannot be completed in the regular Mturk marketplace. 

This mode is extremely useful for making sure your experiment or task works before going live. It's **highly recommended** you test your HITs before launching them live to ensure a positive experience for Workers and that your task is working as you expect it to (e.g. correct data collection, logic, no broken links, etc). Svelte Turk allows you to **fully test** HITs created in this mode including: HIT creation, management, assignment approval, rejection, and bonus payments. 

### Live mode

Live mode is the main [Mturk marketplace](https://worker.mturk.com/) where HITs are available for completion by any and all Workers. Make sure you are *absolutely certain* you want to create a HIT in live mode before toggling this on in Svelte Turk! **Approved assignments and bonuses paid in live mode will directly debit your account.** To prevent any false starts, Svelte Turk will always launch in sandbox mode, and require you to manually toggle live mode.