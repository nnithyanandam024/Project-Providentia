import numpy as np

def forecast_cash_flow(historical_logs, months_ahead=6, climate_factor=1.0, market_factor=1.0):
    """
    Predicts monthly Income, Expense, and Net Cash Flow for the next N months (3-6 months)
    incorporating historical trend, seasonal weights, climate forecast, and market price multipliers.
    """
    if not historical_logs:
        return []

    # Sort logs chronologically
    sorted_logs = sorted(historical_logs, key=lambda x: x["year_month"])
    incomes = [x["income"] for x in sorted_logs]
    expenses = [x["expense"] for x in sorted_logs]

    # Calculate average baseline growth rates
    avg_inc = np.mean(incomes[-6:]) if len(incomes) >= 6 else np.mean(incomes)
    avg_exp = np.mean(expenses[-6:]) if len(expenses) >= 6 else np.mean(expenses)

    # Seasonal indices for upcoming months (Aug to Jan cycle)
    # Aug, Sep, Oct (Festival/Pre-harvest), Nov, Dec, Jan (Harvest)
    seasonal_income_weights = [1.02, 1.08, 1.15, 1.10, 0.95, 1.20]
    seasonal_expense_weights = [1.00, 1.05, 1.12, 1.08, 0.98, 1.05]

    forecasts = []
    # Start from next month (2026-08)
    start_year = 2026
    start_month = 8

    for i in range(months_ahead):
        m = (start_month - 1 + i) % 12 + 1
        y = start_year + (start_month - 1 + i) // 12
        ym_str = f"{y}-{m:02d}"

        idx = i % len(seasonal_income_weights)
        s_inc = seasonal_income_weights[idx]
        s_exp = seasonal_expense_weights[idx]

        # Apply climate & market factors
        proj_inc = round(avg_inc * s_inc * climate_factor * market_factor, 2)
        proj_exp = round(avg_exp * s_exp * (1.0 + (1.0 - market_factor) * 0.3), 2)
        net_flow = round(proj_inc - proj_exp, 2)

        # Confidence bounds (pessimistic / optimistic)
        pessimistic_net = round(net_flow * 0.82 - (proj_exp * 0.05), 2)
        optimistic_net = round(net_flow * 1.18 + (proj_inc * 0.05), 2)

        forecasts.append({
            "year_month": ym_str,
            "projected_income": proj_inc,
            "projected_expense": proj_exp,
            "projected_net_cash_flow": net_flow,
            "pessimistic_net_cash_flow": pessimistic_net,
            "optimistic_net_cash_flow": optimistic_net
        })

    return forecasts

def calculate_risk_score(enterprise, historical_logs, forecast_data):
    """
    Computes explainable risk score (0 to 100) and risk level.
    Lower score = safer, Higher score = higher risk.
    """
    # 1. DSCR (Debt Service Coverage Ratio)
    # Available cash flow / Monthly Loan EMI
    recent_logs = historical_logs[-3:] if len(historical_logs) >= 3 else historical_logs
    avg_recent_net = np.mean([x["income"] - x["expense"] for x in recent_logs]) if recent_logs else 0
    monthly_emi = enterprise.get("monthly_loan_emi", 0)

    if monthly_emi > 0:
        dscr = avg_recent_net / monthly_emi
    else:
        dscr = 2.5 # Excellent DSCR if no EMI

    # 2. Liquidity Buffer (Days of expenses covered by current savings)
    avg_monthly_exp = np.mean([x["expense"] for x in recent_logs]) if recent_logs else 1
    daily_exp = avg_monthly_exp / 30.0 if avg_monthly_exp > 0 else 1
    savings = enterprise.get("current_savings", 0)
    liquidity_days = round(savings / daily_exp, 1)

    # 3. Forecast Deficit Risk (Number of negative net cash flow months projected)
    negative_months = sum(1 for f in forecast_data if f["projected_net_cash_flow"] < 0)

    # 4. Debt-to-Credit Limit Ratio
    credit_limit = enterprise.get("credit_limit", 1)
    outstanding_loan = enterprise.get("current_loan_outstanding", 0)
    leverage_ratio = outstanding_loan / credit_limit if credit_limit > 0 else 0

    # Risk Scoring Formula Points (Max 100)
    # DSCR Component (30 pts max)
    if dscr >= 1.5:
        dscr_risk = 0
    elif dscr >= 1.0:
        dscr_risk = 15
    elif dscr >= 0.7:
        dscr_risk = 25
    else:
        dscr_risk = 30

    # Liquidity Buffer Component (25 pts max)
    if liquidity_days >= 60:
        liquidity_risk = 0
    elif liquidity_days >= 30:
        liquidity_risk = 10
    elif liquidity_days >= 15:
        liquidity_risk = 18
    else:
        liquidity_risk = 25

    # Forecast Deficit Component (25 pts max)
    forecast_risk = min(25, negative_months * 8)

    # Leverage Ratio Component (20 pts max)
    if leverage_ratio <= 0.4:
        leverage_risk = 0
    elif leverage_ratio <= 0.7:
        leverage_risk = 10
    elif leverage_ratio <= 0.9:
        leverage_risk = 15
    else:
        leverage_risk = 20

    total_risk_score = int(round(dscr_risk + liquidity_risk + forecast_risk + leverage_risk))
    total_risk_score = max(0, min(100, total_risk_score))

    # Risk Level Categorization
    if total_risk_score <= 35:
        risk_level = "Low Risk"
        risk_category = "Low"
    elif total_risk_score <= 65:
        risk_level = "Medium Risk"
        risk_category = "Medium"
    else:
        risk_level = "High Risk"
        risk_category = "High"

    drivers = [
        {
            "name": "Debt Service Coverage (DSCR)",
            "value": f"{dscr:.2f}x",
            "benchmark": "> 1.25x recommended",
            "impact": "High" if dscr < 1.0 else ("Medium" if dscr < 1.3 else "Low"),
            "status": "Stress Point" if dscr < 1.0 else "Stable"
        },
        {
            "name": "Liquidity Buffer",
            "value": f"{liquidity_days} days",
            "benchmark": "> 45 days recommended",
            "impact": "High" if liquidity_days < 20 else ("Medium" if liquidity_days < 45 else "Low"),
            "status": "Insufficient Reserve" if liquidity_days < 20 else "Adequate Reserve"
        },
        {
            "name": "Projected Cash Deficit",
            "value": f"{negative_months} out of 6 months",
            "benchmark": "0 months deficit",
            "impact": "High" if negative_months >= 2 else ("Medium" if negative_months == 1 else "Low"),
            "status": "Cash Flow Deficit Warning" if negative_months > 0 else "Positive Projection"
        },
        {
            "name": "Credit Limit Utilization",
            "value": f"{int(leverage_ratio * 100)}%",
            "benchmark": "< 70% recommended",
            "impact": "High" if leverage_ratio > 0.8 else "Low",
            "status": "Near Limit" if leverage_ratio > 0.8 else "Healthy Margin"
        }
    ]

    return {
        "score": total_risk_score,
        "level": risk_level,
        "category": risk_category,
        "metrics": {
            "dscr": round(dscr, 2),
            "liquidity_days": liquidity_days,
            "negative_months": negative_months,
            "leverage_ratio_pct": int(leverage_ratio * 100)
        },
        "drivers": drivers
    }

def generate_recommendations(risk_assessment, enterprise):
    """
    Generates actionable financial advice tailored to enterprise needs.
    Strictly professional language with no emojis.
    """
    recs = []

    metrics = risk_assessment["metrics"]
    cat = risk_assessment["category"]

    if metrics["dscr"] < 1.0:
        recs.append({
            "type": "Urgent Action",
            "title": "Restructure Short-Term Debt EMI",
            "description": f"The current Debt Service Coverage Ratio ({metrics['dscr']}x) is below 1.0x. Consider requesting a 3-month EMI moratorium or extending repayment tenure with NABARD field officer assistance to prevent default."
        })

    if metrics["liquidity_days"] < 30:
        recs.append({
            "type": "Liquidity Management",
            "title": "Establish Emergency Reserve Buffer",
            "description": f"Current savings cover only {metrics['liquidity_days']} days of operating expenses. Direct 15% of upcoming harvest/festival revenues into an interest-bearing liquidity reserve account."
        })

    if metrics["negative_months"] > 0:
        recs.append({
            "type": "Cash Flow Optimization",
            "title": "Optimize Raw Material Procurement & Operating Costs",
            "description": "Projected cash deficit detected in upcoming quarterly window. Bulk purchase raw materials via FPO collective ordering to reduce input costs by 8-12%."
        })

    # Standard growth recommendation
    if cat == "Low":
        recs.append({
            "type": "Credit Expansion",
            "title": "Eligible for Low-Interest Working Capital Expansion",
            "description": "Enterprise maintains robust financial health. Recommend applying for NABARD Working Capital Scheme at concessionary interest rates to scale operations."
        })

    return recs
