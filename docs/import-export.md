# Importing and Exporting SvelteTurk Data

As noted on the [settings and configuration page](settings.md), all of SvelteTurk's data lives in `$HOME/svelteturk` where `$HOME` is your home directory (i.e. `~` on macOS). You shouldn't really need to edit these files directly, but it's helpful to know where they live so you can make copies and backups as needed. In future versions, SvelteTurk will let you configure this location.

## Import

Currently, the only way to manually add data to SvelteTurk's database is to replace the files in `svelteturk/db`. SvelteTurk uses [NeDb](https://github.com/louischatriot/nedb) for its database and because it stores data separately for [sandbox or live mode](modes.md), it has has 8 distinct files:

- `assts.db`
- `hits.db`
- `workers.db`
- `hitTemplates.db`
- `assts_sandbox.db`
- `hits_sandbox.db`
- `workers_sandbox.db`
- `hitTemplates_sandbox.db`

You can replace these files with equivalent ones from another computer on which you have SvelteTurk running, to use that database instead.

> [!ATTENTION]
> Overwriting these `.db` files is a **destructive operation!** Currently, SvelteTurk has no way to combine data from different sources into a single database. So make sure you back up these files before replacing them in case you ever need to access that data. Or export them from within SvelteTurk as described below.

## Export

While you can copy the `.db` files as noted above to export data, they are not saved in a format that's particularly user friendly. Instead, SvelteTurk lets you export all its data in JSON format using the Export Data button in the sidebar. Many popular programs and languages like R and Python support reading and operating on `JSON` data. Clicking Export will create the following files in a location of your choosing, named with today's date:

- `assts_{YYYY-MM-DD}.json` all Assignment data
- `hits_{YYYY-MM-DD}.json` all HIT data
- `workers_{YYYY-MM-DD}.json` all Worker data
- `hitTemplates_{YYYY-MM-DD}.json` all HIT templates you've saved

> [!WARNING]
> The `JSON` files exported this way **cannot** be used for importing purposes. In other words, they're useful when you directly want to look at and analyze SvelteTurk data in another program. If you plan on backing up or transferring this data to another computer, you should manually copy the `.db` files rather than using the Export button.
