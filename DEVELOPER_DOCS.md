# RealSheet Developer Documentation

Welcome to the RealSheet developer ecosystem. RealSheet is designed with an API-first architecture, allowing you to extend its capabilities with custom scripts, integrations, and automations.

## Scripting with JavaScript

RealSheet supports native JavaScript execution within cells and through the AI Agent.

### Custom Functions

You can define custom functions in the `VisualFormulaBuilder` or by using the `code_interpreter` tool in the AI Agent.

### Cell Referencing

Use standard A1 notation or structured references:
- `A1`: Cell at first column, first row.
- `A1:B10`: Range from A1 to B10.
- `Table1[Column]`: Reference a specific column in a named table.

## Data Science with Python

RealSheet integrates Pyodide to run Python directly in your browser with access to `numpy`, `pandas`, and `matplotlib`.

### Example: Linear Regression

```python
import pandas as pd
from sklearn.linear_model import LinearRegression

X = df[['Price']].values
y = df['Sales'].values

model = LinearRegression().fit(X, y)
print(f"Prediction: {model.predict([[100]])}")
```

## API Integrations

### FETCH Function

Retrieve data from any JSON API:
`=FETCH("https://api.coinbase.com/v2/prices/BTC-USD/spot")`

### Native Connectors

RealSheet provides built-in connectors for:
- **Stripe**: `connectStripe(endpoint, apiKey)`
- **Shopify**: `connectShopify(shop, token, endpoint)`
- **PayPal**: `connectPayPal(id, secret, endpoint)`
- **Airtable**: `connectAirtable(baseId, table, apiKey)`

## Real-time Collaboration API

RealSheet uses a BroadcastChannel-based sync mechanism for low-latency collaboration.
- `collaborationService.syncState(state)`: Syncs the current workbook state.
- `collaborationService.onPresence(callback)`: Listen for other users' cursor movements.

## Version Control (Git-for-Sheets)

Manage changes with branching and merging:
- `versionControlService.createBranch(name)`
- `versionControlService.commit(message)`
- `versionControlService.merge(source, target)`
