import sqlite3
import os
import hashlib
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "providentia.db")

def hash_password_simple(password: str) -> str:
    """SHA-256 password hash helper for robust database seeding."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Table: Enterprises
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS enterprises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- SHG, FPO, Small Business
        sector TEXT NOT NULL, -- Agriculture, Dairy, Handicrafts, Food Processing, Textiles
        location TEXT NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        established_year INTEGER,
        members_count INTEGER,
        contact_person TEXT,
        contact_phone TEXT,
        credit_limit REAL,
        current_loan_outstanding REAL,
        monthly_loan_emi REAL,
        current_savings REAL,
        last_updated TEXT
    )
    """)

    # Table: Users (Role-Based Authentication)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identifier TEXT UNIQUE NOT NULL, -- Phone or Email
        hashed_password TEXT NOT NULL,
        role TEXT NOT NULL, -- ENTERPRISE or OFFICER
        full_name TEXT NOT NULL,
        enterprise_id TEXT, -- Foreign key if role is ENTERPRISE
        assigned_district TEXT, -- If role is OFFICER
        created_at TEXT NOT NULL,
        FOREIGN KEY(enterprise_id) REFERENCES enterprises(id)
    )
    """)

    # Table: Monthly Financial Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS monthly_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enterprise_id TEXT NOT NULL,
        year_month TEXT NOT NULL, -- YYYY-MM
        income REAL NOT NULL,
        expense REAL NOT NULL,
        savings_added REAL DEFAULT 0,
        loan_repayment REAL DEFAULT 0,
        rain_index REAL DEFAULT 100,
        market_price_index REAL DEFAULT 100,
        FOREIGN KEY(enterprise_id) REFERENCES enterprises(id)
    )
    """)

    # Table: Officer Alerts / Actions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS officer_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enterprise_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(enterprise_id) REFERENCES enterprises(id)
    )
    """)

    conn.commit()

    # Check if seed data exists
    cursor.execute("SELECT COUNT(*) FROM enterprises")
    if cursor.fetchone()[0] == 0:
        seed_data(conn)

    # Seed users if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_users(conn)

    conn.close()

def seed_data(conn):
    cursor = conn.cursor()

    enterprises = [
        {
            "id": "ENT-101",
            "name": "Sri Lakshmi Mahila SHG",
            "type": "SHG",
            "sector": "Handicrafts & Weaving",
            "location": "Omalur",
            "district": "Salem",
            "state": "Tamil Nadu",
            "established_year": 2018,
            "members_count": 14,
            "contact_person": "Lakshmi Ammal",
            "contact_phone": "+91 94431 23456",
            "credit_limit": 300000.0,
            "current_loan_outstanding": 120000.0,
            "monthly_loan_emi": 11500.0,
            "current_savings": 45000.0,
            "last_updated": datetime.now().isoformat()
        },
        {
            "id": "ENT-102",
            "name": "Kaveri Organic Farmers Producer Co",
            "type": "FPO",
            "sector": "Agriculture & Paddy",
            "location": "Orathanadu",
            "district": "Thanjavur",
            "state": "Tamil Nadu",
            "established_year": 2016,
            "members_count": 185,
            "contact_person": "Ramanathan K",
            "contact_phone": "+91 98422 67890",
            "credit_limit": 1500000.0,
            "current_loan_outstanding": 850000.0,
            "monthly_loan_emi": 62000.0,
            "current_savings": 210000.0,
            "last_updated": datetime.now().isoformat()
        },
        {
            "id": "ENT-103",
            "name": "GreenAgri Dairy Cooperative",
            "type": "FPO",
            "sector": "Dairy & Animal Husbandry",
            "location": "Pollachi",
            "district": "Coimbatore",
            "state": "Tamil Nadu",
            "established_year": 2020,
            "members_count": 42,
            "contact_person": "Senthil Kumar",
            "contact_phone": "+91 97890 11223",
            "credit_limit": 800000.0,
            "current_loan_outstanding": 420000.0,
            "monthly_loan_emi": 31000.0,
            "current_savings": 95000.0,
            "last_updated": datetime.now().isoformat()
        },
        {
            "id": "ENT-104",
            "name": "Annapurna Spice Crafters SHG",
            "type": "SHG",
            "sector": "Food Processing",
            "location": "Usilampatti",
            "district": "Madurai",
            "state": "Tamil Nadu",
            "established_year": 2019,
            "members_count": 10,
            "contact_person": "Meenakshi S",
            "contact_phone": "+91 96291 33445",
            "credit_limit": 250000.0,
            "current_loan_outstanding": 190000.0,
            "monthly_loan_emi": 16500.0,
            "current_savings": 18000.0,
            "last_updated": datetime.now().isoformat()
        },
        {
            "id": "ENT-105",
            "name": "Sirumugai Weavers Guild",
            "type": "Small Business",
            "sector": "Textiles & Handloom",
            "location": "Sirumugai",
            "district": "Erode",
            "state": "Tamil Nadu",
            "established_year": 2015,
            "members_count": 25,
            "contact_person": "Natarajan P",
            "contact_phone": "+91 93600 55667",
            "credit_limit": 600000.0,
            "current_loan_outstanding": 110000.0,
            "monthly_loan_emi": 9800.0,
            "current_savings": 140000.0,
            "last_updated": datetime.now().isoformat()
        }
    ]

    for ent in enterprises:
        cursor.execute("""
        INSERT INTO enterprises (
            id, name, type, sector, location, district, state, established_year,
            members_count, contact_person, contact_phone, credit_limit,
            current_loan_outstanding, monthly_loan_emi, current_savings, last_updated
        ) VALUES (
            :id, :name, :type, :sector, :location, :district, :state, :established_year,
            :members_count, :contact_person, :contact_phone, :credit_limit,
            :current_loan_outstanding, :monthly_loan_emi, :current_savings, :last_updated
        )
        """, ent)

    months = [
        ("2025-08", 1.0, 1.0, 100, 100),
        ("2025-09", 1.05, 0.98, 105, 102),
        ("2025-10", 1.20, 1.15, 110, 105),
        ("2025-11", 1.15, 1.10, 95, 103),
        ("2025-12", 0.95, 0.95, 90, 98),
        ("2026-01", 1.25, 1.05, 100, 106),
        ("2026-02", 0.90, 0.90, 85, 95),
        ("2026-03", 0.85, 0.92, 80, 92),
        ("2026-04", 0.80, 0.95, 75, 90),
        ("2026-05", 0.88, 0.98, 85, 94),
        ("2026-06", 1.10, 1.05, 100, 100),
        ("2026-07", 1.02, 1.00, 98, 101)
    ]

    base_profiles = {
        "ENT-101": {"inc": 42000, "exp": 31000, "sav": 3000, "emi": 11500},
        "ENT-102": {"inc": 240000, "exp": 195000, "sav": 15000, "emi": 62000},
        "ENT-103": {"inc": 110000, "exp": 82000, "sav": 8000, "emi": 31000},
        "ENT-104": {"inc": 32000, "exp": 34000, "sav": 1000, "emi": 16500},
        "ENT-105": {"inc": 78000, "exp": 52000, "sav": 6000, "emi": 9800}
    }

    for ent_id, profile in base_profiles.items():
        for ym, inc_m, exp_m, rain, price in months:
            inc = round(profile["inc"] * inc_m, 2)
            exp = round(profile["exp"] * exp_m, 2)
            sav = profile["sav"]
            emi = profile["emi"]

            cursor.execute("""
            INSERT INTO monthly_logs (enterprise_id, year_month, income, expense, savings_added, loan_repayment, rain_index, market_price_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (ent_id, ym, inc, exp, sav, emi, rain, price))

    conn.commit()

def seed_users(conn):
    cursor = conn.cursor()

    users = [
        {
            "identifier": "9443123456",
            "hashed_password": hash_password_simple("password123"),
            "role": "ENTERPRISE",
            "full_name": "Lakshmi Ammal (Sri Lakshmi SHG)",
            "enterprise_id": "ENT-101",
            "assigned_district": "Salem",
            "created_at": datetime.now().isoformat()
        },
        {
            "identifier": "9842267890",
            "hashed_password": hash_password_simple("password123"),
            "role": "ENTERPRISE",
            "full_name": "Ramanathan K (Kaveri FPO)",
            "enterprise_id": "ENT-102",
            "assigned_district": "Thanjavur",
            "created_at": datetime.now().isoformat()
        },
        {
            "identifier": "officer.salem@nabard.org",
            "hashed_password": hash_password_simple("officer123"),
            "role": "OFFICER",
            "full_name": "S. Sundaram (NABARD Officer - Salem)",
            "enterprise_id": None,
            "assigned_district": "Salem",
            "created_at": datetime.now().isoformat()
        },
        {
            "identifier": "officer.thanjavur@nabard.org",
            "hashed_password": hash_password_simple("officer123"),
            "role": "OFFICER",
            "full_name": "P. Vignesh (NABARD Officer - Thanjavur)",
            "enterprise_id": None,
            "assigned_district": "Thanjavur",
            "created_at": datetime.now().isoformat()
        }
    ]

    for u in users:
        cursor.execute("""
        INSERT INTO users (identifier, hashed_password, role, full_name, enterprise_id, assigned_district, created_at)
        VALUES (:identifier, :hashed_password, :role, :full_name, :enterprise_id, :assigned_district, :created_at)
        """, u)

    conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialized with seed enterprises and users successfully.")
