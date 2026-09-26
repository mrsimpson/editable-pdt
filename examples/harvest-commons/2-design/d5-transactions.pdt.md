# Identify the elementary transactions and channels

## Channels

### Harvest app

The web app where farms publish availability, kitchens pre-order and couriers see their routes.
Its real job is to replace phone calls and haggling with three standard forms.

```pdt
:::channel
id: ch-app
title: Harvest app
medium: digital
components:
  - Weekly availability list
  - Standard pre-order contract
  - Shared route booking
  - Ratings after every delivery
improvement: A pre-order takes two minutes instead of a round of phone calls, and the price band is known upfront
:::
```

### Neighbourhood hubs

Pick-up shelves in cafés and bakeries, refrigerated where needed.

```pdt
:::channel
id: ch-hubs
title: Neighbourhood hubs
medium: physical
components:
  - Refrigerated shelves
  - Pick-up codes
improvement: Households collect on their way home; couriers deliver ten boxes to one stop instead of ten doors
:::
```

## Farmer ↔ restaurant

### Share menu plans

Chefs share the dishes they plan for next season; farms answer with what will be at its best.

```pdt
:::transaction
id: t-share-menus
title: Share menu plans
relationship: r-farmer-restaurant
from: e-restaurants
to: e-farmers
direction: two-way
value-unit: Dishes planned per season
happening: no
channel: ch-app
kind: knowledge
motivation: m-farmers-restaurants
:::
```

### Pre-order the season

Restaurants commit to kilos per variety and week, within a price band.

```pdt
:::transaction
id: t-preorder
title: Pre-order the season
relationship: r-farmer-restaurant
from: e-restaurants
to: e-farmers
value-unit: Committed kilos per variety and week
happening: no
channel: ch-app
kind: money
motivation: m-restaurants-farmers
job: j-find-buyers
:::
```

### Deliver the weekly order

Already happening for a few chefs — by van, by phone, on the farm's own schedule.

```pdt
:::transaction
id: t-deliver-restaurant
title: Deliver the weekly order
relationship: r-farmer-restaurant
from: e-farmers
to: e-restaurants
value-unit: Crates delivered per week
happening: yes
channel: ch-app
kind: goods
job: j-drive
:::
```

### Credit the farm

The farm's name on the menu, and a rating after every delivery.

```pdt
:::transaction
id: t-credit-farm
title: Credit the farm on the menu
relationship: r-farmer-restaurant
from: e-restaurants
to: e-farmers
value-unit: Menu mentions and delivery ratings
happening: no
channel: ch-app
kind: reputation
motivation: m-restaurants-farmers-rep
:::
```

## Farmer ↔ household

### Publish the harvest forecast

Every Monday each farm posts what it expects to harvest that week.

```pdt
:::transaction
id: t-publish-harvest
title: Publish the harvest forecast
relationship: r-farmer-household
from: e-farmers
to: e-households
value-unit: Kilos available per variety this week
happening: no
channel: ch-app
kind: data
:::
```

### Subscribe to a weekly box

Households pay monthly for a box of a chosen size.

```pdt
:::transaction
id: t-subscribe
title: Subscribe to a weekly box
relationship: r-farmer-household
from: e-households
to: e-farmers
value-unit: Monthly box subscription
happening: no
channel: ch-app
kind: money
motivation: m-households-farmers
:::
```

### Pick up the box

Households collect on their way home from a shelf in a café or bakery.

```pdt
:::transaction
id: t-pickup
title: Pick up the box at a hub
relationship: r-farmer-household
from: e-farmers
to: e-households
value-unit: One box per week
happening: no
channel: ch-hubs
kind: goods
motivation: m-farmers-households
job: j-market
:::
```

### Rate the box

Households rate each box and share how they cooked it — the farms' most valuable feedback.

```pdt
:::transaction
id: t-rate-box
title: Rate the box and share a recipe
relationship: r-farmer-household
from: e-households
to: e-farmers
value-unit: Rating and recipe per box
happening: no
channel: ch-app
kind: feedback
motivation: m-households-feedback
:::
```

## Farmer ↔ courier

### Book a shared route

Farms book a slot on the day's route instead of driving themselves.

```pdt
:::transaction
id: t-book-route
title: Book a slot on the shared route
relationship: r-farmer-courier
from: e-farmers
to: e-couriers
value-unit: Delivery slots per week
happening: no
channel: ch-app
kind: money
motivation: m-farmers-couriers
:::
```
