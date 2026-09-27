# Identify leverageable assets and moats

## Saturday market customer base

Eight years of market days have built a list of 2,000 households who ask for the farms by name.
Valuable, rare, hard to copy — and the cooperative is organised to use it.

```pdt42
:::asset
id: as-customers
title: Saturday market customer base
vrio: vrio
layer: long-tail
relates-to: e-households, j-market
:::
```

## Trust of the farming community

The cooperative is run by farmers. No outside player would get fourteen farms to share their
harvest plans.

```pdt42
:::asset
id: as-trust
title: Trust of the farming community
vrio: vrio
layer: aggregator
relates-to: e-farmers
:::
```

## Refrigerated depot

A shared cold room at the edge of town. Useful, but others could rent one tomorrow.

```pdt42
:::ignore H002 The depot is a supporting asset by design, not the advantage we build on :::

:::asset
id: as-depot
title: Refrigerated depot
vrio: vr
layer: infrastructure
relates-to: j-drive
:::
```

## Regional wholesale market

The established buyer of last resort. We do not try to replace it: surplus still goes there, but
no longer by default.

```pdt42
:::moat
id: mo-wholesale
title: Regional wholesale market
kind: demand-aggregator
holder: e-wholesaler
layer: aggregator
arena: ar-selling
:::
```
