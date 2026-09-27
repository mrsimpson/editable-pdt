# Identify the ecosystem and its arenas · Choose the arena to focus on

```pdt42
:::canvas
id: cv-arena-scan
canvas: arena-scan
:::
```

## Regional food system

Around the city, about sixty small farms grow vegetables, fruit and herbs. They sell at weekly
markets, to a regional wholesale market and to a handful of restaurants that call them directly.
Value is exchanged every day — but through phone calls, market stalls and a wholesaler that
hides the farms from the kitchens that cook their produce.

```pdt42
:::ecosystem
id: eco-food
title: Regional food system
context: ecosystem-mobilization
:::
```

## Growing and harvesting

Planning crops, growing them and bringing them in. Seasonal and weather-bound; today planned
against last year's sales rather than against demand.

```pdt42
:::arena
id: ar-growing
title: Growing and harvesting
outcome: The right crops are ready at the right time
steps:
  - Plan the crops
  - Grow
  - Harvest
:::
```

## Selling the harvest

Finding buyers, agreeing quantities and prices, and getting paid. This is where farms lose most
value: up to a fifth of the harvest is never sold. It is our focus — the cooperative already runs
a market stall and knows both farms and customers, and the only incumbent here is the wholesale
market.

```pdt42
:::arena
id: ar-selling
title: Selling the harvest
outcome: Produce reaches a kitchen at a fair price before it spoils
after: ar-growing
focus: yes
steps:
  - Find buyers
  - Agree quantities and prices
  - Deliver
  - Get paid and get feedback
:::
```

## Getting food to kitchens

Transport from the farm into the city. Every farm drives its own van today; this arena enables
selling.

```pdt42
:::arena
id: ar-delivery
title: Getting food to kitchens
outcome: Food arrives fresh, on time and without every farm driving into town
enables: ar-selling
:::
```

## Cooking and eating

What restaurants and households do with the food. Enabled by selling; out of our reach for now.

```pdt42
:::arena
id: ar-cooking
title: Cooking and eating
outcome: Seasonal meals that tell where the food comes from
after: ar-selling
:::
```
