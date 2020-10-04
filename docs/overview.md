# Overview

SvelteTurk's layout is organized with a sidebar on the left and a page view to the right. On successful startup, this view will always be the home page.

## Sidebar 

The sidebar allows you to navigate between different pages in the app and take various actions including

- Switching between sandbox and live mode (*SvelteTurk always starts in sandbox mode*)
- Exporting all of SvelteTurk's data in `JSON` format
- Adjusting various app settings

## Home page

The home page displays an over view of your account including your account balance (*auto-updating when you switch between sandbox and live mode*), number of created HITs, number of submitted Assignments, and unique Workers.

> [!NOTE]
> While your account balance is retrieved from Mturk in realtime, HIT Assignment and Worker counts only reflect data from actions you've performed using SvelteTurk. They do not reflect Mturk actions you've performed outside of SvelteTurk (e.g. directly creating a HIT from the Requestor site).

![](assets/homepage.png)