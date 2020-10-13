# Mturk basics and terminology

> [!NOTE]
> This page is for folks curious for more details on how Mturk works. Understanding this level of detail is not strictly required for using SvelteTurk, but can be helpful. For the brief version just follow the guidelines in the suggested usage section. 

Mturk terminology and functioning can be a bit confusing at times depending on your use case. For clarification on what specific terms mean checkout the [glossary](_glossary.md). You can also click on any linked words through this documentation site to jump to a glossary definition if it exists. For the essentials, just read the next section and feel free to skip the subsequent sections of this page.

## Suggested Usage Scenarios

A key decision you need to make when using SvelteTurk (and Mturk more generally) is how you prefer to handle repeat participation. The two scenarios below reflect the different options available to you and how to perform them in SvelteTurk. 

### You only want unique Workers to complete your task

**When creating HITs for the first time**

1. If your task is hosted on a website that does not block repeat participants or you prefer to let Mturk handle all repeat blocking
  - Always set Repeat Participation to 1 when creating HITs in SvelteTurk
  - If you know that you'll never need more than 9 unique Workers, set Unique Workers to 9 or fewer (20% Mturk fee)
  - If you plan on recruiting more than 9 unique Workers now or at any more in the future, set Unique Workers to 10 or more (40% Mturk fee)
2. If your task is hosted on a website that can handle blocking repeat participants
   - Always set Unique Workers to 9 (or fewer)
   - Set Repeat Participation to 2 (or more)
   - The total number of Workers you will be able to recruit will be Unique Workers x Repeat Participation (20% Mturk fee)

**When trying to recruit more Workers**

1. If your task is hosted on a website that does not block repeat participant or you prefer to let Mturk handle all repeat blocking
  - Use the Recruit button on the Manage HITs page
2. If your task is hosted on a website that can handle blocking repeat participants
  - Repeat step 2 above, and ignore the duplicate HIT warning from SvelteTurk 

### You don't care about repeat Workers

**When creating HITs for the first time**

- Always set Unique Workers to 9 (or fewer) as this saves you money (20% Mturk fee)
- Set Repeat Participation to 2 (or more)

**When recruiting more Workers**

- Create additional HITs as before and ignore the duplicate HIT warning from SvelteTurk

> [!TIP]
> If you stick to the guidelines above, you won't have to think about the details in the sections below as SvelteTurk will always let you know if repeat participation may occur without you realizing.

---

## How Mturk organizes and presents HITs to Workers

It can be helpful to understand how tasks are presented to workers by Mturk and how they are handled by Requestors for payment. Consider the following diagram:


```
HIT-Group-->                      Workers see these
            HIT-->                Nested in HIT-Groups. If there is more than 1, Workers can repeatedly complete that task.  
                  Assignment-->   Requestors pay based on these. Workers are unaware of them. 
```

Illustrated above is how Mturk is approximately organized:  

- When Workers search or view a HIT on Mturk they are actually viewing a HIT-Group  
- HIT-Groups contain 1 or more HITs that can be completed for payment     
- HITs submitted for payment are called Assignments  
- Rewards and Bonuses are paid **per Assignment** not per HIT or directly to a Worker    

When a Worker "accepts" a HIT for completion in actuality they are:  

- "Occupying" one of the available HITs in a HIT-Group. 
  - If a HIT-Group only contains 1 HIT, a Worker **cannot** accept your task more than once
  - The number of HITs in a HIT-Group determines the total times a Worker can complete your task
- "Occupying" one of the available Assignments for a HIT. 
  - If a HIT has no Assignments, **no Workers** can complete your task
  - The number of Assignments for a HIT determined the number of **unique Workers** that can complete your task

This means that as a Worker tries to accept and complete your task Mturk is simultaneously checking that there are are enough Assignments (unique slots for each Worker) available for completion, and that this particular Worker has not exceeded the number of HITs available in that HIT group **independent** of the number of Assignments. 


### Automatic HIT-Groups

To make matters a bit more confusing, Mturk **automatically** groups HITs together if all their details are identical. To see how this interacts with Mturk's organization an example might help. Let's say you create one HIT on a Monday called "My task" with 10 Assignments and then create a second HIT on the subsequent Friday with the same exact title and details, but 5 Assignments. On Monday Workers will see a HIT-Group called "My task" with 1 HIT available for completion. On Friday Workers will see **the same** HIT-Group, but now with 2 HITs available for completion. Those Workers, who already completed your task on Monday will be able to work on it again one more time on Friday. Those Workers who never completed your task on Monday will be able to complete it twice on Friday. 

At the same time, the differing number of Assignments means that in total, only **5 unique Workers** will be able to complete your task twice: 5 (of the 10) Assignments from Monday 1 HIT each, and 5 (of 5) Assignments from Friday 1 HIT each. Unless you add more Assignments to the HIT you launched on Friday, the remaining 5 unique Workers from Monday will not be able to see or complete your task. Of course, there's no guarantee that the same Workers from Monday will show up again on Friday (in all likelihood they won't unless you have specifically notified them), so you always run the risk of **fewer** than 5 unique Workers who participated 2x each.



## Two different "styles" for using Mturk

These details often lead Requestors to use Mturk in two distinct ways depending on their needs and considerations regarding repeat participation:

1. Create **N** HITs each containing **X** Assignments
  - A Worker sees **1 HIT-Group** with **N** HITs which they can complete repeatedly **N** times
  - **X** unique Workers will be able to complete this task **N** times
  - More common in machine-learning style "labeling tasks"
2. Create 1 HIT with **X** Assignments
  - A Worker sees **1 HIT-Group** with 1 HIT which they can complete once
  - **X** unique Workers will be able to complete this task once 
  - More common in social science (e.g. Psychology) experiments
