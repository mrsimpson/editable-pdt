# Build the growth engine

## Recipes bring neighbours

Households share how they cooked their box; every shared recipe links to the neighbourhood's hub.

```pdt
:::growth-loop
id: gl-recipes
title: Recipes bring neighbours
type: ugc
acquires: e-households
feeds: fw-core
equation: new households = recipes shared × views per recipe × sign-up rate
bottleneck: Share of households who publish recipes
cycle-time: One week
metric: Recipes shared per 100 boxes
:::
```

## Chefs recommend farms to chefs

A chef who credits a farm on the menu is asked by peers where the produce comes from.

```pdt
:::growth-loop
id: gl-chef-referrals
title: Chefs recommend farms to chefs
type: viral
acquires: e-restaurants
feeds: fw-lockin
equation: new kitchens = active kitchens × referrals per season × conversion
bottleneck: Referrals per season
cycle-time: One season
metric: Referred kitchens per season
:::
```
