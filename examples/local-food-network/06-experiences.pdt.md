# Experiences

The experiences the platform is designed around.

## Enabling services

### Harvest forecast and box builder

Turns each farm's forecast into boxes of the sizes households subscribed to.

```pdt
:::service
id: s-box-builder
title: Harvest forecast & box builder
kind: enabling
for: e-farmers, e-households
supports: t-publish-harvest, t-subscribe-box
channel: ch-app
:::
```

### Shared delivery routes

Bundles the pick-ups of all farms into one route per day for the couriers.

```pdt
:::service
id: s-shared-routes
title: Shared delivery routes
kind: enabling
for: e-farmers, e-couriers
supports: t-book-route, t-deliver-box
channel: ch-app
:::
```

### Seasonal pre-order book

Restaurants reserve volumes per variety; farms see the totals while they plan.

```pdt
:::service
id: s-preorder-book
title: Seasonal pre-order book
kind: enabling
for: e-restaurants, e-farmers
supports: t-preorder-season
channel: ch-app
:::
```

## The weekly harvest box

A box of what grew this week, from farms you can visit, waiting at the café around the corner.

```pdt
:::experience
id: x-weekly-box
title: The weekly harvest box
entities: e-farmers, e-households, e-couriers, e-food-artisans
transactions: t-publish-harvest, t-subscribe-box, t-book-route, t-deliver-box, t-sell-addons, t-rate-harvest
services: s-box-builder, s-shared-routes, s-recipes
core-value: One box, from farms within 60 km, picked up around the corner
meaning: Eating what grows nearby becomes as easy as the supermarket.
:::
```

## Chef's table

Restaurants and farms plan the season together, so the menu and the field tell the same story.

```pdt
:::experience
id: x-chefs-table
title: Chef's table
entities: e-restaurants, e-farmers, e-college
transactions: t-preorder-season, t-share-menus, t-coach-planning
services: s-preorder-book, s-planning-circles
core-value: A variety grown for one kitchen
meaning: A dish on the menu starts with a conversation in the field.
:::
```
