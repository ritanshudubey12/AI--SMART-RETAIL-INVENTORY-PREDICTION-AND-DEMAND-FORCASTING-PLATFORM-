"""
Retail Data Store & Synthetic Realistic Time-Series Generator (Indian Retail Edition)
Focuses on realistic Indian retail essentials (Amul, Aashirvaad, Tata Tea, boAt, Prestige)
across 3 key Indian metro hubs: Mumbai, Bengaluru, and Delhi NCR.
"""
import datetime
import math
import random
from typing import Dict, List, Any

# 5 Iconic Indian Retail Essentials across Everyday Categories (in INR ₹)
PRODUCTS = [
    {
        "id": "SKU-IN-01",
        "name": "Aashirvaad Shudh Chakki Atta (10kg)",
        "category": "Grocery & Staples",
        "unit_price": 460.00,
        "cost_price": 385.00,
        "holding_cost_per_day": 0.50,
        "supplier_id": "SUP-IN-01",
        "min_batch": 20,
        "lead_time_days": 3,
    },
    {
        "id": "SKU-IN-02",
        "name": "Amul Pasteurised Butter (500g)",
        "category": "Dairy & Fresh",
        "unit_price": 285.00,
        "cost_price": 245.00,
        "holding_cost_per_day": 0.80,
        "supplier_id": "SUP-IN-02",
        "min_batch": 30,
        "lead_time_days": 2,
    },
    {
        "id": "SKU-IN-03",
        "name": "Tata Tea Gold (1kg)",
        "category": "Beverages",
        "unit_price": 630.00,
        "cost_price": 520.00,
        "holding_cost_per_day": 0.40,
        "supplier_id": "SUP-IN-03",
        "min_batch": 25,
        "lead_time_days": 4,
    },
    {
        "id": "SKU-IN-04",
        "name": "boAt Airdopes 141 Bluetooth Earbuds",
        "category": "Electronics",
        "unit_price": 1299.00,
        "cost_price": 850.00,
        "holding_cost_per_day": 1.20,
        "supplier_id": "SUP-IN-04",
        "min_batch": 15,
        "lead_time_days": 5,
    },
    {
        "id": "SKU-IN-05",
        "name": "Prestige Omega Deluxe Induction Pan",
        "category": "Kitchen & Home",
        "unit_price": 1150.00,
        "cost_price": 750.00,
        "holding_cost_per_day": 1.00,
        "supplier_id": "SUP-IN-05",
        "min_batch": 10,
        "lead_time_days": 4,
    },
]

# 3 Iconic Indian Metro Retail Locations
STORES = [
    {
        "id": "STORE-01",
        "name": "Store #1 - Mumbai (Bandra West Flagship)",
        "city": "Mumbai",
        "type": "Flagship Hypermarket",
        "footfall_multiplier": 1.45,
    },
    {
        "id": "STORE-02",
        "name": "Store #2 - Bengaluru (Indiranagar Superstore)",
        "city": "Bengaluru",
        "type": "Regional Superstore",
        "footfall_multiplier": 1.0,
    },
    {
        "id": "STORE-03",
        "name": "Store #3 - Delhi NCR (CyberHub Express)",
        "city": "Delhi NCR",
        "type": "Express Urban Outlet",
        "footfall_multiplier": 0.80,
    },
]

# Established Indian FMCG & Consumer Electronics Suppliers
SUPPLIERS = [
    {
        "id": "SUP-IN-01",
        "name": "ITC Consumer Goods Supply Logistics",
        "rating": 4.9,
        "reliability": 0.98,
        "contact_email": "orders@itcfoods.in",
        "location": "Bengaluru Regional Distribution Hub",
    },
    {
        "id": "SUP-IN-02",
        "name": "Amul Cooperative Milk Marketing Federation",
        "rating": 4.9,
        "reliability": 0.99,
        "contact_email": "dairy.supply@amul.coop",
        "location": "Anand / Gujarat Central Logistics",
    },
    {
        "id": "SUP-IN-03",
        "name": "Tata Consumer Products National Hub",
        "rating": 4.8,
        "reliability": 0.96,
        "contact_email": "distribution@tataconsumer.com",
        "location": "Mumbai / Bhiwandi Supply Complex",
    },
    {
        "id": "SUP-IN-04",
        "name": "Imagine Marketing (boAt Lifestyle) Dist.",
        "rating": 4.7,
        "reliability": 0.95,
        "contact_email": "fulfillment@boat-lifestyle.com",
        "location": "Gurugram / NCR Logistics Park",
    },
    {
        "id": "SUP-IN-05",
        "name": "TTK Prestige Appliances National Center",
        "rating": 4.8,
        "reliability": 0.96,
        "contact_email": "supply@ttkprestige.com",
        "location": "Hosur / Tamil Nadu Manufacturing Hub",
    },
]

# Generate 90 days of synthetic historical sales data for all Indian SKU x Store combinations
def generate_historical_sales(days: int = 90) -> List[Dict[str, Any]]:
    random.seed(42)
    records = []
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days)

    for prod in PRODUCTS:
        base_demand = {
            "Grocery & Staples": 38,
            "Dairy & Fresh": 48,
            "Beverages": 28,
            "Electronics": 14,
            "Kitchen & Home": 10,
        }.get(prod["category"], 20)

        for store in STORES:
            store_mult = store["footfall_multiplier"]

            for day_offset in range(days):
                cur_date = start_date + datetime.timedelta(days=day_offset)
                dow = cur_date.weekday() # 0 = Monday, 6 = Sunday

                # Indian weekend shopping surge (Friday, Saturday, Sunday)
                weekend_factor = 1.38 if dow in [4, 5, 6] else 0.90

                # Indian salary cycle (1st to 5th and mid-month)
                day_of_month = cur_date.day
                payday_factor = 1.25 if day_of_month in [1, 2, 3, 4, 5, 15, 16] else 1.0
                sine_trend = 1.0 + 0.12 * math.sin(day_offset / 14.0 * math.pi)

                # Festive / Super Saver weekend promotions
                is_promo = 1 if (random.random() < 0.10 or (dow == 5 and random.random() < 0.30)) else 0
                promo_boost = 1.45 if is_promo else 1.0

                # Discount percentage during promotional events
                discount_pct = random.choice([0.05, 0.10, 0.15]) if is_promo else 0.0
                effective_price = round(prod["unit_price"] * (1.0 - discount_pct), 2)

                # Realistic Gaussian demand noise
                noise = random.gauss(1.0, 0.10)

                expected_demand = (
                    base_demand
                    * store_mult
                    * weekend_factor
                    * payday_factor
                    * sine_trend
                    * promo_boost
                    * noise
                )
                actual_demand = max(0, int(round(expected_demand)))

                records.append({
                    "date": cur_date.isoformat(),
                    "sku_id": prod["id"],
                    "sku_name": prod["name"],
                    "category": prod["category"],
                    "store_id": store["id"],
                    "store_name": store["name"],
                    "units_sold": actual_demand,
                    "unit_price": effective_price,
                    "is_promo": is_promo,
                    "discount_pct": discount_pct,
                    "day_of_week": dow,
                    "month": cur_date.month,
                    "is_weekend": 1 if dow in [5, 6] else 0,
                })

    return records

# Initialize inventory levels per SKU x Store with intuitive Indian retail rebalancing scenarios
def generate_initial_inventory() -> List[Dict[str, Any]]:
    random.seed(101)
    inventory = []
    for prod in PRODUCTS:
        for store in STORES:
            # Set clear, intuitive imbalances so anyone can grasp the value immediately:
            if prod["id"] == "SKU-IN-02" and store["id"] == "STORE-01":
                # Amul Butter at Mumbai Bandra: ONLY 6 units left! (Imminent Stockout Crisis)
                current_stock = 6
            elif prod["id"] == "SKU-IN-02" and store["id"] == "STORE-02":
                # Amul Butter at Bengaluru Indiranagar: 92 units (Surplus available for transfer)
                current_stock = 92
            elif prod["id"] == "SKU-IN-04" and store["id"] == "STORE-03":
                # boAt Airdopes at Delhi NCR: ONLY 8 units left (Critical Low Stock)
                current_stock = 8
            elif prod["id"] == "SKU-IN-04" and store["id"] == "STORE-01":
                # boAt Airdopes at Mumbai: 75 units (Excess stock ready to rebalance)
                current_stock = 75
            elif prod["id"] == "SKU-IN-01" and store["id"] == "STORE-03":
                # Aashirvaad Atta at Delhi: 16 units (Reorder Point triggered)
                current_stock = 16
            elif prod["id"] == "SKU-IN-05" and store["id"] == "STORE-02":
                # Prestige Induction Pan at Bengaluru: Overstocked at 85 units
                current_stock = 85
            else:
                current_stock = random.randint(35, 70)

            inventory.append({
                "sku_id": prod["id"],
                "sku_name": prod["name"],
                "category": prod["category"],
                "store_id": store["id"],
                "store_name": store["name"],
                "current_stock": current_stock,
                "unit_price": prod["unit_price"],
                "cost_price": prod["cost_price"],
                "holding_cost_per_day": prod["holding_cost_per_day"],
                "lead_time_days": prod["lead_time_days"],
                "supplier_id": prod["supplier_id"],
                "allocated_stock": random.randint(0, 3),
                "in_transit": random.choice([0, 0, 10, 20]),
            })
    return inventory
