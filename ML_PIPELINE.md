# ML Pipeline

Target: demand quantity per SKU × Store × Date.

Models:
Naive, Moving Average, ARIMA/SARIMA, XGBoost, LightGBM, optional LSTM.

Features:
lag_1, lag_7, lag_14, lag_28, rolling means/std, calendar, price, discount, promotion, inventory, lead time.

Validation: chronological/walk-forward.

Metrics: MAE, RMSE, WAPE, Bias.

Evaluate forecasting accuracy AND downstream inventory performance.
