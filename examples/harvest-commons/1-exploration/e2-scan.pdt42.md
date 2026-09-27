# Scan the ecosystem

```pdt42
:::canvas
id: cv-ecosystem-scan
canvas: ecosystem-scan
:::
```

## Find buyers for the week's harvest

Every Monday farmers call restaurants and the wholesaler to place what they expect to harvest.
Whatever is left goes to the wholesaler at its price.

```pdt42
:::job
id: j-find-buyers
title: Find buyers for the week's harvest
arena: ar-selling
entities: e-farmers, e-restaurants, e-wholesaler
job-step: locate
:::
```

## Sell at the Saturday market

Farmers and households meet in person. Households love it but cannot plan around it.

```pdt42
:::job
id: j-market
title: Sell at the Saturday market
arena: ar-selling
entities: e-farmers, e-households
job-step: execute
:::
```

## Drive produce into town

Each farm loads its own van for a handful of deliveries.

```pdt42
:::job
id: j-drive
title: Drive produce into town
arena: ar-delivery
entities: e-farmers, e-restaurants
job-step: execute
:::
```
