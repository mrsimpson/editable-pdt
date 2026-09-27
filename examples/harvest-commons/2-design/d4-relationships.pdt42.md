# Choose the core relationships

The matrix shows most value flowing between farms and the two kinds of kitchens. We design for
farmers first — they are the core entity — in two core relationships; couriers enable both.

## Farmer ↔ restaurant

High volume, planned months ahead: the relationship that lets farms sow against demand.

```pdt42
:::relationship
id: r-farmer-restaurant
title: Farmer ↔ restaurant
between: e-farmers, e-restaurants
core: yes
:::
```

## Farmer ↔ household

Weekly boxes: smaller volumes but many more people, and the cooperative's existing customers.

```pdt42
:::relationship
id: r-farmer-household
title: Farmer ↔ household
between: e-farmers, e-households
core: yes
:::
```

## Farmer ↔ courier

Not a core relationship, but the one that removes the van from every farm.

```pdt42
:::relationship
id: r-farmer-courier
title: Farmer ↔ courier
between: e-farmers, e-couriers
:::
```
