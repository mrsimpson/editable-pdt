# Transactions

What flows between the entities today, and what could flow tomorrow?

## Order

The core transaction of the platform.

```pdt
:::transaction
id: t-order
title: Order
from: e-consumers
to: e-producers
flow: money
status: potential
:::
```

## Deliver

How does the value reach the consumer?

```pdt
:::transaction
id: t-deliver
title: Deliver
from: e-producers
to: e-consumers
flow: value
status: potential
:::
```

## Commission

How does the platform sustain itself?

```pdt
:::transaction
id: t-commission
title: Commission
from: e-producers
to: e-owner
flow: money
status: potential
:::
```
