# FC Trade Manager — Frontend

React 19 + TypeScript + Vite client for the [FC Trade Manager API](https://github.com/fc-trade-manager/backend).

## Notes on the data model

- Sales carry a 5% fee; profit = (price × 0.95 − average buy price) × quantity. Fee, return %, and open-position
  values are derived client-side from the trades and the latest price.