# Design the learning engine

## Farmers: from market stall to planned harvest

Most farms start with a stall and a guess. The engine takes them to a harvest sold before it is
sown — and, after a season, to co-owning the platform.

```pdt
:::learning-engine
id: le-farmers
entity: e-farmers
entry:
  - Invited by a member farm
  - Met at the Saturday market
onboarding:
  - Publishing a first availability list
getting-better:
  - Planning crops against pre-orders
new-opportunity:
  - Becoming a co-owner of the platform
evolves-to: e-coop
:::
```

## Restaurants: from buyer to co-planner

Chefs start by ordering what is available and end up shaping what gets grown.

```pdt
:::learning-engine
id: le-restaurants
entity: e-restaurants
entry:
  - A chef recommends the app
onboarding:
  - Understanding what is in season, and from whom
getting-better:
  - Committing volumes a season ahead
:::
```

## Households: from shopper to food citizen

Households start as customers; some become the people who bring their street along.

```pdt
:::learning-engine
id: le-households
entity: e-households
entry:
  - Customer at the Saturday market
onboarding:
  - Cooking what is in the box
getting-better:
  - Eating with the seasons
:::
```

## Services

### Storefront in a day

A volunteer helps each new farm set up its profile, photos and first availability list, on site.

```pdt
:::service
id: s-storefront
title: Storefront in a day
for: e-farmers
stage: onboarding
kind: empowering
channel: ch-app
:::
```

### Crop-planning circles

In winter, farmers and chefs plan the next season together, with the pre-orders on the table.

```pdt
:::service
id: s-planning-circles
title: Crop-planning circles
for: e-farmers, e-restaurants
stage: getting-better
kind: empowering
supports: t-share-menus, t-preorder
:::
```

### Become a co-owner

After one season, a farm can buy a share and vote in the members' assembly.

```pdt
:::service
id: s-membership
title: Become a co-owner
for: e-farmers
stage: new-opportunity
kind: empowering
:::
```

### Season guide for chefs

A one-page view of what each member farm grows, week by week.

```pdt
:::service
id: s-season-guide
title: Season guide for chefs
for: e-restaurants
stage: onboarding
kind: other
channel: ch-app
:::
```

### Recipes for the box

Three recipes with every box; households add their own.

```pdt
:::service
id: s-recipes
title: Recipes for the box
for: e-households
stage: onboarding
kind: other
channel: ch-app
:::
```

### Farm days

Twice a season, member farms open their gates for harvest days with families.

```pdt
:::service
id: s-farm-days
title: Farm days
for: e-households, e-farmers
stage: getting-better
kind: other
:::
```

### Shared route planner

Bundles the pick-ups of all farms into one route per day for the couriers.

```pdt
:::service
id: s-route-planner
title: Shared route planner
for: e-farmers, e-couriers
kind: enabling
supports: t-book-route, t-deliver-restaurant, t-pickup
channel: ch-app
:::
```
