# Analyse the motivations to exchange value

What each role gives, or could give, to each other. Money, reputation and feedback are mapped on
purpose: they are what drives quality up.

```pdt42
:::canvas
id: cv-matrix
canvas: motivations-matrix
:::
```

## Between farms and kitchens

### Heirloom varieties grown to order

Farmers can grow what a chef plans a menu around — varieties no wholesaler stocks.

```pdt42
:::motivation
id: m-farmers-restaurants
from: e-farmers
to: e-restaurants
gives: Heirloom varieties grown to order
status: potential
kind: goods
:::
```

### Volumes committed months ahead

Restaurants can commit to volumes before the season starts, so farmers plant against demand.

```pdt42
:::motivation
id: m-restaurants-farmers
from: e-restaurants
to: e-farmers
gives: Volumes committed months ahead
status: potential
kind: money
:::
```

### The farm's name on the menu

A restaurant that names its farm on the menu gives the farm a reputation it cannot buy.

```pdt42
:::motivation
id: m-restaurants-farmers-rep
from: e-restaurants
to: e-farmers
gives: The farm's name on the menu
status: potential
kind: reputation
:::
```

### Vegetables picked the day before

Households get what supermarkets cannot offer: vegetables picked the day before.

```pdt42
:::motivation
id: m-farmers-households
from: e-farmers
to: e-households
gives: Vegetables picked the day before
status: current
kind: goods
:::
```

### A season-long subscription

A household that subscribes for a season gives a farm a demand it can plan against.

```pdt42
:::motivation
id: m-households-farmers
from: e-households
to: e-farmers
gives: A season-long subscription to plan against
status: potential
kind: money
:::
```

### Ratings and recipes

Households rate every box and share recipes — feedback that tells farmers what to grow.

```pdt42
:::motivation
id: m-households-feedback
from: e-households
to: e-farmers
gives: Ratings and recipes for every box
status: potential
kind: feedback
:::
```

## Around the harvest

### Delivery without driving into town

Couriers spare farmers the drive into town during the busiest weeks.

```pdt42
:::motivation
id: m-couriers-farmers
from: e-couriers
to: e-farmers
gives: Delivery without driving into town
status: potential
kind: services
:::
```

### Routes booked in advance

Farmers can book weekly routes in advance, which gives couriers a steady income.

```pdt42
:::motivation
id: m-farmers-couriers
from: e-farmers
to: e-couriers
gives: Weekly routes booked in advance
status: potential
kind: money
:::
```

### Bread and cheese in the same order

Artisans add bread and cheese to the same order, so households buy one box instead of three.

```pdt42
:::motivation
id: m-artisans-households
from: e-artisans
to: e-households
gives: Bread and cheese in the same order
status: current
kind: goods
:::
```

### Surplus produce at fair prices

Artisans take the farms' surplus at fair prices and turn it into goods that keep.

```pdt42
:::motivation
id: m-farmers-artisans
from: e-farmers
to: e-artisans
gives: Surplus produce at fair prices
status: potential
kind: goods
:::
```

## Impact

The cooperative can give the City Food Council what it lacks: evidence that regional sourcing works.

```pdt42
:::motivation
id: m-coop-city
from: e-coop
to: e-city
gives: Data on local share and food miles
status: potential
kind: data
:::
```
