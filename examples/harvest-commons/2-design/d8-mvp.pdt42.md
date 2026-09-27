# Set up the Minimum Viable Platform

## Twelve-week box pilot

Four farms, one courier and three hubs in one neighbourhood for one summer. Orders run through a
shared spreadsheet and a group chat before a line of the app is written.

```pdt42
:::mvp
id: mvp-box-pilot
title: Twelve-week box pilot
experiences: x-weekly-box
base:
  - 2,000 households from the market list
  - Three cafés willing to host a shelf
implementation: Concierge — the cooperative composes boxes by hand from a spreadsheet
status: running
:::

:::assumption
id: a-renew
title: Households stay for a whole season
mvp: mvp-box-pilot
kind: attraction
riskiest: yes
test: Offer the season subscription in week 10
criteria: 70 % renew
status: open
:::

:::assumption
id: a-hub-trust
title: Households trust a café shelf with their food
mvp: mvp-box-pilot
kind: trust
test: Track boxes left uncollected
criteria: Fewer than 5 % uncollected per week
status: validated
:::

:::assumption
id: a-margin
title: An 8 % commission covers hubs and routes
mvp: mvp-box-pilot
kind: business-model
riskiest: yes
test: Book every cost of the pilot per box
criteria: Contribution margin positive by week 8
status: open
:::
```

```pdt42
:::canvas
id: cv-mvp-box
canvas: mvp
of: mvp-box-pilot
:::
```

## Winter planning circle

One round of crop planning with three chefs and three farms before the next season.

```pdt42
:::mvp
id: mvp-chefs-circle
title: Winter planning circle
experiences: x-chefs-table
base:
  - Three chefs who already buy at the market
implementation: Wizard of Oz — pre-orders on paper, confirmed by phone
status: planned
:::

:::assumption
id: a-commit
title: Chefs commit to volumes five months ahead
mvp: mvp-chefs-circle
kind: attraction
riskiest: yes
test: Two planning evenings in the college kitchen
criteria: Each chef commits to at least three varieties
:::

:::assumption
id: a-delivery-trust
title: Chefs accept deliveries from farms they never met
mvp: mvp-chefs-circle
kind: trust
test: Rotate deliveries between the three farms
criteria: No chef cancels a delivery
:::

:::assumption
id: a-chef-price
title: Chefs pay the commission on top of the farm price
mvp: mvp-chefs-circle
kind: business-model
test: Quote prices including the commission
criteria: All three chefs sign the pre-order
:::
```

```pdt42
:::canvas
id: cv-mvp-chefs
canvas: mvp
of: mvp-chefs-circle
:::
```
