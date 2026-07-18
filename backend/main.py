import os
import sys
from contextlib import asynccontextmanager

sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import database
import auth
from ml_engine import forecast_cash_flow, calculate_risk_score, generate_recommendations

# Lifespan Context Manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield

app = FastAPI(
    title="Project Providentia API",
    description="AI-Powered Cash Flow Forecasting & Risk Early-Warning Platform for Rural Micro Enterprises",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class LoginRequest(BaseModel):
    identifier: str # Phone number or Email
    password: str

class TransactionCreate(BaseModel):
    year_month: str
    income: float
    expense: float
    savings_added: Optional[float] = 0.0
    loan_repayment: Optional[float] = 0.0

class SimulationRequest(BaseModel):
    monsoon_impact_pct: Optional[float] = 0.0
    market_price_pct: Optional[float] = 0.0
    additional_monthly_expense: Optional[float] = 0.0

class OfficerActionCreate(BaseModel):
    enterprise_id: str
    action_type: str
    notes: Optional[str] = ""

# API Endpoints

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "platform": "Project Providentia API"}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE identifier = ?", (req.identifier,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=400, detail="Invalid identifier or password.")

    user = dict(row)
    if not auth.verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid identifier or password.")

    token = auth.create_access_token({
        "sub": user["identifier"],
        "role": user["role"],
        "enterprise_id": user["enterprise_id"],
        "district": user["assigned_district"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "identifier": user["identifier"],
            "role": user["role"],
            "full_name": user["full_name"],
            "enterprise_id": user["enterprise_id"],
            "assigned_district": user["assigned_district"]
        }
    }

@app.get("/api/auth/me")
def get_current_user_profile(current_user: dict = Depends(auth.get_current_user)):
    return {
        "id": current_user["id"],
        "identifier": current_user["identifier"],
        "role": current_user["role"],
        "full_name": current_user["full_name"],
        "enterprise_id": current_user["enterprise_id"],
        "assigned_district": current_user["assigned_district"]
    }

@app.get("/api/enterprises")
def get_enterprises():
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM enterprises")
    rows = cursor.fetchall()

    enterprises_list = []
    for r in rows:
        ent = dict(r)
        cursor.execute("SELECT * FROM monthly_logs WHERE enterprise_id = ? ORDER BY year_month ASC", (ent["id"],))
        logs = [dict(x) for x in cursor.fetchall()]

        forecasts = forecast_cash_flow(logs, months_ahead=6)
        risk = calculate_risk_score(ent, logs, forecasts)

        ent["risk_summary"] = {
            "score": risk["score"],
            "level": risk["level"],
            "category": risk["category"],
            "dscr": risk["metrics"]["dscr"],
            "liquidity_days": risk["metrics"]["liquidity_days"]
        }
        enterprises_list.append(ent)

    conn.close()
    return enterprises_list

@app.get("/api/enterprises/{enterprise_id}")
def get_enterprise_detail(enterprise_id: str):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM enterprises WHERE id = ?", (enterprise_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Enterprise not found")

    ent = dict(row)

    cursor.execute("SELECT * FROM monthly_logs WHERE enterprise_id = ? ORDER BY year_month ASC", (enterprise_id,))
    logs = [dict(x) for x in cursor.fetchall()]

    forecasts = forecast_cash_flow(logs, months_ahead=6)
    risk = calculate_risk_score(ent, logs, forecasts)
    recs = generate_recommendations(risk, ent)

    cursor.execute("SELECT * FROM officer_actions WHERE enterprise_id = ? ORDER BY created_at DESC", (enterprise_id,))
    actions = [dict(x) for x in cursor.fetchall()]

    conn.close()

    return {
        "enterprise": ent,
        "historical_logs": logs,
        "forecasts": forecasts,
        "risk_assessment": risk,
        "recommendations": recs,
        "officer_actions": actions
    }

@app.post("/api/enterprises/{enterprise_id}/transactions")
def add_transaction(enterprise_id: str, payload: TransactionCreate):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM enterprises WHERE id = ?", (enterprise_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Enterprise not found")

    cursor.execute("""
    INSERT INTO monthly_logs (enterprise_id, year_month, income, expense, savings_added, loan_repayment)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (enterprise_id, payload.year_month, payload.income, payload.expense, payload.savings_added, payload.loan_repayment))

    conn.commit()
    conn.close()

    return {"message": "Transaction logged successfully", "enterprise_id": enterprise_id}

@app.post("/api/simulation/{enterprise_id}")
def run_simulation(enterprise_id: str, sim: SimulationRequest):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM enterprises WHERE id = ?", (enterprise_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Enterprise not found")

    ent = dict(row)

    cursor.execute("SELECT * FROM monthly_logs WHERE enterprise_id = ? ORDER BY year_month ASC", (enterprise_id,))
    logs = [dict(x) for x in cursor.fetchall()]
    conn.close()

    climate_factor = 1.0 + (sim.monsoon_impact_pct / 100.0)
    market_factor = 1.0 + (sim.market_price_pct / 100.0)

    sim_forecasts = forecast_cash_flow(logs, months_ahead=6, climate_factor=climate_factor, market_factor=market_factor)

    if sim.additional_monthly_expense > 0:
        for f in sim_forecasts:
            f["projected_expense"] += sim.additional_monthly_expense
            f["projected_net_cash_flow"] = round(f["projected_income"] - f["projected_expense"], 2)
            f["pessimistic_net_cash_flow"] = round(f["projected_net_cash_flow"] * 0.82, 2)
            f["optimistic_net_cash_flow"] = round(f["projected_net_cash_flow"] * 1.18, 2)

    sim_risk = calculate_risk_score(ent, logs, sim_forecasts)
    sim_recs = generate_recommendations(sim_risk, ent)

    return {
        "simulation_parameters": sim.dict(),
        "simulated_forecasts": sim_forecasts,
        "simulated_risk_assessment": sim_risk,
        "simulated_recommendations": sim_recs
    }

@app.get("/api/officer/portfolio")
def get_officer_portfolio():
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM enterprises")
    rows = cursor.fetchall()

    total_enterprises = len(rows)
    total_loan_outstanding = 0.0
    total_credit_at_risk = 0.0

    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0

    portfolio_items = []

    for r in rows:
        ent = dict(r)
        total_loan_outstanding += ent["current_loan_outstanding"]

        cursor.execute("SELECT * FROM monthly_logs WHERE enterprise_id = ? ORDER BY year_month ASC", (ent["id"],))
        logs = [dict(x) for x in cursor.fetchall()]
        forecasts = forecast_cash_flow(logs, months_ahead=6)
        risk = calculate_risk_score(ent, logs, forecasts)

        if risk["category"] == "High":
            high_risk_count += 1
            total_credit_at_risk += ent["current_loan_outstanding"]
        elif risk["category"] == "Medium":
            medium_risk_count += 1
        else:
            low_risk_count += 1

        portfolio_items.append({
            "id": ent["id"],
            "name": ent["name"],
            "type": ent["type"],
            "sector": ent["sector"],
            "district": ent["district"],
            "contact_person": ent["contact_person"],
            "loan_outstanding": ent["current_loan_outstanding"],
            "monthly_emi": ent["monthly_loan_emi"],
            "risk_score": risk["score"],
            "risk_level": risk["level"],
            "risk_category": risk["category"],
            "dscr": risk["metrics"]["dscr"],
            "liquidity_days": risk["metrics"]["liquidity_days"]
        })

    conn.close()

    return {
        "portfolio_summary": {
            "total_enterprises": total_enterprises,
            "total_loan_outstanding": total_loan_outstanding,
            "total_credit_at_risk": total_credit_at_risk,
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "overall_portfolio_health_score": int(round(100 - (high_risk_count / max(1, total_enterprises) * 50 + medium_risk_count / max(1, total_enterprises) * 20)))
        },
        "enterprises": portfolio_items
    }

@app.post("/api/officer/actions")
def log_officer_action(action: OfficerActionCreate):
    from datetime import datetime
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO officer_actions (enterprise_id, action_type, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (action.enterprise_id, action.action_type, action.notes, "In Progress", datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

    conn.commit()
    conn.close()

    return {"message": "Officer action recorded successfully"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
