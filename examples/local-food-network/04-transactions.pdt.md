# Transactions

What flows between the entities. Existing transactions already happen at the market stall;
potential ones are what the platform makes possible.

## Channels

### Harvest App

The web app where households subscribe, farms publish their harvest and couriers see their routes.

```pdt
:::channel
id: ch-app
title: Harvest App
medium: digital
:::
```

### Neighbourhood Hubs

Pick-up shelves in cafés, bakeries and community centres, refrigerated where needed.

```pdt
:::channel
id: ch-hubs
title: Neighbourhood Hubs
medium: physical
:::
```

### Saturday Market

The original market stall, still the place where people meet the farmers in person.

```pdt
:::channel
id: ch-market
title: Saturday Market
medium: physical
:::
```

## Weekly box

### Publish harvest forecast

Every Monday each farm posts what it expects to harvest that week.

```pdt
:::transaction
id: t-publish-harvest
title: Publish harvest forecast
from: e-farmers
to: e-households
flow: information
status: potential
channel: ch-app
:::
```

### Subscribe to a weekly box

Households pay monthly for a box of a chosen size.

```pdt
:::transaction
id: t-subscribe-box
title: Subscribe to a weekly box
from: e-households
to: e-farmers
flow: money
status: potential
channel: ch-app
:::
```

### Book a delivery route

Farms book a slot in the shared route instead of driving themselves.

```pdt
:::transaction
id: t-book-route
title: Book a delivery route
from: e-farmers
to: e-couriers
flow: money
status: potential
channel: ch-app
:::
```

### Deliver boxes to hubs

Couriers bring the boxes to the neighbourhood hubs on Thursday.

```pdt
:::transaction
id: t-deliver-box
title: Deliver boxes to hubs
from: e-couriers
to: e-households
flow: value
status: potential
channel: ch-hubs
:::
```

### Rate the harvest

Households rate each box and share how they cooked it — the farm's most valuable feedback.

```pdt
:::transaction
id: t-rate-harvest
title: Rate the harvest, share recipes
from: e-households
to: e-farmers
flow: reputation
status: potential
channel: ch-app
:::
```

### Sell add-ons

Artisans already sell at the market; in the box their bread and cheese become add-ons.

```pdt
:::transaction
id: t-sell-addons
title: Sell bread and cheese add-ons
from: e-food-artisans
to: e-households
flow: value
status: existing
channel: ch-market
:::
```

### Buy vegetables at the stall

Today's reality: households buy at the market when they happen to be there.

```pdt
:::transaction
id: t-buy-at-stall
title: Buy vegetables at the stall
from: e-farmers
to: e-households
flow: value
status: existing
channel: ch-market
:::
```

### Pay the commission

Member farms pay the cooperative a commission on everything sold through it.

```pdt
:::transaction
id: t-pay-commission
title: Pay 8 % commission
from: e-farmers
to: e-harvest-coop
flow: money
status: existing
:::
```

## Chef's table

### Pre-order for the season

Restaurants commit to volumes per variety before planting starts.

```pdt
:::transaction
id: t-preorder-season
title: Pre-order the season
from: e-restaurants
to: e-farmers
flow: money
status: potential
channel: ch-app
:::
```

### Share menu plans

Chefs share which dishes they plan, farmers suggest what will be at its best.

```pdt
:::transaction
id: t-share-menus
title: Share menu plans
from: e-restaurants
to: e-farmers
flow: information
status: potential
:::
```

### Coach crop planning

The college helps farms translate pre-orders into a planting plan.

```pdt
:::transaction
id: t-coach-planning
title: Coach crop planning
from: e-college
to: e-farmers
flow: information
status: potential
:::
```

## Around the platform

### Pre-finance seed

The bank lends against committed subscriptions and pre-orders.

```pdt
:::transaction
id: t-prefinance
title: Pre-finance seed and seedlings
from: e-bank
to: e-farmers
flow: money
status: potential
:::
```

### Report local share

The cooperative reports food miles and local share to the council.

```pdt
:::transaction
id: t-report-impact
title: Report local share
from: e-harvest-coop
to: e-city
flow: information
status: potential
:::
```
