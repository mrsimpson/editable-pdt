# Map the value chain

The value chain of selling the harvest, from the kitchens' needs down to the vans. Today it is
C-shaped: the wholesaler sits between farms and kitchens, and farms are perceived as a commodity.

## Seasonal menu

Restaurants need produce that makes a menu worth coming back for.

```pdt42
:::component
id: c-menu
title: Seasonal menu
arena: ar-selling
visibility: 95
evolution: custom
needs: c-produce, c-ordering
entity: e-restaurants
:::
```

## Fresh food at home

Households want to cook what is in season without planning their week around a market.

```pdt42
:::component
id: c-fresh-food
title: Fresh food at home
arena: ar-selling
visibility: 90
evolution: product
needs: c-produce, c-ordering
entity: e-households
:::
```

## Farm produce

Today bought as anonymous boxes of vegetables. After the plays, each farm's produce is visible and
chosen for its varieties.

```pdt42
:::component
id: c-produce
title: Farm produce
arena: ar-selling
visibility: 45
evolution: commodity
target: custom
needs: c-delivery
entity: e-farmers
:::
```

## Ordering and pricing

Phone calls and haggling today; a standard pre-order after the plays.

```pdt42
:::component
id: c-ordering
title: Ordering and pricing
arena: ar-selling
visibility: 60
evolution: custom
target: product
needs: c-wholesale
:::
```

## Wholesale trading

The wholesaler's price list, which sets the floor for everyone.

```pdt42
:::component
id: c-wholesale
title: Wholesale trading
arena: ar-selling
visibility: 35
evolution: product
entity: e-wholesaler
:::
```

## Last-mile delivery

Every farm with its own van today; shared routes after the plays.

```pdt42
:::component
id: c-delivery
title: Last-mile delivery
arena: ar-delivery
visibility: 25
evolution: custom
target: product
needs: c-vans
:::
```

## Vans and fuel

A commodity.

```pdt42
:::component
id: c-vans
title: Vans and fuel
arena: ar-delivery
visibility: 10
evolution: commodity
:::
```
