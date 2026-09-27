import{i as e,n as t,r as n,t as r}from"./styles-CtwqVDK-.js";var i=`# Identify the ecosystem and its arenas · Choose the arena to focus on

\`\`\`pdt42
:::canvas
id: cv-arena-scan
canvas: arena-scan
:::
\`\`\`

## Regional food system

Around the city, about sixty small farms grow vegetables, fruit and herbs. They sell at weekly
markets, to a regional wholesale market and to a handful of restaurants that call them directly.
Value is exchanged every day — but through phone calls, market stalls and a wholesaler that
hides the farms from the kitchens that cook their produce.

\`\`\`pdt42
:::ecosystem
id: eco-food
title: Regional food system
context: ecosystem-mobilization
:::
\`\`\`

## Growing and harvesting

Planning crops, growing them and bringing them in. Seasonal and weather-bound; today planned
against last year's sales rather than against demand.

\`\`\`pdt42
:::arena
id: ar-growing
title: Growing and harvesting
outcome: The right crops are ready at the right time
steps:
  - Plan the crops
  - Grow
  - Harvest
:::
\`\`\`

## Selling the harvest

Finding buyers, agreeing quantities and prices, and getting paid. This is where farms lose most
value: up to a fifth of the harvest is never sold. It is our focus — the cooperative already runs
a market stall and knows both farms and customers, and the only incumbent here is the wholesale
market.

\`\`\`pdt42
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
\`\`\`

## Getting food to kitchens

Transport from the farm into the city. Every farm drives its own van today; this arena enables
selling.

\`\`\`pdt42
:::arena
id: ar-delivery
title: Getting food to kitchens
outcome: Food arrives fresh, on time and without every farm driving into town
enables: ar-selling
:::
\`\`\`

## Cooking and eating

What restaurants and households do with the food. Enabled by selling; out of our reach for now.

\`\`\`pdt42
:::arena
id: ar-cooking
title: Cooking and eating
outcome: Seasonal meals that tell where the food comes from
after: ar-selling
:::
\`\`\`
`,a=`# Scan the ecosystem

\`\`\`pdt42
:::canvas
id: cv-ecosystem-scan
canvas: ecosystem-scan
:::
\`\`\`

## Find buyers for the week's harvest

Every Monday farmers call restaurants and the wholesaler to place what they expect to harvest.
Whatever is left goes to the wholesaler at its price.

\`\`\`pdt42
:::job
id: j-find-buyers
title: Find buyers for the week's harvest
arena: ar-selling
entities: e-farmers, e-restaurants, e-wholesaler
job-step: locate
:::
\`\`\`

## Sell at the Saturday market

Farmers and households meet in person. Households love it but cannot plan around it.

\`\`\`pdt42
:::job
id: j-market
title: Sell at the Saturday market
arena: ar-selling
entities: e-farmers, e-households
job-step: execute
:::
\`\`\`

## Drive produce into town

Each farm loads its own van for a handful of deliveries.

\`\`\`pdt42
:::job
id: j-drive
title: Drive produce into town
arena: ar-delivery
entities: e-farmers, e-restaurants
job-step: execute
:::
\`\`\`
`,o=`# Identify leverageable assets and moats

\`\`\`pdt42
:::canvas
id: cv-vrio
canvas: vrio
:::
\`\`\`

## Saturday market customer base

Eight years of market days have built a list of 2,000 households who ask for the farms by name.
Valuable, rare, hard to copy — and the cooperative is organised to use it.

\`\`\`pdt42
:::asset
id: as-customers
title: Saturday market customer base
vrio: vrio
layer: long-tail
relates-to: e-households, j-market
:::
\`\`\`

## Trust of the farming community

The cooperative is run by farmers. No outside player would get fourteen farms to share their
harvest plans.

\`\`\`pdt42
:::asset
id: as-trust
title: Trust of the farming community
vrio: vrio
layer: aggregator
relates-to: e-farmers
:::
\`\`\`

## Refrigerated depot

A shared cold room at the edge of town. Useful, but others could rent one tomorrow.

\`\`\`pdt42
:::ignore H002 The depot is a supporting asset by design, not the advantage we build on :::

:::asset
id: as-depot
title: Refrigerated depot
vrio: vr
layer: infrastructure
relates-to: j-drive
:::
\`\`\`

## Regional wholesale market

The established buyer of last resort. We do not try to replace it: surplus still goes there, but
no longer by default.

\`\`\`pdt42
:::moat
id: mo-wholesale
title: Regional wholesale market
kind: demand-aggregator
holder: e-wholesaler
layer: aggregator
arena: ar-selling
:::
\`\`\`
`,s=`# Map the value chain

The value chain of selling the harvest, from the kitchens' needs down to the vans. Today it is
C-shaped: the wholesaler sits between farms and kitchens, and farms are perceived as a commodity.

\`\`\`pdt42
:::canvas
id: cv-value-chain
canvas: wardley-map
of: ar-selling
:::
\`\`\`

## Seasonal menu

Restaurants need produce that makes a menu worth coming back for.

\`\`\`pdt42
:::component
id: c-menu
title: Seasonal menu
arena: ar-selling
visibility: 95
evolution: custom
needs: c-produce, c-ordering
entity: e-restaurants
:::
\`\`\`

## Fresh food at home

Households want to cook what is in season without planning their week around a market.

\`\`\`pdt42
:::component
id: c-fresh-food
title: Fresh food at home
arena: ar-selling
visibility: 90
evolution: product
needs: c-produce, c-ordering
entity: e-households
:::
\`\`\`

## Farm produce

Today bought as anonymous boxes of vegetables. After the plays, each farm's produce is visible and
chosen for its varieties.

\`\`\`pdt42
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
\`\`\`

## Ordering and pricing

Phone calls and haggling today; a standard pre-order after the plays.

\`\`\`pdt42
:::component
id: c-ordering
title: Ordering and pricing
arena: ar-selling
visibility: 60
evolution: custom
target: product
needs: c-wholesale
:::
\`\`\`

## Wholesale trading

The wholesaler's price list, which sets the floor for everyone.

\`\`\`pdt42
:::component
id: c-wholesale
title: Wholesale trading
arena: ar-selling
visibility: 35
evolution: product
entity: e-wholesaler
:::
\`\`\`

## Last-mile delivery

Every farm with its own van today; shared routes after the plays.

\`\`\`pdt42
:::component
id: c-delivery
title: Last-mile delivery
arena: ar-selling
visibility: 25
evolution: custom
target: product
needs: c-vans
:::
\`\`\`

## Vans and fuel

A commodity.

\`\`\`pdt42
:::component
id: c-vans
title: Vans and fuel
arena: ar-selling
visibility: 10
evolution: commodity
:::
\`\`\`
`,c=`# Apply the six Platform Plays

\`\`\`pdt42
:::canvas
id: cv-plays
canvas: platform-plays
:::
\`\`\`

## Farms on top of the chain

Farmers are hidden behind the wholesaler and perceived as a commodity. Bringing them to the top
of the chain — visible, with their varieties and their story — is the central move.

\`\`\`pdt42
:::play
id: pl-producers-up
play: pp2
arena: ar-selling
affects: c-produce
insight: Treat farmers as users with their own storefront; kitchens choose farms, not boxes
:::
\`\`\`

## A standard pre-order

Every deal is negotiated by phone. A standard pre-order — variety, kilos, week, price band — lets
any kitchen commit to any farm in minutes.

\`\`\`pdt42
:::play
id: pl-standard-order
play: pp3
arena: ar-selling
affects: c-ordering
insight: Standardise the pre-order and the weekly availability list; that is the transaction to build
:::
\`\`\`

## Aggregate the kitchens' demand

Individually, restaurants and households are too small to plan for. Aggregated per week and per
variety, they become a demand farms can sow against.

\`\`\`pdt42
:::play
id: pl-aggregate
play: pp6
arena: ar-selling
affects: c-wholesale, c-delivery
insight: Pool orders per week and route; the wholesaler becomes the outlet for surplus only
:::
\`\`\`
`,l=`# Identify the platformization space and consolidate the brief

\`\`\`pdt42
:::canvas
id: cv-brief
canvas: brief-consolidation
:::
\`\`\`

## Hub hosts become a profession

If pick-up points in cafés and bakeries spread, hosting a hub could become a small income for
engaged households — a new role in the ecosystem.

\`\`\`pdt42
:::scenario
id: sc-hub-hosts
title: Hub hosts become a profession
pattern: e4
arena: ar-selling
impact: Households evolve into hosts; delivery cost per box drops as hubs multiply
:::
\`\`\`

## Planned harvests for local kitchens

The platformization space is the selling arena, around two core relationships: farms with
restaurants (planned, high volume) and farms with households (weekly boxes). Couriers are an
ancillary but necessary role.

\`\`\`pdt42
:::brief
id: br-main
title: Planned harvests for local kitchens
arena: ar-selling
entities: e-farmers, e-restaurants, e-households, e-couriers
standardize:
  - Weekly availability list
  - Seasonal pre-order
  - Shared delivery booking
product-side:
  - Farm storefront and harvest forecast
  - Invoicing and payouts
moats: mo-wholesale
:::
\`\`\`
`,u=`# Map the ecosystem · Portray the entity-roles

\`\`\`pdt42
:::canvas
id: cv-ecosystem
canvas: ecosystem
:::
\`\`\`

## Harvest Commons

Harvest Commons turns guesses into commitments: kitchens commit to what they will cook, farms sow
against it, and the cooperative bundles delivery so no farm drives alone. Its promise to every
member is simple — selling gets easier, and you learn faster inside than outside.

\`\`\`pdt42
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
\`\`\`

## Harvest Commons Cooperative

The cooperative runs the platform on behalf of its member farms: two staff, a monthly members'
assembly, and a thin commission to live on.

\`\`\`pdt42
:::entity
id: e-coop
title: Harvest Commons Cooperative
role: owner
type: cooperative owned by its farms
:::
\`\`\`

## Small-scale farmers

Family farms of two to twenty hectares within sixty kilometres. They grow well; selling is what
costs them — time on the phone, trips into town, and the fifth of the harvest nobody buys.

\`\`\`pdt42
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
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-portrait-farmers
canvas: entity-portrait
of: e-farmers
:::
\`\`\`

## Food artisans

Bakers, cheesemakers and preservers who add variety to every order and buy surplus that would
otherwise spoil.

\`\`\`pdt42
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
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-portrait-artisans
canvas: entity-portrait
of: e-artisans
:::
\`\`\`

## Independent restaurants

Chef-owned restaurants that write their menu around the season and can commit to volumes months
ahead — if the supply is reliable.

\`\`\`pdt42
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
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-portrait-restaurants
canvas: entity-portrait
of: e-restaurants
:::
\`\`\`

## Neighbourhood households

Families and flat shares who care where food comes from but shop at the supermarket because it is
convenient.

\`\`\`pdt42
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
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-portrait-households
canvas: entity-portrait
of: e-households
:::
\`\`\`

## Cargo-bike couriers

A worker-owned courier collective that already delivers parcels within the city ring and wants
regular routes.

\`\`\`pdt42
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
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-portrait-couriers
canvas: entity-portrait
of: e-couriers
:::
\`\`\`

## Regional wholesale market

The established buyer of last resort. In the platform it stays a stakeholder: the outlet for
surplus.

\`\`\`pdt42
:::entity
id: e-wholesaler
title: Regional wholesale market
role: stakeholder
layer: aggregator
:::
\`\`\`

## City Food Council

Advises the city on its target of 30 % regional food in public canteens by 2030 — and wants
evidence that local sourcing works.

\`\`\`pdt42
:::entity
id: e-city
title: City Food Council
role: stakeholder
type: public advisory board
:::
\`\`\`
`,ee=`# Analyse the motivations to exchange value

What each role gives, or could give, to each other. Money, reputation and feedback are mapped on
purpose: they are what drives quality up.

\`\`\`pdt42
:::canvas
id: cv-matrix
canvas: motivations-matrix
:::
\`\`\`

## Between farms and kitchens

\`\`\`pdt42
:::motivation
id: m-farmers-restaurants
from: e-farmers
to: e-restaurants
gives: Heirloom varieties grown to order
status: potential
kind: goods
:::

:::motivation
id: m-restaurants-farmers
from: e-restaurants
to: e-farmers
gives: Volumes committed months ahead
status: potential
kind: money
:::

:::motivation
id: m-restaurants-farmers-rep
from: e-restaurants
to: e-farmers
gives: The farm's name on the menu
status: potential
kind: reputation
:::

:::motivation
id: m-farmers-households
from: e-farmers
to: e-households
gives: Vegetables picked the day before
status: current
kind: goods
:::

:::motivation
id: m-households-farmers
from: e-households
to: e-farmers
gives: A season-long subscription to plan against
status: potential
kind: money
:::

:::motivation
id: m-households-feedback
from: e-households
to: e-farmers
gives: Ratings and recipes for every box
status: potential
kind: feedback
:::
\`\`\`

## Around the harvest

\`\`\`pdt42
:::motivation
id: m-couriers-farmers
from: e-couriers
to: e-farmers
gives: Delivery without driving into town
status: potential
kind: services
:::

:::motivation
id: m-farmers-couriers
from: e-farmers
to: e-couriers
gives: Weekly routes booked in advance
status: potential
kind: money
:::

:::motivation
id: m-artisans-households
from: e-artisans
to: e-households
gives: Bread and cheese in the same order
status: current
kind: goods
:::

:::motivation
id: m-farmers-artisans
from: e-farmers
to: e-artisans
gives: Surplus produce at fair prices
status: potential
kind: goods
:::
\`\`\`

## Impact

The cooperative can give the City Food Council what it lacks: evidence that regional sourcing works.

\`\`\`pdt42
:::motivation
id: m-coop-city
from: e-coop
to: e-city
gives: Data on local share and food miles
status: potential
kind: data
:::
\`\`\`
`,te=`# Choose the core relationships

The matrix shows most value flowing between farms and the two kinds of kitchens. We design for
farmers first — they are the core entity — in two core relationships; couriers enable both.

## Farmer ↔ restaurant

High volume, planned months ahead: the relationship that lets farms sow against demand.

\`\`\`pdt42
:::relationship
id: r-farmer-restaurant
title: Farmer ↔ restaurant
between: e-farmers, e-restaurants
core: yes
:::
\`\`\`

## Farmer ↔ household

Weekly boxes: smaller volumes but many more people, and the cooperative's existing customers.

\`\`\`pdt42
:::relationship
id: r-farmer-household
title: Farmer ↔ household
between: e-farmers, e-households
core: yes
:::
\`\`\`

## Farmer ↔ courier

Not a core relationship, but the one that removes the van from every farm.

\`\`\`pdt42
:::relationship
id: r-farmer-courier
title: Farmer ↔ courier
between: e-farmers, e-couriers
:::
\`\`\`
`,ne=`# Identify the elementary transactions and channels

## Channels

### Harvest app

The web app where farms publish availability, kitchens pre-order and couriers see their routes.
Its real job is to replace phone calls and haggling with three standard forms.

\`\`\`pdt42
:::channel
id: ch-app
title: Harvest app
medium: digital
components:
  - Weekly availability list
  - Standard pre-order contract
  - Shared route booking
  - Ratings after every delivery
improvement: A pre-order takes two minutes instead of a round of phone calls, and the price band is known upfront
:::
\`\`\`

### Neighbourhood hubs

Pick-up shelves in cafés and bakeries, refrigerated where needed.

\`\`\`pdt42
:::channel
id: ch-hubs
title: Neighbourhood hubs
medium: physical
components:
  - Refrigerated shelves
  - Pick-up codes
improvement: Households collect on their way home; couriers deliver ten boxes to one stop instead of ten doors
:::
\`\`\`

## Farmer ↔ restaurant

\`\`\`pdt42
:::canvas
id: cv-board-restaurant
canvas: transactions-board
of: r-farmer-restaurant
:::
\`\`\`

### Share menu plans

Chefs share the dishes they plan for next season; farms answer with what will be at its best.

\`\`\`pdt42
:::transaction
id: t-share-menus
title: Share menu plans
relationship: r-farmer-restaurant
from: e-restaurants
to: e-farmers
direction: two-way
value-unit: Dishes planned per season
happening: no
channel: ch-app
kind: knowledge
motivation: m-farmers-restaurants
:::
\`\`\`

### Pre-order the season

Restaurants commit to kilos per variety and week, within a price band.

\`\`\`pdt42
:::transaction
id: t-preorder
title: Pre-order the season
relationship: r-farmer-restaurant
from: e-restaurants
to: e-farmers
value-unit: Committed kilos per variety and week
happening: no
channel: ch-app
kind: money
motivation: m-restaurants-farmers
job: j-find-buyers
:::
\`\`\`

### Deliver the weekly order

Already happening for a few chefs — by van, by phone, on the farm's own schedule.

\`\`\`pdt42
:::transaction
id: t-deliver-restaurant
title: Deliver the weekly order
relationship: r-farmer-restaurant
from: e-farmers
to: e-restaurants
value-unit: Crates delivered per week
happening: yes
channel: ch-app
kind: goods
job: j-drive
:::
\`\`\`

### Credit the farm

The farm's name on the menu, and a rating after every delivery.

\`\`\`pdt42
:::transaction
id: t-credit-farm
title: Credit the farm on the menu
relationship: r-farmer-restaurant
from: e-restaurants
to: e-farmers
value-unit: Menu mentions and delivery ratings
happening: no
channel: ch-app
kind: reputation
motivation: m-restaurants-farmers-rep
:::
\`\`\`

## Farmer ↔ household

\`\`\`pdt42
:::canvas
id: cv-board-household
canvas: transactions-board
of: r-farmer-household
:::
\`\`\`

### Publish the harvest forecast

Every Monday each farm posts what it expects to harvest that week.

\`\`\`pdt42
:::transaction
id: t-publish-harvest
title: Publish the harvest forecast
relationship: r-farmer-household
from: e-farmers
to: e-households
value-unit: Kilos available per variety this week
happening: no
channel: ch-app
kind: data
:::
\`\`\`

### Subscribe to a weekly box

Households pay monthly for a box of a chosen size.

\`\`\`pdt42
:::transaction
id: t-subscribe
title: Subscribe to a weekly box
relationship: r-farmer-household
from: e-households
to: e-farmers
value-unit: Monthly box subscription
happening: no
channel: ch-app
kind: money
motivation: m-households-farmers
:::
\`\`\`

### Pick up the box

Households collect on their way home from a shelf in a café or bakery.

\`\`\`pdt42
:::transaction
id: t-pickup
title: Pick up the box at a hub
relationship: r-farmer-household
from: e-farmers
to: e-households
value-unit: One box per week
happening: no
channel: ch-hubs
kind: goods
motivation: m-farmers-households
job: j-market
:::
\`\`\`

### Rate the box

Households rate each box and share how they cooked it — the farms' most valuable feedback.

\`\`\`pdt42
:::transaction
id: t-rate-box
title: Rate the box and share a recipe
relationship: r-farmer-household
from: e-households
to: e-farmers
value-unit: Rating and recipe per box
happening: no
channel: ch-app
kind: feedback
motivation: m-households-feedback
:::
\`\`\`

## Farmer ↔ courier

\`\`\`pdt42
:::canvas
id: cv-board-courier
canvas: transactions-board
of: r-farmer-courier
:::
\`\`\`

### Book a shared route

Farms book a slot on the day's route instead of driving themselves.

\`\`\`pdt42
:::transaction
id: t-book-route
title: Book a slot on the shared route
relationship: r-farmer-courier
from: e-farmers
to: e-couriers
value-unit: Delivery slots per week
happening: no
channel: ch-app
kind: money
motivation: m-farmers-couriers
:::
\`\`\`
`,re=`# Design the learning engine

\`\`\`pdt42
:::canvas
id: cv-learning
canvas: learning-engine
:::
\`\`\`

## Farmers: from market stall to planned harvest

Most farms start with a stall and a guess. The engine takes them to a harvest sold before it is
sown — and, after a season, to co-owning the platform.

\`\`\`pdt42
:::learning-engine
id: le-farmers
entity: e-farmers
entry:
  - Invited by a member farm
  - Met at the Saturday market
onboarding:
  - Publishing a first availability list
getting-better:
  - Planning crops against pre-orders
new-opportunity:
  - Becoming a co-owner of the platform
evolves-to: e-coop
:::
\`\`\`

## Restaurants: from buyer to co-planner

Chefs start by ordering what is available and end up shaping what gets grown.

\`\`\`pdt42
:::learning-engine
id: le-restaurants
entity: e-restaurants
entry:
  - A chef recommends the app
onboarding:
  - Understanding what is in season, and from whom
getting-better:
  - Committing volumes a season ahead
:::
\`\`\`

## Households: from shopper to food citizen

Households start as customers; some become the people who bring their street along.

\`\`\`pdt42
:::learning-engine
id: le-households
entity: e-households
entry:
  - Customer at the Saturday market
onboarding:
  - Cooking what is in the box
getting-better:
  - Eating with the seasons
:::
\`\`\`

## Services

### Storefront in a day

A volunteer helps each new farm set up its profile, photos and first availability list, on site.

\`\`\`pdt42
:::service
id: s-storefront
title: Storefront in a day
for: e-farmers
stage: onboarding
kind: empowering
channel: ch-app
:::
\`\`\`

### Crop-planning circles

In winter, farmers and chefs plan the next season together, with the pre-orders on the table.

\`\`\`pdt42
:::service
id: s-planning-circles
title: Crop-planning circles
for: e-farmers, e-restaurants
stage: getting-better
kind: empowering
supports: t-share-menus, t-preorder
:::
\`\`\`

### Become a co-owner

After one season, a farm can buy a share and vote in the members' assembly.

\`\`\`pdt42
:::service
id: s-membership
title: Become a co-owner
for: e-farmers
stage: new-opportunity
kind: empowering
:::
\`\`\`

### Season guide for chefs

A one-page view of what each member farm grows, week by week.

\`\`\`pdt42
:::service
id: s-season-guide
title: Season guide for chefs
for: e-restaurants
stage: onboarding
kind: other
channel: ch-app
:::
\`\`\`

### Recipes for the box

Three recipes with every box; households add their own.

\`\`\`pdt42
:::service
id: s-recipes
title: Recipes for the box
for: e-households
stage: onboarding
kind: other
channel: ch-app
:::
\`\`\`

### Farm days

Twice a season, member farms open their gates for harvest days with families.

\`\`\`pdt42
:::service
id: s-farm-days
title: Farm days
for: e-households, e-farmers
stage: getting-better
kind: other
:::
\`\`\`

### Shared route planner

Bundles the pick-ups of all farms into one route per day for the couriers.

\`\`\`pdt42
:::service
id: s-route-planner
title: Shared route planner
for: e-farmers, e-couriers
kind: enabling
supports: t-book-route, t-deliver-restaurant, t-pickup
channel: ch-app
:::
\`\`\`
`,ie=`# Assemble the platform experiences

## Chef's table

From the farmer's point of view: sell the season before sowing it, to kitchens that put your name
on the menu.

\`\`\`pdt42
:::experience
id: x-chefs-table
title: Chef's table
core-entity: e-farmers
roles: e-restaurants, e-couriers
relationship: r-farmer-restaurant
value-proposition: Grow to order for kitchens that plan with you and credit you — and stop guessing what will sell
steps: s-storefront, t-share-menus, s-planning-circles, t-preorder, s-route-planner, t-deliver-restaurant, t-credit-farm
activities:
  - Run the planning circles
  - Match pre-orders to farms
resources:
  - Harvest app
  - Member farm network
costs:
  - Circle facilitation
  - App development
revenues:
  - 8 % commission on pre-orders
:::
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-xp-chefs
canvas: platform-experience
of: x-chefs-table
:::
\`\`\`

## The weekly harvest box

From the household's point of view: what grew this week, from farms you can visit, waiting at the
café around the corner.

\`\`\`pdt42
:::experience
id: x-weekly-box
title: The weekly harvest box
core-entity: e-households
roles: e-farmers, e-couriers
relationship: r-farmer-household
value-proposition: Eat what grows nearby as easily as shopping at the supermarket, at a fair price
steps: t-publish-harvest, t-subscribe, s-recipes, s-route-planner, t-pickup, t-rate-box, s-farm-days
activities:
  - Compose boxes from forecasts
  - Operate the hubs
resources:
  - Neighbourhood hubs
  - Refrigerated depot
costs:
  - Hub rent in kind (a free box per month)
  - Courier routes
revenues:
  - Monthly subscriptions, 8 % retained
:::
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-xp-box
canvas: platform-experience
of: x-weekly-box
:::
\`\`\`
`,ae=`# Set up the Minimum Viable Platform

## Twelve-week box pilot

Four farms, one courier and three hubs in one neighbourhood for one summer. Orders run through a
shared spreadsheet and a group chat before a line of the app is written.

\`\`\`pdt42
:::mvp
id: mvp-box-pilot
title: Twelve-week box pilot
experiences: x-weekly-box
base:
  - 2,000 households from the market list
  - Three cafés willing to host a shelf
implementation: Concierge — the cooperative composes boxes by hand from a spreadsheet
status: running
:::

:::assumption
id: a-renew
title: Households stay for a whole season
mvp: mvp-box-pilot
kind: attraction
riskiest: yes
test: Offer the season subscription in week 10
criteria: 70 % renew
status: open
:::

:::assumption
id: a-hub-trust
title: Households trust a café shelf with their food
mvp: mvp-box-pilot
kind: trust
test: Track boxes left uncollected
criteria: Fewer than 5 % uncollected per week
status: validated
:::

:::assumption
id: a-margin
title: An 8 % commission covers hubs and routes
mvp: mvp-box-pilot
kind: business-model
riskiest: yes
test: Book every cost of the pilot per box
criteria: Contribution margin positive by week 8
status: open
:::
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-mvp-box
canvas: mvp
of: mvp-box-pilot
:::
\`\`\`

## Winter planning circle

One round of crop planning with three chefs and three farms before the next season.

\`\`\`pdt42
:::mvp
id: mvp-chefs-circle
title: Winter planning circle
experiences: x-chefs-table
base:
  - Three chefs who already buy at the market
implementation: Wizard of Oz — pre-orders on paper, confirmed by phone
status: planned
:::

:::assumption
id: a-commit
title: Chefs commit to volumes five months ahead
mvp: mvp-chefs-circle
kind: attraction
riskiest: yes
test: Two planning evenings in the college kitchen
criteria: Each chef commits to at least three varieties
:::

:::assumption
id: a-delivery-trust
title: Chefs accept deliveries from farms they never met
mvp: mvp-chefs-circle
kind: trust
test: Rotate deliveries between the three farms
criteria: No chef cancels a delivery
:::

:::assumption
id: a-chef-price
title: Chefs pay the commission on top of the farm price
mvp: mvp-chefs-circle
kind: business-model
test: Quote prices including the commission
criteria: All three chefs sign the pre-order
:::
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-mvp-chefs
canvas: mvp
of: mvp-chefs-circle
:::
\`\`\`
`,oe=`# Frame the Platform Strategy Model

Two of the three elements are present. There is no extension platform: nobody extends the
farm back-office yet, and inventing one would dilute the focus.

\`\`\`pdt42
:::canvas
id: cv-psm
canvas: platform-strategy-model
:::
\`\`\`

## Farm back-office

The product side, targeted at the core role: everything a small farm needs to sell without a
phone — come for the tool, stay for the kitchens.

\`\`\`pdt42
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
\`\`\`

## Kitchen marketplace

Restaurants meet farms and pre-order the season.

\`\`\`pdt42
:::value-proposition
id: vp-kitchen-market
title: Kitchen marketplace
kind: marketplace
relationship: r-farmer-restaurant
:::
\`\`\`

## Box marketplace

Households subscribe to boxes composed from many farms.

\`\`\`pdt42
:::value-proposition
id: vp-box-market
title: Box marketplace
kind: marketplace
relationship: r-farmer-household
:::
\`\`\`
`,se=`# Characterise the network

## Farm ↔ restaurant network

Differentiated, regional, high-frequency and fairly monogamous: chefs stay with farms they trust.
Liquidity comes slowly, but the network effect should not plateau early — variety keeps adding
value. Tactics: a strong single-user tool for farms and a marquee chef to pull the others.

\`\`\`pdt42
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
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-network-kitchen
canvas: network-properties
of: r-farmer-restaurant
:::
\`\`\`

## Farm ↔ household network

Local, low value per order, polygamous: likely to plateau once a neighbourhood has enough farms.
Community content and recipes are the sustainable tactic at this order value.

\`\`\`pdt42
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
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-network-box
canvas: network-properties
of: r-farmer-household
:::
\`\`\`
`,d=`# Sketch the flywheels

\`\`\`pdt42
:::canvas
id: cv-flywheels
canvas: flywheel-sketching
:::
\`\`\`

## More farms, better boxes

The core indirect network effect: more farms make boxes more varied, more varied boxes keep more
households, more subscriptions attract more farms.

\`\`\`pdt42
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
\`\`\`

## Planning data

Every season of pre-orders makes the harvest forecast better, which makes pre-ordering safer.

\`\`\`pdt42
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
\`\`\`

## Back-office lock-in

Farms that run invoicing and planning in the back-office rarely leave.

\`\`\`pdt42
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
\`\`\`
`,f=`# Plan liquidity

## Kitchens in the city centre

Start with supply: farms are scarce, chefs are many. One category, one district.

\`\`\`pdt42
:::liquidity
id: lq-kitchen
relationship: r-farmer-restaurant
canonical-unit: Chef-owned restaurants in the city centre × vegetables
alternatives:
  - Wholesale market
  - Calling farms directly
supply-threshold: A farm needs pre-orders from four kitchens to plan against them
demand-threshold: A chef needs at least eight farms to cover a menu
start-with: supply
constraints:
  - City centre only
  - Vegetables before fruit and dairy
:::
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-liquidity-kitchen
canvas: liquidity
of: r-farmer-restaurant
:::
\`\`\`

## Boxes in one neighbourhood

The cooperative's market customers make demand easy to find; farms willing to pack boxes are the constraint.

\`\`\`pdt42
:::liquidity
id: lq-box
relationship: r-farmer-household
canonical-unit: One neighbourhood × weekly vegetable box
alternatives:
  - Supermarket
  - Saturday market
supply-threshold: Forty boxes a week make the route worth it for a farm
demand-threshold: Five farms make a box varied enough to keep
start-with: supply
constraints:
  - One neighbourhood, three hubs
:::
\`\`\`

\`\`\`pdt42
:::canvas
id: cv-liquidity-box
canvas: liquidity
of: r-farmer-household
:::
\`\`\`
`,p=`# Build the growth engine

\`\`\`pdt42
:::canvas
id: cv-growth
canvas: growth-model
:::
\`\`\`

## Recipes bring neighbours

Households share how they cooked their box; every shared recipe links to the neighbourhood's hub.

\`\`\`pdt42
:::growth-loop
id: gl-recipes
title: Recipes bring neighbours
type: ugc
acquires: e-households
feeds: fw-core
equation: new households = recipes shared × views per recipe × sign-up rate
bottleneck: Share of households who publish recipes
cycle-time: One week
metric: Recipes shared per 100 boxes
:::
\`\`\`

## Chefs recommend farms to chefs

A chef who credits a farm on the menu is asked by peers where the produce comes from.

\`\`\`pdt42
:::growth-loop
id: gl-chef-referrals
title: Chefs recommend farms to chefs
type: viral
acquires: e-restaurants
feeds: fw-lockin
equation: new kitchens = active kitchens × referrals per season × conversion
bottleneck: Referrals per season
cycle-time: One season
metric: Referred kitchens per season
:::
\`\`\`
`,m=``+new URL(`arena-scan-DnTWU2Nh.webp`,import.meta.url).href,h=``+new URL(`brief-consolidation-Bm-CXwlA.webp`,import.meta.url).href,g=``+new URL(`ecosystem-scan-BLr2sigH.webp`,import.meta.url).href,_=``+new URL(`ecosystem-CGCLBV4D.webp`,import.meta.url).href,v=``+new URL(`entity-portrait-CUIp-KVy.webp`,import.meta.url).href,y=``+new URL(`flywheel-sketching-QksKIc1c.webp`,import.meta.url).href,b=``+new URL(`growth-model-CwvWotyE.webp`,import.meta.url).href,x=``+new URL(`learning-engine-msf9NyHY.webp`,import.meta.url).href,S=``+new URL(`liquidity-Cl9lwNu-.webp`,import.meta.url).href,C=``+new URL(`motivations-matrix-BXLvhIWn.webp`,import.meta.url).href,w=``+new URL(`mvp-B1uj49TW.webp`,import.meta.url).href,T=``+new URL(`network-properties-BmSUw9rf.webp`,import.meta.url).href,E=``+new URL(`pattern-cards-BHWOaAdd.webp`,import.meta.url).href,D=``+new URL(`platform-design-DQXmxBci.webp`,import.meta.url).href,O=``+new URL(`platform-experience-DRSgVUGz.webp`,import.meta.url).href,k=``+new URL(`platform-strategy-model-DeqPvNfX.webp`,import.meta.url).href,A=``+new URL(`transactions-board-DeaP0Xj4.webp`,import.meta.url).href,j=``+new URL(`vrio-DmeY0e_x.webp`,import.meta.url).href,M=``+new URL(`wardley-map-DRh6Kj5a.webp`,import.meta.url).href,N=``+new URL(`cv-arena-scan-BWf1IJ92.png`,import.meta.url).href,P=``+new URL(`cv-board-courier-Ba7CjvQm.png`,import.meta.url).href,F=``+new URL(`cv-board-household-C3jZ2Th2.png`,import.meta.url).href,I=``+new URL(`cv-board-restaurant-CHIyzI6m.png`,import.meta.url).href,L=``+new URL(`cv-brief-Dxq4MN8A.png`,import.meta.url).href,R=``+new URL(`cv-ecosystem-scan-CFrKPUlh.png`,import.meta.url).href,z=``+new URL(`cv-ecosystem-Dp0pdx7Y.png`,import.meta.url).href,B=``+new URL(`cv-flywheels-DlU69T12.png`,import.meta.url).href,V=``+new URL(`cv-growth-BNbmxbmB.png`,import.meta.url).href,H=``+new URL(`cv-learning-Daofyw_T.png`,import.meta.url).href,U=``+new URL(`cv-liquidity-box-DJ4h4mkQ.png`,import.meta.url).href,W=``+new URL(`cv-liquidity-kitchen-BlTmoyb3.png`,import.meta.url).href,G=``+new URL(`cv-matrix-Aalw-eL2.png`,import.meta.url).href,ce=``+new URL(`cv-mvp-box-p6HIG1Ld.png`,import.meta.url).href,le=``+new URL(`cv-mvp-chefs-DtDEtmeA.png`,import.meta.url).href,ue=``+new URL(`cv-network-box-Co6f-J8w.png`,import.meta.url).href,de=``+new URL(`cv-network-kitchen-zs9b99G_.png`,import.meta.url).href,fe=``+new URL(`cv-plays-ChfI4pZ_.png`,import.meta.url).href,pe=``+new URL(`cv-portrait-artisans-DyQusK46.png`,import.meta.url).href,me=``+new URL(`cv-portrait-couriers-DS2M3qDN.png`,import.meta.url).href,he=``+new URL(`cv-portrait-farmers-CpifbyuI.png`,import.meta.url).href,ge=``+new URL(`cv-portrait-households-CCCyFsdD.png`,import.meta.url).href,_e=``+new URL(`cv-portrait-restaurants-B_2LNaLT.png`,import.meta.url).href,ve=``+new URL(`cv-psm-DtkWeYPT.png`,import.meta.url).href,ye=``+new URL(`cv-value-chain-zU3JA9Ue.png`,import.meta.url).href,be=``+new URL(`cv-vrio-CNyNcGhC.png`,import.meta.url).href,xe=``+new URL(`cv-xp-box-6xPWm9qT.png`,import.meta.url).href,Se=``+new URL(`cv-xp-chefs-DLmgzEa1.png`,import.meta.url).href,Ce={"arena-scan":{view:`cv-arena-scan`,element:`ar-selling`},"ecosystem-scan":{view:`cv-ecosystem-scan`,element:`e-wholesaler`},vrio:{view:`cv-vrio`,element:`as-trust`},"wardley-map":{view:`cv-value-chain`,element:`c-ordering`},"platform-plays":{view:`cv-plays`,element:`pl-aggregate`},"pattern-cards":{element:`sc-hub-hosts`},"brief-consolidation":{view:`cv-brief`,element:`br-main`},ecosystem:{view:`cv-ecosystem`,element:`e-couriers`},"entity-portrait":{view:`cv-portrait-farmers`,element:`e-farmers`},"motivations-matrix":{view:`cv-matrix`,element:`m-farmers-restaurants`},"transactions-board":{view:`cv-board-restaurant`,element:`t-preorder`},"learning-engine":{view:`cv-learning`,element:`le-farmers`},"platform-experience":{view:`cv-xp-chefs`,element:`x-chefs-table`},mvp:{view:`cv-mvp-chefs`,element:`mvp-chefs-circle`},"platform-design":{element:`platform-harvest`},"platform-strategy-model":{view:`cv-psm`,element:`vp-kitchen-market`},"network-properties":{view:`cv-network-kitchen`,element:`n-kitchen`},"flywheel-sketching":{view:`cv-flywheels`,element:`fw-core`},liquidity:{view:`cv-liquidity-kitchen`,element:`lq-kitchen`},"growth-model":{view:`cv-growth`,element:`gl-recipes`}},K=`../harvest-commons/`,q=Object.entries(Object.assign({"../../../examples/harvest-commons/1-exploration/e1-arenas.pdt42.md":i,"../../../examples/harvest-commons/1-exploration/e2-scan.pdt42.md":a,"../../../examples/harvest-commons/1-exploration/e3-assets-moats.pdt42.md":o,"../../../examples/harvest-commons/1-exploration/e5-value-chain.pdt42.md":s,"../../../examples/harvest-commons/1-exploration/e6-plays.pdt42.md":c,"../../../examples/harvest-commons/1-exploration/e7-brief.pdt42.md":l,"../../../examples/harvest-commons/2-design/d1-ecosystem.pdt42.md":u,"../../../examples/harvest-commons/2-design/d3-motivations.pdt42.md":ee,"../../../examples/harvest-commons/2-design/d4-relationships.pdt42.md":te,"../../../examples/harvest-commons/2-design/d5-transactions.pdt42.md":ne,"../../../examples/harvest-commons/2-design/d6-learning-engine.pdt42.md":re,"../../../examples/harvest-commons/2-design/d7-experiences.pdt42.md":ie,"../../../examples/harvest-commons/2-design/d8-mvp.pdt42.md":ae,"../../../examples/harvest-commons/3-growth/g1-strategy-model.pdt42.md":oe,"../../../examples/harvest-commons/3-growth/g2-network.pdt42.md":se,"../../../examples/harvest-commons/3-growth/g3-flywheels.pdt42.md":d,"../../../examples/harvest-commons/3-growth/g4-liquidity.pdt42.md":f,"../../../examples/harvest-commons/3-growth/g5-growth-loops.pdt42.md":p})).map(([e,t])=>({file:e.replace(/^.*\/harvest-commons\//,``),content:t})),J=t(q),Y=new Map(q.map(e=>[e.file,e.content.split(`
`)])),X=e=>new Map(Object.entries(e).map(([e,t])=>[e.replace(/^.*\/|\.\w+$/g,``),t])),we=X(Object.assign({"../canvases/originals/arena-scan.webp":m,"../canvases/originals/brief-consolidation.webp":h,"../canvases/originals/ecosystem-scan.webp":g,"../canvases/originals/ecosystem.webp":_,"../canvases/originals/entity-portrait.webp":v,"../canvases/originals/flywheel-sketching.webp":y,"../canvases/originals/growth-model.webp":b,"../canvases/originals/learning-engine.webp":x,"../canvases/originals/liquidity.webp":S,"../canvases/originals/motivations-matrix.webp":C,"../canvases/originals/mvp.webp":w,"../canvases/originals/network-properties.webp":T,"../canvases/originals/pattern-cards.webp":E,"../canvases/originals/platform-design.webp":D,"../canvases/originals/platform-experience.webp":O,"../canvases/originals/platform-strategy-model.webp":k,"../canvases/originals/transactions-board.webp":A,"../canvases/originals/vrio.webp":j,"../canvases/originals/wardley-map.webp":M})),Te=X(Object.assign({"../../../demo/canvases/cv-arena-scan.png":N,"../../../demo/canvases/cv-board-courier.png":P,"../../../demo/canvases/cv-board-household.png":F,"../../../demo/canvases/cv-board-restaurant.png":I,"../../../demo/canvases/cv-brief.png":L,"../../../demo/canvases/cv-ecosystem-scan.png":R,"../../../demo/canvases/cv-ecosystem.png":z,"../../../demo/canvases/cv-flywheels.png":B,"../../../demo/canvases/cv-growth.png":V,"../../../demo/canvases/cv-learning.png":H,"../../../demo/canvases/cv-liquidity-box.png":U,"../../../demo/canvases/cv-liquidity-kitchen.png":W,"../../../demo/canvases/cv-matrix.png":G,"../../../demo/canvases/cv-mvp-box.png":ce,"../../../demo/canvases/cv-mvp-chefs.png":le,"../../../demo/canvases/cv-network-box.png":ue,"../../../demo/canvases/cv-network-kitchen.png":de,"../../../demo/canvases/cv-plays.png":fe,"../../../demo/canvases/cv-portrait-artisans.png":pe,"../../../demo/canvases/cv-portrait-couriers.png":me,"../../../demo/canvases/cv-portrait-farmers.png":he,"../../../demo/canvases/cv-portrait-households.png":ge,"../../../demo/canvases/cv-portrait-restaurants.png":_e,"../../../demo/canvases/cv-psm.png":ve,"../../../demo/canvases/cv-value-chain.png":ye,"../../../demo/canvases/cv-vrio.png":be,"../../../demo/canvases/cv-xp-box.png":xe,"../../../demo/canvases/cv-xp-chefs.png":Se}));function Z(e,t={},...n){let r=document.createElement(e);for(let[e,n]of Object.entries(t))r.setAttribute(e,n);return r.append(...n),r}function Q(e,t,n){return["```pdt42",...(Y.get(e)??[]).slice(t-1,n),"```"].join(`
`)}function Ee(e){return Q(e.loc.file,e.loc.line,e.endLine)}function De(e){let t=J.canvases.find(t=>t.id===e);if(!t)return;let n=(Y.get(t.loc.file)??[]).findIndex((e,n)=>n>=t.loc.line&&e.trim()===`:::`);return{source:Q(t.loc.file,t.loc.line,n+1),href:`${K}#${t.loc.file}:${t.id}`}}function $(e,t,n,r){return Z(`figure`,{class:`cmp__figure`},e?Z(`a`,{class:`cmp__zoom`,href:n,title:`Open full size`},Z(`img`,{src:e,alt:t,loading:`lazy`})):Z(`div`,{class:`cmp__none`},t),Z(`figcaption`,{},...r))}function Oe(e){let t=Ce[e.id],n=t?.view?De(t.view):void 0,r=t?J.byId.get(t.element):void 0,i=we.get(e.id),a=t?.view?Te.get(t.view):void 0,o=Z(`div`,{class:`cmp__pair`},$(i,i?`${e.title}, the original PDT 2.2 canvas`:`The Boundaryless page has no ${e.title} image: it is a ${e.kind}.`,i??e.source,[Z(`strong`,{},`PDT 2.2 original`),` · © Boundaryless SRL, `,Z(`a`,{href:`https://creativecommons.org/licenses/by-sa/4.0/`},`CC BY-SA 4.0`),i?`, resized`:``]),$(a,a?`${e.title} as pdt42 draws it for Harvest Commons`:`Not placed in Harvest Commons: pdt42 draws it from the fields below.`,a??K,[Z(`strong`,{},`pdt42`),` · drawn from Harvest Commons`,...n?[` · `,Z(`a`,{href:n.href},`open live →`)]:[]])),s=Z(`table`,{class:`cmp__table`},Z(`thead`,{},Z(`tr`,{},Z(`th`,{},`On the canvas`),Z(`th`,{},`In pdt42`))),Z(`tbody`,{},...e.areas.map(e=>Z(`tr`,{},Z(`td`,{},e.title),Z(`td`,{},...e.fills.flatMap((e,t)=>[...t?[` `]:[],Z(`code`,{},e)])))))),c=Z(`div`,{class:`cmp__source`},Z(`h4`,{},`Place it in the chapter`),Z(`pre`,{},n?.source??["```pdt42",`:::canvas`,`id: cv-${e.id}`,`canvas: ${e.id}`,...e.per?[`of: <${e.per} id>`]:[],`:::`,"```"].join(`
`)),...r?[Z(`h4`,{},`One element on it: ${r.title}`),Z(`pre`,{},Ee(r))]:[]);return Z(`section`,{class:`cmp`,id:e.id},Z(`header`,{class:`cmp__header`},Z(`span`,{class:`cmp__steps`},e.steps.join(` · `)),Z(`h2`,{class:`cmp__title`},e.title),Z(`a`,{class:`cmp__link`,href:e.source},`Boundaryless guide ↗`)),o,Z(`div`,{class:`cmp__map`},s,c))}function ke(){r();let t=document.getElementById(`canvas-toc`),i=document.getElementById(`canvas-list`);for(let r of e){let e=n.filter(e=>e.phase===r.id);t?.append(Z(`div`,{class:`cmp-toc__phase method__phase--${r.id}`},Z(`h3`,{},r.title),Z(`ul`,{},...e.map(e=>Z(`li`,{},Z(`a`,{href:`#${e.id}`},e.title)))))),i?.append(Z(`h2`,{class:`cmp-phase method__phase--${r.id}`},r.title),...e.map(Oe))}location.hash&&document.getElementById(location.hash.slice(1))?.scrollIntoView()}ke();