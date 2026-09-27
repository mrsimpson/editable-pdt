# Assemble the platform experiences

## Chef's table

From the farmer's point of view: sell the season before sowing it, to kitchens that put your name
on the menu.

```pdt42
:::experience
id: x-chefs-table
title: Chef's table
core-entity: e-farmers
roles: e-restaurants, e-couriers
relationship: r-farmer-restaurant
value-proposition: Grow to order for kitchens that plan with you and credit you — and stop guessing what will sell
steps: s-storefront, t-share-menus, s-planning-circles, t-preorder, s-route-planner, t-deliver-restaurant, t-credit-farm
activities:
  - Run the planning circles
  - Match pre-orders to farms
resources:
  - Harvest app
  - Member farm network
costs:
  - Circle facilitation
  - App development
revenues:
  - 8 % commission on pre-orders
:::
```

```pdt42
:::canvas
id: cv-xp-chefs
canvas: platform-experience
of: x-chefs-table
:::
```

## The weekly harvest box

From the household's point of view: what grew this week, from farms you can visit, waiting at the
café around the corner.

```pdt42
:::experience
id: x-weekly-box
title: The weekly harvest box
core-entity: e-households
roles: e-farmers, e-couriers
relationship: r-farmer-household
value-proposition: Eat what grows nearby as easily as shopping at the supermarket, at a fair price
steps: t-publish-harvest, t-subscribe, s-recipes, s-route-planner, t-pickup, t-rate-box, s-farm-days
activities:
  - Compose boxes from forecasts
  - Operate the hubs
resources:
  - Neighbourhood hubs
  - Refrigerated depot
costs:
  - Hub rent in kind (a free box per month)
  - Courier routes
revenues:
  - Monthly subscriptions, 8 % retained
:::
```

```pdt42
:::canvas
id: cv-xp-box
canvas: platform-experience
of: x-weekly-box
:::
```
