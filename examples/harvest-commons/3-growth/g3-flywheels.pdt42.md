# Sketch the flywheels

## More farms, better boxes

The core indirect network effect: more farms make boxes more varied, more varied boxes keep more
households, more subscriptions attract more farms.

```pdt42
:::flywheel
id: fw-core
title: More farms, better boxes
type: indirect-network
relationship: r-farmer-household
loop:
  - More farms
  - More variety per box
  - More households subscribe
  - Predictable demand attracts farms
bottleneck: Farms joining — supply is constrained
metric: Active farms per neighbourhood
:::
```

## Planning data

Every season of pre-orders makes the harvest forecast better, which makes pre-ordering safer.

```pdt42
:::flywheel
id: fw-data
title: Planning data
type: data
reinforces: fw-core
loop:
  - More pre-orders
  - Better forecasts
  - Less waste, better prices
  - More pre-orders
bottleneck: Seasons are long — one turn per year
metric: Forecast error per variety
:::
```

## Back-office lock-in

Farms that run invoicing and planning in the back-office rarely leave.

```pdt42
:::flywheel
id: fw-lockin
title: Back-office lock-in
type: lock-in
reinforces: fw-core
relationship: r-farmer-restaurant
loop:
  - Farms run their business in the back-office
  - Switching costs grow
  - Farms stay and invest in the platform
bottleneck: The back-office must be good enough on its own
metric: Share of farm revenue invoiced through the platform
:::
```
