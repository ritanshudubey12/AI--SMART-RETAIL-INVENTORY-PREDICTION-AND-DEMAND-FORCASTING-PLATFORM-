/**
 * OmniStock AI (India Retail Edition) - Core Application Logic
 * Vanilla JavaScript implementation for high performance, zero build steps, and easy explanation.
 */

// API Configuration
const API_BASE = window.location.port === '8000' ? '' : 'http://127.0.0.1:8000';

// Global State
let state = {
  theme: localStorage.getItem('omnistock_theme') || 'dark',
  activeTab: 'pitch',
  dashboard: null,
  inventory: [],
  products: [],
  stores: [],
  transfers: [],
  replenishment: [],
  forecast: null,
  sim: null,
  dispatchedTransfers: {},
  approvedPOs: {}
};

// Chart instances
let forecastChartInstance = null;
let categoryChartInstance = null;
let storeChartInstance = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNavigation();
  populateModalPresets();
  setupCopilot();
  loadAllData();
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.textContent = state.theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('omnistock_theme', state.theme);
  initTheme();
  // Re-render charts for theme contrast if needed
  if (state.forecast) renderForecastChart(state.forecast);
  if (state.dashboard) renderDashboardCharts(state.dashboard);
}

// Navigation & Tab Switching
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  const pitchBtn = document.getElementById('header-pitch-btn');
  if (pitchBtn) {
    pitchBtn.addEventListener('click', () => switchTab('pitch'));
  }
}

function switchTab(tabId) {
  state.activeTab = tabId;

  // Update Nav Buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Update Header Title
  const titles = {
    pitch: '60-Second Project Explanation & Viva Guide',
    dashboard: 'Executive Inventory & Demand Analytics',
    forecast: 'Multi-Horizon SKU Demand Prediction Studio',
    inventory: 'Active Stock Health & Replenishment Monitor',
    transfers: 'Smart Store Transfers & Automated Purchase Orders',
    copilot: 'Conversational AI Inventory Intelligence',
    viva: 'Academic Research Methodology & Viva Examination Lab'
  };
  const titleEl = document.getElementById('header-page-title');
  const tagEl = document.getElementById('header-page-tag');
  if (titleEl) titleEl.textContent = titles[tabId] || 'Overview';
  if (tagEl) tagEl.textContent = tabId.toUpperCase();
}

// Currency Formatter Helper (Indian Rupees ₹)
function formatINR(val, decimals = 0) {
  if (val === undefined || val === null) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}

// Load All Initial Data from FastAPI Backend
async function loadAllData() {
  try {
    const [dashRes, invRes, prodRes, storeRes, trfRes, repRes] = await Promise.all([
      fetch(`${API_BASE}/api/dashboard`).then(r => r.json()),
      fetch(`${API_BASE}/api/inventory`).then(r => r.json()),
      fetch(`${API_BASE}/api/products`).then(r => r.json()),
      fetch(`${API_BASE}/api/stores`).then(r => r.json()),
      fetch(`${API_BASE}/api/transfers`).then(r => r.json()),
      fetch(`${API_BASE}/api/replenishment`).then(r => r.json())
    ]);

    state.dashboard = dashRes;
    state.inventory = invRes;
    state.products = prodRes;
    state.stores = storeRes;
    state.transfers = trfRes;
    state.replenishment = repRes;

    renderDashboard(dashRes);
    renderInventory(invRes);
    renderTransfers(trfRes, repRes);
    populateDropdowns(prodRes, storeRes);
    loadForecast();
  } catch (err) {
    console.error('Error connecting to backend API:', err);
  }
}

// Render Executive Dashboard
function renderDashboard(data) {
  if (!data) return;

  // Alerts
  const alertBox = document.getElementById('dashboard-alert');
  if (alertBox && data.critical_alerts && data.critical_alerts.length > 0) {
    alertBox.style.display = 'flex';
    document.getElementById('alert-count').textContent = data.critical_alerts.length;
    document.getElementById('alert-message').textContent = data.critical_alerts[0].message;
  } else if (alertBox) {
    alertBox.style.display = 'none';
  }

  // KPIs
  document.getElementById('kpi-capital').textContent = formatINR(data.total_inventory_value);
  document.getElementById('kpi-holding').textContent = `Monthly holding: ${formatINR(data.total_monthly_holding_cost)}`;
  document.getElementById('kpi-service-level').textContent = `${data.service_level_pct}%`;
  document.getElementById('kpi-accuracy').textContent = `${data.avg_wape_pct}%`;
  document.getElementById('kpi-transfers').textContent = `${data.transfer_recommendations_count} Transfers`;
  document.getElementById('kpi-po-count').textContent = `${data.replenishment_orders_count} pending supplier purchase orders`;

  // Update Badges
  const badgeEl = document.getElementById('transfer-badge');
  if (badgeEl) {
    badgeEl.textContent = (data.transfer_recommendations_count || 0) + (data.replenishment_orders_count || 0);
  }

  renderDashboardCharts(data);
}

// Render Dashboard Breakdown Charts
function renderDashboardCharts(data) {
  if (typeof Chart === 'undefined') return;

  const isDark = state.theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? '#1e2433' : '#e2e8f0';

  // Category Chart
  const ctxCat = document.getElementById('categoryChart');
  if (ctxCat) {
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(ctxCat, {
      type: 'bar',
      data: {
        labels: data.category_breakdown.map(c => c.category),
        datasets: [{
          label: 'Inventory Value (₹)',
          data: data.category_breakdown.map(c => c.inventory_value),
          backgroundColor: '#38bdf8',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor }, grid: { display: false } },
          y: { ticks: { color: textColor, callback: val => '₹' + val.toLocaleString('en-IN') }, grid: { color: gridColor } }
        }
      }
    });
  }

  // Store Chart
  const ctxStore = document.getElementById('storeChart');
  if (ctxStore) {
    if (storeChartInstance) storeChartInstance.destroy();
    storeChartInstance = new Chart(ctxStore, {
      type: 'bar',
      data: {
        labels: data.store_breakdown.map(s => s.store_name.split('-')[0]),
        datasets: [{
          label: 'Inventory Units',
          data: data.store_breakdown.map(s => s.total_units),
          backgroundColor: '#f59e0b',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor }, grid: { display: false } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } }
        }
      }
    });
  }
}

// Populate Product & Store Select Dropdowns
function populateDropdowns(products, stores) {
  const skuSelect = document.getElementById('forecast-sku-select');
  const storeSelect = document.getElementById('forecast-store-select');

  if (skuSelect && products.length > 0) {
    const currentVal = skuSelect.value;
    const optionsHtml = products.map(p => 
      `<option value="${p.id}">${p.name} (${formatINR(p.unit_price)})</option>`
    ).join('') + '<option value="__ADD_NEW__">➕ Add New Custom Product...</option>';
    
    skuSelect.innerHTML = optionsHtml;
    if (currentVal && currentVal !== '__ADD_NEW__') {
      skuSelect.value = currentVal;
    }
    
    skuSelect.onchange = () => {
      if (skuSelect.value === '__ADD_NEW__') {
        openAddProductModal();
        skuSelect.value = state.forecast?.sku_id || products[0]?.id || '';
      } else {
        loadForecast();
      }
    };
  }

  if (storeSelect && stores.length > 0) {
    storeSelect.innerHTML = stores.map(s => 
      `<option value="${s.id}">${s.name}</option>`
    ).join('');
    storeSelect.onchange = () => loadForecast();
  }

  const horizonSelect = document.getElementById('forecast-horizon-select');
  const modelSelect = document.getElementById('forecast-model-select');
  if (horizonSelect) horizonSelect.onchange = () => loadForecast();
  if (modelSelect) modelSelect.onchange = () => loadForecast();
}

// Load Demand Forecast
async function loadForecast() {
  const sku = document.getElementById('forecast-sku-select')?.value || 'SKU-IN-01';
  const store = document.getElementById('forecast-store-select')?.value || 'STORE-01';
  const horizon = document.getElementById('forecast-horizon-select')?.value || 14;
  const model = document.getElementById('forecast-model-select')?.value || 'Gradient_Boosting_XGB';

  try {
    const res = await fetch(`${API_BASE}/api/forecast?sku_id=${sku}&store_id=${store}&horizon=${horizon}&model=${model}`);
    const data = await res.json();
    state.forecast = data;

    document.getElementById('forecast-title').textContent = `Demand Forecast: ${data.sku_name} @ ${data.store_name}`;
    document.getElementById('forecast-total').textContent = `${data.total_forecast_demand} units`;
    document.getElementById('forecast-daily').textContent = `${data.avg_daily_forecast} units/day`;

    renderForecastChart(data);
    renderFeatureImportance(data.feature_importance);
    renderModelBenchmarks(data.model_comparison, model);
  } catch (err) {
    console.error('Error loading forecast:', err);
  }
}

// Forecast Chart State & Mode
state.chartViewMode = 'simple'; // 'simple' (14 days total) or 'full' (28 days)
state.showConfidenceBand = false;

function setForecastViewMode(mode) {
  state.chartViewMode = mode;
  document.getElementById('btn-view-simple')?.classList.toggle('active', mode === 'simple');
  document.getElementById('btn-view-full')?.classList.toggle('active', mode === 'full');
  if (state.forecast) renderForecastChart(state.forecast);
}

document.getElementById('toggle-confidence-band')?.addEventListener('change', (e) => {
  state.showConfidenceBand = e.target.checked;
  if (state.forecast) renderForecastChart(state.forecast);
});

// Render Simplified, Highly Intuitive Forecast Chart
function renderForecastChart(data) {
  if (typeof Chart === 'undefined') return;

  const ctx = document.getElementById('forecastChart');
  if (!ctx) return;

  const isDark = state.theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? '#1e2433' : '#e2e8f0';

  // 1. Calculate 3 At-a-Glance Summary Insights
  const past7 = data.historical_points.slice(-7);
  const past7Total = past7.reduce((sum, p) => sum + p.actual, 0);
  const past7Avg = Math.round(past7Total / Math.max(past7.length, 1));

  const future7 = data.forecast_points.slice(0, 7);
  const future7Total = future7.reduce((sum, p) => sum + p.forecast, 0);
  const future7Avg = Math.round(future7Total / Math.max(future7.length, 1));
  const surgePct = Math.round(((future7Avg - past7Avg) / Math.max(past7Avg, 1)) * 100);

  // Find Peak Day in future forecast
  let peakDay = future7[0] || { forecast: future7Avg, day_name: 'Weekend' };
  for (const f of future7) {
    if (f.forecast > peakDay.forecast) peakDay = f;
  }
  const peakDayName = peakDay.day_name || 'Weekend';

  // Update Summary Card DOM Elements
  const pastAvgEl = document.getElementById('f-past-avg');
  const pastTotEl = document.getElementById('f-past-total');
  const futAvgEl = document.getElementById('f-future-avg');
  const futTotEl = document.getElementById('f-future-total');
  const peakEl = document.getElementById('f-peak-insight');
  const actionSubEl = document.getElementById('f-action-sub');

  if (pastAvgEl) pastAvgEl.textContent = `${past7Avg} units/day`;
  if (pastTotEl) pastTotEl.textContent = `Total ${past7Total} units recorded`;
  if (futAvgEl) futAvgEl.textContent = `${future7Avg} units/day`;
  if (futTotEl) futTotEl.textContent = `Projected ${future7Total} units (${surgePct >= 0 ? '+' : ''}${surgePct}% shift)`;
  if (peakEl) peakEl.textContent = `${peakDayName} Peak: ~${peakDay.forecast} units`;
  if (actionSubEl) actionSubEl.textContent = `Ensure store inventory exceeds safety buffer before ${peakDayName}.`;

  // 2. Select data slice (Simple view: 7 Days Past + 7 Days Future = 14 Days clean)
  const historyPoints = state.chartViewMode === 'full' 
    ? data.historical_points 
    : data.historical_points.slice(-7);

  const forecastPoints = state.chartViewMode === 'full' 
    ? data.forecast_points 
    : data.forecast_points.slice(0, 7);

  // 3. Format Date Labels Cleanly (e.g. "21 Oct (Today)", "24 Oct (Peak)")
  function formatNiceDate(isoDate, isToday = false) {
    const parts = isoDate.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = parseInt(parts[2], 10);
    const m = months[parseInt(parts[1], 10) - 1] || parts[1];
    return isToday ? `${d} ${m} (Today)` : `${d} ${m}`;
  }

  const historyLabels = historyPoints.map((p, idx) => formatNiceDate(p.date, idx === historyPoints.length - 1));
  const forecastLabels = forecastPoints.map(p => formatNiceDate(p.date));
  const allLabels = [...historyLabels, ...forecastLabels];

  // 4. Construct Data Series (Smooth connection at Today)
  const actualSeries = [...historyPoints.map(p => p.actual), ...new Array(forecastPoints.length).fill(null)];
  const forecastSeries = [
    ...new Array(historyPoints.length - 1).fill(null), 
    historyPoints[historyPoints.length - 1].actual, 
    ...forecastPoints.map(p => p.forecast)
  ];
  const upperSeries = [
    ...new Array(historyPoints.length - 1).fill(null), 
    historyPoints[historyPoints.length - 1].actual, 
    ...forecastPoints.map(p => p.upper_80)
  ];

  // 5. Build Datasets
  const datasets = [];

  // Optional Soft Buffer Range
  if (state.showConfidenceBand) {
    datasets.push({
      label: 'Buffer Range (± 80%)',
      data: upperSeries,
      borderColor: 'rgba(56, 189, 248, 0.4)',
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      fill: '+1',
      borderDash: [4, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3
    });
  }

  // Solid Grey Line for Past Recorded Sales
  datasets.push({
    label: 'Past Real Sales (Recorded)',
    data: actualSeries,
    borderColor: '#94a3b8',
    backgroundColor: 'rgba(148, 163, 184, 0.04)',
    borderWidth: 2.5,
    pointRadius: 5,
    pointHoverRadius: 7,
    pointBackgroundColor: '#94a3b8',
    pointBorderColor: isDark ? '#0d1017' : '#ffffff',
    pointBorderWidth: 2,
    tension: 0.25
  });

  // Solid Bright Emerald Line for AI Future Forecast
  datasets.push({
    label: 'AI Forecast (Next 7 Days)',
    data: forecastSeries,
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    fill: 'origin',
    borderWidth: 3.5,
    pointRadius: 6,
    pointHoverRadius: 8,
    pointBackgroundColor: '#10b981',
    pointBorderColor: isDark ? '#0d1017' : '#ffffff',
    pointBorderWidth: 2,
    tension: 0.3
  });

  // 6. Destroy previous instance and create new Chart
  if (forecastChartInstance) forecastChartInstance.destroy();

  forecastChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: textColor,
            font: { family: 'Plus Jakarta Sans', weight: 'bold', size: 12 },
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: isDark ? '#334155' : '#cbd5e1',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            title: function(items) {
              const idx = items[0].dataIndex;
              const rawLabel = allLabels[idx];
              if (idx < historyPoints.length - 1) {
                return `📅 Past Record: ${rawLabel}`;
              } else if (idx === historyPoints.length - 1) {
                return `📍 Today: ${rawLabel}`;
              } else {
                return `🔮 AI Future Forecast: ${rawLabel}`;
              }
            },
            label: function(context) {
              const val = context.parsed.y;
              if (val === null || val === undefined) return '';
              if (context.dataset.label.includes('Past Real Sales')) {
                return ` Real Sales: ${val} units sold`;
              } else if (context.dataset.label.includes('AI Forecast')) {
                return ` Predicted Demand: ${val} units expected`;
              } else {
                return ` Upper Buffer: ${val} units`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 }
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: textColor,
            font: { family: 'JetBrains Mono', size: 11 }
          },
          grid: { color: gridColor },
          title: {
            display: true,
            text: 'Units Sold / Day',
            color: textColor,
            font: { family: 'Plus Jakarta Sans', weight: 'bold' }
          }
        }
      }
    }
  });
}

// Render Feature Importance Bars
function renderFeatureImportance(features) {
  const container = document.getElementById('feature-importance-list');
  if (!container || !features) return;

  container.innerHTML = features.map(f => `
    <div style="margin-bottom: 0.75rem;">
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem;">
        <span>${f.feature}</span>
        <span style="font-family: var(--font-mono); font-weight: 700; color: #38bdf8;">${(f.importance * 100).toFixed(0)}%</span>
      </div>
      <div style="height: 6px; width: 100%; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
        <div style="height: 100%; width: ${f.importance * 100}%; background: linear-gradient(90deg, #38bdf8, #10b981); border-radius: 999px;"></div>
      </div>
    </div>
  `).join('');
}

// Render Model Benchmark Table
function renderModelBenchmarks(comparison, selectedModel) {
  const tbody = document.getElementById('model-benchmark-tbody');
  if (!tbody || !comparison) return;

  tbody.innerHTML = Object.entries(comparison).map(([name, m]) => {
    const isSelected = name === selectedModel;
    return `
      <tr style="${isSelected ? 'background: rgba(99, 102, 241, 0.15); font-weight: bold;' : ''}">
        <td>${name.replace(/_/g, ' ')}</td>
        <td>${m.mae}</td>
        <td>${m.rmse}</td>
        <td>${m.wape_pct}%</td>
        <td style="color: #10b981; font-weight: bold;">${m.accuracy_pct}%</td>
      </tr>
    `;
  }).join('');
}

// Render Inventory Table
function renderInventory(items) {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;

  const search = document.getElementById('inventory-search')?.value.toLowerCase() || '';
  const category = document.getElementById('inventory-category-filter')?.value || 'All';

  const filtered = items.filter(item => {
    const matchesSearch = item.sku_name.toLowerCase().includes(search) || item.sku_id.toLowerCase().includes(search);
    const matchesCat = category === 'All' || item.category === category;
    return matchesSearch && matchesCat;
  });

  tbody.innerHTML = filtered.map(item => {
    let badgeClass = 'badge-success';
    if (item.stockout_risk_score >= 80) badgeClass = 'badge-danger';
    else if (item.current_stock <= item.reorder_point) badgeClass = 'badge-warning';

    return `
      <tr>
        <td>
          <div style="font-weight: 700;">${item.sku_name}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${item.sku_id} • ${item.category}</div>
        </td>
        <td>${item.store_name.split('-')[0]}</td>
        <td style="font-family: var(--font-mono); font-weight: 800; font-size: 0.9rem;">${item.current_stock}</td>
        <td style="font-family: var(--font-mono); color: var(--text-muted);">${item.safety_stock}</td>
        <td style="font-family: var(--font-mono);">${item.reorder_point}</td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: ${item.days_of_supply < 2 ? '#fb7185' : 'inherit'}">${item.days_of_supply}d</td>
        <td><span class="badge ${badgeClass}">${item.stockout_risk_level}</span></td>
        <td style="font-family: var(--font-mono);">${formatINR(item.holding_cost_monthly, 2)}</td>
      </tr>
    `;
  }).join('');
}

// Inventory search listener
document.getElementById('inventory-search')?.addEventListener('input', () => renderInventory(state.inventory));
document.getElementById('inventory-category-filter')?.addEventListener('change', () => renderInventory(state.inventory));

// Render Transfers & Replenishment
function renderTransfers(transfers, pos) {
  const container = document.getElementById('transfers-cards-container');
  if (container) {
    if (transfers.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No critical imbalances detected between stores.</p>';
    } else {
      container.innerHTML = transfers.map(t => {
        const isDispatched = state.dispatchedTransfers[t.id];
        return `
          <div class="transfer-card" style="${isDispatched ? 'border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05);' : ''}">
            <div class="transfer-header">
              <div>
                <span class="badge badge-warning">${t.priority} Priority</span>
                <h4 style="margin-top: 0.5rem; font-size: 0.9rem; font-weight: 800;">${t.sku_name}</h4>
                <p style="font-size: 0.72rem; color: var(--text-muted);">${t.sku_id} • ${t.category}</p>
              </div>
              <div style="text-align: right;">
                <div style="font-family: var(--font-mono); font-size: 1.15rem; font-weight: 800; color: #38bdf8;">${t.units_to_transfer} Units</div>
                <div style="font-size: 0.72rem; color: #10b981; font-weight: 700; font-family: var(--font-mono);">Est. Savings: ${formatINR(t.estimated_savings)}</div>
              </div>
            </div>

            <div class="route-visualizer">
              <div>
                <div style="color: var(--text-muted);">From Source (Surplus):</div>
                <div style="font-weight: 700;">${t.from_store_name.split('-')[0]}</div>
                <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">Stock: ${t.from_stock_before} → ${t.from_stock_after}</div>
              </div>
              <div style="font-size: 1.25rem; color: #38bdf8;">➔</div>
              <div style="text-align: right;">
                <div style="color: var(--text-muted);">To Destination (Deficit):</div>
                <div style="font-weight: 700;">${t.to_store_name.split('-')[0]}</div>
                <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">Stock: ${t.to_stock_before} → ${t.to_stock_after}</div>
              </div>
            </div>

            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem;">${t.rationale}</p>

            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.72rem; color: var(--text-muted);">Transit Duration: ${t.transfer_time_days} Day</span>
              <button class="btn btn-primary" onclick="dispatchTransfer('${t.id}')" ${isDispatched ? 'disabled style="background: #10b981; color: white;"' : ''}>
                ${isDispatched ? '✓ Dispatched' : 'Approve & Dispatch'}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // PO Table
  const poTbody = document.getElementById('po-table-body');
  if (poTbody && pos) {
    poTbody.innerHTML = pos.map(po => {
      const isApproved = state.approvedPOs[po.po_number];
      return `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700; color: #38bdf8;">${po.po_number}</td>
          <td>
            <div style="font-weight: 700;">${po.sku_name}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${po.store_name.split('-')[0]}</div>
          </td>
          <td>
            <div>${po.supplier_name}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">${po.lead_time_days}d delivery</div>
          </td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: #10b981;">${po.order_quantity} Units</td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: #f59e0b;">${formatINR(po.total_po_value)}</td>
          <td>
            <button class="btn" onclick="approvePO('${po.po_number}')" ${isApproved ? 'disabled style="background: #10b981; color: white;"' : ''}>
              ${isApproved ? '✓ Transmitted' : 'Approve PO'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function dispatchTransfer(id) {
  state.dispatchedTransfers[id] = true;
  renderTransfers(state.transfers, state.replenishment);
}

function approvePO(poNum) {
  state.approvedPOs[poNum] = true;
  renderTransfers(state.transfers, state.replenishment);
}

// Setup AI Copilot Chat
function setupCopilot() {
  const form = document.getElementById('copilot-form');
  const input = document.getElementById('copilot-input');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) return;
      sendCopilotMessage(query);
      input.value = '';
    });
  }

  // Quick Chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sendCopilotMessage(chip.textContent.trim());
    });
  });
}

async function sendCopilotMessage(query) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  // Append user message
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = query;
  chatMessages.appendChild(userBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Typing indicator
  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-bubble bot';
  typingBubble.textContent = 'Thinking and querying store inventory...';
  chatMessages.appendChild(typingBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/api/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    typingBubble.innerHTML = `
      <div>${data.response}</div>
      ${data.suggested_action ? `<div style="margin-top: 0.65rem; padding: 0.45rem 0.65rem; background: rgba(245, 158, 11, 0.12); border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 0.75rem;"><strong>Next Step:</strong> ${data.suggested_action}</div>` : ''}
    `;
  } catch (err) {
    typingBubble.textContent = 'Error connecting to AI Copilot. Please check if the FastAPI backend is running.';
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================
// Manually Add Product Modal Functions
// ==========================================

const POPULAR_PRESETS = [
  {
    name: 'Maggi 2-Minute Masala Noodles (Pack of 12)',
    category: 'Grocery & Staples',
    unit_price: 144,
    cost_price: 115,
    supplier_id: 'SUP-IN-01',
    lead_time: 2,
    stock: 60
  },
  {
    name: 'Fortune Sunlite Sunflower Oil (1L Pouch)',
    category: 'Grocery & Staples',
    unit_price: 165,
    cost_price: 135,
    supplier_id: 'SUP-IN-01',
    lead_time: 3,
    stock: 45
  },
  {
    name: 'Parle-G Gold Glucose Biscuits (1kg Family Pack)',
    category: 'Grocery & Staples',
    unit_price: 120,
    cost_price: 95,
    supplier_id: 'SUP-IN-01',
    lead_time: 2,
    stock: 75
  },
  {
    name: 'Cadbury Dairy Milk Silk Chocolate (150g)',
    category: 'Grocery & Staples',
    unit_price: 175,
    cost_price: 140,
    supplier_id: 'SUP-IN-01',
    lead_time: 3,
    stock: 40
  },
  {
    name: 'Dettol Original Liquid Handwash Refill (750ml)',
    category: 'Kitchen & Home',
    unit_price: 99,
    cost_price: 78,
    supplier_id: 'SUP-IN-05',
    lead_time: 4,
    stock: 55
  }
];

function populateModalPresets() {
  const container = document.getElementById('modal-presets-container');
  if (!container) return;

  container.innerHTML = POPULAR_PRESETS.map((p, idx) => `
    <button type="button" class="preset-chip" onclick="applyPreset(${idx})">
      ${p.name.split('(')[0]} <strong style="color: #f59e0b;">₹${p.unit_price}</strong>
    </button>
  `).join('');
}

function applyPreset(idx) {
  const p = POPULAR_PRESETS[idx];
  if (!p) return;

  document.getElementById('inp-prod-name').value = p.name;
  document.getElementById('inp-prod-category').value = p.category;
  document.getElementById('inp-prod-price').value = p.unit_price;
  document.getElementById('inp-prod-cost').value = p.cost_price;
  document.getElementById('inp-prod-stock').value = p.stock;
  document.getElementById('inp-prod-supplier').value = p.supplier_id;
  document.getElementById('inp-prod-lead').value = p.lead_time;
}

function autoComputeCost() {
  const price = parseFloat(document.getElementById('inp-prod-price')?.value);
  if (!isNaN(price) && price > 0) {
    document.getElementById('inp-prod-cost').value = Math.round(price * 0.80);
  }
}

function openAddProductModal() {
  const modal = document.getElementById('add-product-modal');
  if (modal) {
    applyPreset(0);
    modal.style.display = 'flex';
  }
}

function closeAddProductModal() {
  const modal = document.getElementById('add-product-modal');
  if (modal) modal.style.display = 'none';
}

async function submitNewProduct(e) {
  if (e) e.preventDefault();

  const name = document.getElementById('inp-prod-name')?.value.trim();
  const category = document.getElementById('inp-prod-category')?.value;
  const unitPrice = parseFloat(document.getElementById('inp-prod-price')?.value || 100);
  const costPrice = parseFloat(document.getElementById('inp-prod-cost')?.value || (unitPrice * 0.8));
  const stock = parseInt(document.getElementById('inp-prod-stock')?.value || 45, 10);
  const supplier = document.getElementById('inp-prod-supplier')?.value || 'SUP-IN-01';
  const leadTime = parseInt(document.getElementById('inp-prod-lead')?.value || 3, 10);

  if (!name) return;

  const btn = document.getElementById('btn-submit-product');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        category,
        unit_price: unitPrice,
        cost_price: costPrice,
        initial_stock: stock,
        supplier_id: supplier,
        lead_time_days: leadTime
      })
    });

    if (res.ok) {
      const data = await res.json();
      const product = data.product;

      closeAddProductModal();
      showToast(`✅ "${product.name}" added to Mumbai, Bengaluru & Delhi! ML Forecast generated.`);

      // Refresh all backend data
      await loadAllData();

      // Set newly added SKU in forecast dropdown and load its forecast
      const skuSelect = document.getElementById('forecast-sku-select');
      if (skuSelect) {
        skuSelect.value = product.id;
      }
      switchTab('forecast');
      await loadForecast();
    }
  } catch (err) {
    console.error('Error adding product:', err);
    alert('Failed to add product. Please verify API connection.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function showToast(msg) {
  const toast = document.getElementById('global-toast');
  const msgEl = document.getElementById('toast-message');
  if (toast && msgEl) {
    msgEl.textContent = msg;
    toast.style.display = 'flex';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 8000);
  }
}

function hideToast() {
  const toast = document.getElementById('global-toast');
  if (toast) toast.style.display = 'none';
}
