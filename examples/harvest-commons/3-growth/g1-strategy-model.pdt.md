# Frame the Platform Strategy Model

Two of the three elements are present. There is no extension platform: nobody extends the
farm back-office yet, and inventing one would dilute the focus.

## Farm back-office

The product side, targeted at the core role: everything a small farm needs to sell without a
phone — come for the tool, stay for the kitchens.

```pdt
:::value-proposition
id: vp-farm-backoffice
title: Farm back-office
kind: product
customer: e-farmers
bundle:
  - Storefront and weekly availability list
  - Harvest forecast from pre-orders
  - Invoicing and payouts
  - Route booking
:::
```

## Kitchen marketplace

Restaurants meet farms and pre-order the season.

```pdt
:::value-proposition
id: vp-kitchen-market
title: Kitchen marketplace
kind: marketplace
relationship: r-farmer-restaurant
:::
```

## Box marketplace

Households subscribe to boxes composed from many farms.

```pdt
:::value-proposition
id: vp-box-market
title: Box marketplace
kind: marketplace
relationship: r-farmer-household
:::
```
