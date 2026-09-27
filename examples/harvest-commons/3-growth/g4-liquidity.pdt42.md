# Plan liquidity

## Kitchens in the city centre

Start with supply: farms are scarce, chefs are many. One category, one district.

```pdt42
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
```

```pdt42
:::canvas
id: cv-liquidity-kitchen
canvas: liquidity
of: r-farmer-restaurant
:::
```

## Boxes in one neighbourhood

The cooperative's market customers make demand easy to find; farms willing to pack boxes are the constraint.

```pdt42
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
```

```pdt42
:::canvas
id: cv-liquidity-box
canvas: liquidity
of: r-farmer-household
:::
```
