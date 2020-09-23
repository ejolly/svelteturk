# Creating HITs

Creating HITs is as simple as using the sidebar to navigate to the Create HIT page and filling out a form. A description of each form field whether it's required is provided below.  

**Note:** *HITs created via Svelte Turk will not show up in your [requestor dashboard](https://requester.mturk.com/) on Amazon's site. This is not a limitation of Svelte Turk, but a general limitation of Mturk itself which does not display HITs created programmatically outside of the requestor dashboard. Instead you should [manage HITs](manage.md) directly from within Svelte Turk or use a SDK library like [Boto (python)](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) for interacting with the Mturk API.*

*picture here*

| Field    |   Required    | Description |
| -------- | :-----------: | ----------: |
| col 1 is | left-aligned  |       $1600 |
| col 2 is |   centered    |         $12 |
| col 3 is | right-aligned |          $1 |


--- 

## Multiple Assignments vs multiple HITs

To create...

## Saving and Loading templates

For convenience, Svelte Turk lets you save and load as many versions of this HIT form as you'd like. This makes it easy to create new HITs with the same parameters as previous ones. To do so use the "Save" and "Load" buttons below the HIT form. Only valid HIT forms may be saved, so you will need to provide the required inputs to each field just as if you were planning to create a HIT directly. 

*picture here*