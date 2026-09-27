# Characterise the network

## Farm ↔ restaurant network

Differentiated, regional, high-frequency and fairly monogamous: chefs stay with farms they trust.
Liquidity comes slowly, but the network effect should not plateau early — variety keeps adding
value. Tactics: a strong single-user tool for farms and a marquee chef to pull the others.

```pdt42
:::network
id: n-kitchen
relationship: r-farmer-restaurant
supply: differentiated
symmetry: asymmetric
location: regional
tenancy: multi
frequency: high
value: medium
exclusivity: monogamous
curve: Slow S-curve; value keeps growing with variety, bounded by the region
tactics: single-user-value, marquee, trust
:::
```

```pdt42
:::canvas
id: cv-network-kitchen
canvas: network-properties
of: r-farmer-restaurant
:::
```

## Farm ↔ household network

Local, low value per order, polygamous: likely to plateau once a neighbourhood has enough farms.
Community content and recipes are the sustainable tactic at this order value.

```pdt42
:::network
id: n-box
relationship: r-farmer-household
supply: differentiated
symmetry: asymmetric
location: local
tenancy: multi
frequency: high
value: low
exclusivity: polygamous
curve: Plateaus per neighbourhood after roughly ten farms
tactics: community-content, nesting
:::
```

```pdt42
:::canvas
id: cv-network-box
canvas: network-properties
of: r-farmer-household
:::
```
