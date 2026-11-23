# FC Trade Manager — Frontend

React 19 + TypeScript + Vite client for the [FC Trade Manager API](https://github.com/fc-trade-manager/backend).

## Notes on the data model

- Sales carry a 5% fee; profit = (price × 0.95 − average buy price) × quantity. Fee, return %, and open-position
  values are derived client-side from the trades and the latest price.

## Test IDs (`data-testid`)

Stable attributes for E2E tests (Playwright). They are not visible to the user and do not depend on text, CSS class, or position.

### Convention

- Names in `kebab-case`, in the format `area-element` (`login-submit`, `watchlist-row`).
- Lists use the same `data-testid` on every row (`trade-row`) and identify the row via `data-*` attributes (`data-card-name`, `data-trade-type`), instead of putting dynamic ids in the name.
- Prefer `getByRole` when the element has a clear role and name; use `getByTestId` for the rest.
- When renaming or removing an id, update the tests' Page Objects in the same PR.

### Examples (Playwright)

```ts
// login form
await page.getByTestId('login-email').fill(email)
await page.getByTestId('login-password').fill(password)
await page.getByTestId('login-submit').click()

// specific watchlist row
const row = page.locator('[data-testid="watchlist-row"][data-card-name="Kylian Mbappé"]')
await expect(row.getByTestId('watchlist-last-price')).toHaveText('54,000')

// sale row for a card
const sale = page.locator('[data-testid="trade-row"][data-card-name="Pelé"][data-trade-type="sell"]')

// the native confirm() for removal must be accepted
page.once('dialog', (d) => d.accept())
await row.getByTestId('watchlist-remove').click()
```

### List

#### Shared components (`src/components/ui.tsx`)

- `side-badge`
- `loading`
- `error-state`
- `error-retry`
- `empty-state`
- `field-error`
- `form-error`
- `modal`
- `modal-close`
- `pagination`
- `pagination-prev`
- `pagination-info`
- `pagination-next`

#### Layout (menu, header, account) (`src/components/Layouts.tsx`)

- `theme-toggle`
- `account-menu-button`
- `account-name`
- `account-menu`
- `logout-button`
- `nav-${label.toLowerCase()}`
- `alerts-bell`
- `alerts-unread-badge`
- `public-signin-link`
- `public-register-link`

#### Card picker (`src/components/CardPicker.tsx`)

- `card-picker-selected`
- `card-picker-clear`
- `card-picker-input`
- `card-picker-list`
- `card-picker-error`
- `card-picker-empty`
- `card-picker-option`

#### Login and registration (`src/pages/Auth.tsx`)

- `auth-market-link`
- `login-form`
- `login-email`
- `login-password`
- `login-remember`
- `login-submit`
- `register-form`
- `register-display-name`
- `register-username`
- `register-email`
- `register-password`
- `register-submit`

#### Market (`src/pages/Market.tsx`)

- `market-search`
- `market-rarity`
- `market-position`
- `market-notice`
- `market-table`
- `market-row`
- `market-price`
- `market-change`

#### Watchlist (`src/pages/Watchlist.tsx`)

- `targets-form`
- `targets-buy-input`
- `targets-sell-input`
- `targets-cancel`
- `targets-submit`
- `watchlist-sort`
- `watchlist-add-button`
- `watchlist-table`
- `watchlist-row`
- `watchlist-last-price`
- `watchlist-change-24h`
- `watchlist-buy-target`
- `watchlist-to-buy`
- `watchlist-sell-target`
- `watchlist-to-sell`
- `watchlist-edit`
- `watchlist-remove`

#### Trades (`src/pages/Trades.tsx`)

- `trade-form`
- `trade-side-buy`
- `trade-side-sell`
- `trade-price-input`
- `trade-quantity-input`
- `trade-total`
- `trade-cancel`
- `trade-submit`
- `trade-edit`
- `trade-delete`
- `trades-new-button`
- `trades-tab-${id}`
- `trade-row`
- `trade-profit`
- `trade-return`
- `position-row`
- `position-qty`
- `position-avg-buy`
- `position-potential`

#### Alerts (`src/pages/Alerts.tsx`)

- `alerts-mark-all-read`
- `alerts-tab-all`
- `alerts-tab-unread`
- `alerts-feed`
- `alert-item`
- `alert-title`
- `alert-price`
- `alert-mark-read`

#### Dashboard (`src/pages/Dashboard.tsx`)

- `metric-total-profit`
- `metric-best-trade`
- `metric-worst-trade`
- `metric-open-positions`
- `profit-chart`
- `dashboard-open-positions`
- `dashboard-position-row`
- `dashboard-position-potential`
- `dashboard-recent-trades`
- `dashboard-trade-row`
- `dashboard-trade-profit`

### Row `data-*` attributes

| Row | Attributes |
| --- | --- |
| `watchlist-row` | `data-card-id`, `data-card-name` |
| `market-row` | `data-card-id`, `data-card-name` |
| `trade-row` | `data-trade-id`, `data-card-name`, `data-trade-type` (`buy` or `sell`) |
| `position-row`, `dashboard-position-row` | `data-card-name` |
| `dashboard-trade-row` | `data-card-name`, `data-trade-type` |
| `alert-item` | `data-alert-kind` (`buy` or `sell`), `data-card-name`, `data-read` (`true` or `false`) |
| `card-picker-option` | `data-card-name` |
| `side-badge` | `data-side` |