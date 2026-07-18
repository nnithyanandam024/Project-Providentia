# Project Providentia

## AI-Powered Cash Flow Forecasting & Risk Early-Warning Platform for Rural Micro Enterprises

**NABARD Hackathon @ GFF 2026**  
**Theme:** AI for Rural Finance  

### Team Members
- Nithyanandam
- Mithun R S
- Sabareesh S S
- Purushothaman L
- Dhanvanth S

**Institution:** Bannari Amman Institute of Technology

---

## 1. Abstract

Rural micro enterprises such as Self-Help Groups (SHGs), Farmer Producer Organizations (FPOs), and small rural businesses often struggle to access formal credit due to the absence of reliable financial records and early financial risk assessment tools. Financial problems are usually identified only after significant losses occur, making timely intervention difficult.

**Project Providentia** is an AI-powered platform designed to predict short-term cash flow (3–6 months) and identify potential financial risks before they become critical. The system combines financial records, simulated digital transaction patterns, market trends, and seasonal climate information to generate accurate forecasts and explainable risk scores.

---

## 2. Key Modules & Features

### For Rural Entrepreneurs (SHGs & FPOs)
- **3-6 Month AI Cash Flow Projection**: Time-series forecasting incorporating monsoon cycles, harvest seasons, and market price impact.
- **Explainable Risk Scoring**: Financial health gauge (0-100) with DSCR ratio, liquidity buffer days, and debt service metrics.
- **What-If Scenario Simulator**: Interactive stress testing for monsoon drought (-40% to +30%) and market crop price fluctuations.
- **Low-Literacy Voice Assistant**: Hands-free regional voice prompt support for micro-entrepreneurs.
- **Offline Network Support**: Local caching simulation for low-network rural environments.

### For NABARD Field Officers
- **Portfolio Risk Overview**: District-wide credit monitoring, total outstanding credit exposure, and overall portfolio health score.
- **Risk Matrix Filtering**: Filter monitored units by Low 🟢, Medium 🟡, or High 🔴 Risk levels.
- **Supervisory Audit Panel**: Record field inspection notes, issue 3-month loan EMI moratoriums, or allocate liquidity buffer grants.
- **Printable Credit Assessment Report**: One-click printable summary formatted for bank credit approval committees.

---

## 3. Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Recharts, Lucide-react
- **Backend**: FastAPI, Python 3.11, Uvicorn
- **Authentication**: JWT (JSON Web Tokens), HMAC-SHA256, Role-Based Access Control (RBAC)
- **Database**: SQLite
- **Machine Learning**: Time-series forecasting with seasonal multipliers & explainable risk scoring formulas

---

## 4. Setup & Running Locally

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Initialize database seed data
python database.py

# Run FastAPI backend server
python main.py
# Server runs on http://127.0.0.1:8000
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# App runs on http://localhost:5173
```
