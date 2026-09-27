# Map the ecosystem · Portray the entity-roles

## Harvest Commons

Harvest Commons turns guesses into commitments: kitchens commit to what they will cook, farms sow
against it, and the cooperative bundles delivery so no farm drives alone. Its promise to every
member is simple — selling gets easier, and you learn faster inside than outside.

```pdt42
:::platform
id: platform-harvest
title: Harvest Commons
ecosystem: eco-food
brief: br-main
narrative: Food from the farms around the city becomes the easy default for every kitchen
owners: e-coop
core-entity: e-farmers
core-value: A harvest sold before it is sown
ancillary-values:
  - Fresh, traceable food without a market trip
  - Delivery without driving into town
infrastructure:
  - Harvest app
  - Refrigerated depot
  - Neighbourhood pick-up hubs
:::
```

## Harvest Commons Cooperative

The cooperative runs the platform on behalf of its member farms: two staff, a monthly members'
assembly, and a thin commission to live on.

```pdt42
:::entity
id: e-coop
title: Harvest Commons Cooperative
role: owner
type: cooperative owned by its farms
:::
```

## Small-scale farmers

Family farms of two to twenty hectares within sixty kilometres. They grow well; selling is what
costs them — time on the phone, trips into town, and the fifth of the harvest nobody buys.

```pdt42
:::entity
id: e-farmers
title: Small-scale farmers
role: peer-producer
layer: long-tail
type: family businesses
clusters:
  - Vegetable growers
  - Orchards
  - Herb growers
assets:
  - Land within an hour of the city
  - Heirloom varieties
capabilities:
  - Deep knowledge of soil and seasons
potential:
  - Could grow to order for named kitchens
goals:
  - A predictable income before the season starts
pressures:
  - Volatile demand, up to 20 % unsold
  - Rising fuel and labour costs
convenience-gains:
  - Selling as simple as loading a crate
reach-gains:
  - Kitchens that value their varieties
value-gains:
  - Fair prices, paid on time
  - Recognition for their craft
:::
```

## Food artisans

Bakers, cheesemakers and preservers who add variety to every order and buy surplus that would
otherwise spoil.

```pdt42
:::entity
id: e-artisans
title: Food artisans
role: peer-producer
layer: long-tail
type: micro-businesses
clusters:
  - Micro-bakeries
  - Small dairies
  - Preserve makers
capabilities:
  - Turning surplus into products that keep
goals:
  - Steady sales beyond their own shop
convenience-gains:
  - A shelf in every order without a shop of their own
value-gains:
  - Surplus produce at fair prices
:::
```

## Independent restaurants

Chef-owned restaurants that write their menu around the season and can commit to volumes months
ahead — if the supply is reliable.

```pdt42
:::entity
id: e-restaurants
title: Independent restaurants
role: peer-consumer
layer: long-tail
type: chef-owned SMBs, 30–80 covers
clusters:
  - Bistros
  - Fine dining
  - Canteens run by chefs
assets:
  - Bulk demand planned months ahead
potential:
  - Could co-plan crops with farms
goals:
  - Signature dishes built on local produce
pressures:
  - Wholesalers offer little local produce
  - Menus depend on unreliable supply
convenience-gains:
  - One order for many farms
reach-gains:
  - A direct line to the grower
value-gains:
  - A story guests remember
:::
```

## Neighbourhood households

Families and flat shares who care where food comes from but shop at the supermarket because it is
convenient.

```pdt42
:::entity
id: e-households
title: Neighbourhood households
role: peer-consumer
layer: long-tail
type: individuals
clusters:
  - Families
  - Flat shares
potential:
  - Could commit to a season and bring their neighbours
goals:
  - Cook fresh food three to five times a week
pressures:
  - Little time for shopping
  - Food prices rising faster than income
convenience-gains:
  - Pick-up as easy as the corner shop
reach-gains:
  - Farms they can visit
value-gains:
  - Fair price without a market trip
:::
```

## Cargo-bike couriers

A worker-owned courier collective that already delivers parcels within the city ring and wants
regular routes.

```pdt42
:::entity
id: e-couriers
title: Cargo-bike couriers
role: partner
layer: infrastructure
type: worker-owned collective
assets:
  - Zero-emission last-mile fleet
capabilities:
  - Route planning inside the city ring
goals:
  - Regular weekly volumes
pressures:
  - Parcel volumes drop outside the holidays
convenience-gains:
  - Planned volumes instead of last-minute calls
value-gains:
  - Steady income
:::
```

## Regional wholesale market

The established buyer of last resort. In the platform it stays a stakeholder: the outlet for
surplus.

```pdt42
:::entity
id: e-wholesaler
title: Regional wholesale market
role: stakeholder
layer: aggregator
:::
```

## City Food Council

Advises the city on its target of 30 % regional food in public canteens by 2030 — and wants
evidence that local sourcing works.

```pdt42
:::entity
id: e-city
title: City Food Council
role: stakeholder
type: public advisory board
:::
```
