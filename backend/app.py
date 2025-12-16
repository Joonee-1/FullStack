# backend/app.py
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import jwt
import time
import uuid
from bson.objectid import ObjectId
import datetime
import calendar
import os
from pymongo import MongoClient


# -------------------------------------------------------------------
# CONFIG
# -------------------------------------------------------------------
JWT_SECRET = "HARDCODED_SUPER_SECRET_KEY_12345"
JWT_ALG = "HS256"

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/")
DB_NAME = os.getenv("DB_NAME", "bankdb_vuln")

# -------------------------------------------------------------------
# APP + DB
# -------------------------------------------------------------------
app = FastAPI()
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

users = db["users"]
tx = db["transactions"]
support = db["support"]
bills = db["bills"]
cards = db["cards"]
notifications = db["notifications"]
fixed_deposits = db["fixed_deposits"]

# Wide open CORS (intentionally insecure)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.on_event("startup")
async def startup_event():
    # This waits until the app is actually starting up
    # and the DB connection is alive before seeding.
    seed()

# -------------------------------------------------------------------
# SEED ACCOUNTS
# -------------------------------------------------------------------
def seed():
    if users.count_documents({"username": "admin"}) == 0:
        users.insert_one({
            "username": "admin",
            "password": "admin123",
            "role": "admin",
            "balance": 1000000,
            "name": "Admin One",
            "account_no": "VulnBank-100000"
        })

    if users.count_documents({"username": "demo"}) == 0:
        users.insert_one({
            "username": "demo",
            "password": "user123",
            "role": "user",
            "balance": 5000,
            "name": "Demo User",
            "account_no": "VulnBank-200001"
        })

    if bills.count_documents({}) == 0:
        bills.insert_one({
            "owner": "demo",
            "type": "Electricity",
            "amount": 120,
            "due": int(time.time()) + 86400
        })

seed()

# -------------------------------------------------------------------
# HELPERS
# -------------------------------------------------------------------
def make_token(username, role):
    payload = {"sub": username, "role": role, "iat": int(time.time())}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        return None

# -------------------------------------------------------------------
# AUTH & ACCOUNT
# -------------------------------------------------------------------
@app.post("/register")
async def register(req: Request):
    data = await req.json()
    username = data.get("username")
    password = data.get("password")

    account_no = "VulnBank-" + str(200000 + int(time.time()) % 100000)

    users.insert_one({
        "username": username,
        "password": password,
        "name": username,
        "role": "user",
        "balance": 1000.0,
        "account_no": account_no,
        "created": int(time.time())
    })

    notifications.insert_one({
        "username": username,
        "msg": "Welcome to VulnBank!",
        "type": "welcome",
        "time": int(time.time())
    })

    return {"status": "ok", "msg": "registered", "account_no": account_no}


@app.post("/login")
async def login(req: Request):
    data = await req.json()
    username = data.get("username")
    password = data.get("password")

    user = users.find_one({"username": username, "password": password})
    if not user:
        return {"error": "Invalid credentials"}

    token = make_token(username, user.get("role", "user"))
    return {"token": token, "username": username, "role": user.get("role", "user")}


@app.post("/forgot")
async def forgot(req: Request):
    data = await req.json()
    username = data.get("username")
    user = users.find_one({"username": username})

    if not user:
        return {"error": "User not found"}

    return {"password": user.get("password")}  # intentionally vulnerable


@app.get("/profile")
def profile(token: str):
    payload = decode_token(token)
    if not payload:
        return {"error": "Invalid token"}

    username = payload.get("sub")
    u = users.find_one({"username": username}, {"password": 0})

    if not u:
        return {"error": "User not found"}

    u["_id"] = str(u["_id"])
    return u

# -------------------------------------------------------------------
# BALANCE, TRANSFER, HISTORY
# -------------------------------------------------------------------
@app.get("/balance/{username}")
def get_balance(username: str):
    u = users.find_one({"username": username})
    if not u:
        return {"error": "User not found"}
    return {"balance": u["balance"], "account_no": u["account_no"]}


@app.post("/transfer")
async def transfer(req: Request):
    data = await req.json()

    sender_acct = data.get("sender_account")
    receiver_acct = data.get("receiver_account")
    amount = float(data.get("amount", 0))
    description = data.get("description", "")

    sender = users.find_one({"account_no": sender_acct})
    receiver = users.find_one({"account_no": receiver_acct})

    if not sender:
        return {"error": "Sender account not found"}
    if not receiver:
        return {"error": "Recipient account not found"}
    if sender["balance"] < amount:
        return {"error": "Insufficient balance"}

    # update balances
    users.update_one({"account_no": sender_acct}, {"$inc": {"balance": -amount}})
    users.update_one({"account_no": receiver_acct}, {"$inc": {"balance": amount}})

    # record transaction
    tx.insert_one({
        "from": sender["username"],
        "from_account": sender_acct,
        "to": receiver["username"],
        "to_account": receiver_acct,
        "amount": amount,
        "description": description,
        "time": int(time.time())
    })

    # notifications
    notifications.insert_one({
        "username": receiver["username"],
        "msg": f"Received RM{amount} from {sender['username']}",
        "type": "transfer_received",
        "time": int(time.time())
    })

    notifications.insert_one({
        "username": sender["username"],
        "msg": f"Sent RM{amount} to {receiver['username']}",
        "type": "transfer_sent",
        "time": int(time.time())
    })

    return {"status": "ok"}


@app.get("/history/{username}")
def history(username: str):
    docs = list(tx.find({"from": username}))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

# -------------------------------------------------------------------
# Bills, Support, Cards, Notifications
# -------------------------------------------------------------------
@app.get("/bills/{username}")
def get_bills(username: str):
    docs = list(bills.find({"owner": username}))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@app.post("/pay_bill")
async def pay_bill(req: Request):
    data = await req.json()
    username = data.get("username")
    bill_id = data.get("bill_id")

    b = bills.find_one({"_id": ObjectId(bill_id)})
    if b:
        bills.update_one({"_id": ObjectId(bill_id)}, {"$set": {"paid": True}})
        tx.insert_one({
            "from": username,
            "to": b.get("type"),
            "to_account": "BILL",
            "amount": b.get("amount"),
            "description": "Bill Payment",
            "time": int(time.time())
        })

        notifications.insert_one({
            "username": username,
            "msg": f"Paid {b.get('type')} bill RM{b.get('amount')}",
            "type": "bill_payment",
            "time": int(time.time())
        })

        return {"status": "paid"}
    return {"error": "bill not found"}


@app.post("/support/create")
async def create_ticket(req: Request):
    data = await req.json()
    ticket_id = str(uuid.uuid4())

    support.insert_one({
        "ticket_id": ticket_id,
        "username": data.get("username"),
        "subject": data.get("subject"),
        "message": data.get("message"),
        "time": int(time.time())
    })

    return {"status": "created", "ticket_id": ticket_id}


@app.get("/support/list/{username}")
def list_tickets(username: str):
    docs = list(support.find({"username": username}))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@app.get("/notifications/{username}")
def get_notifications(username: str):
    docs = list(notifications.find({"username": username}).sort("time", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@app.post("/cards/create")
async def create_card(req: Request):
    data = await req.json()
    username = data.get("username")

    card_no = "4000" + str(int(time.time()))[-12:]
    cvv = str(int(time.time()))[-3:]

    cards.insert_one({"username": username, "card_no": card_no, "cvv": cvv, "active": True})

    return {"card_no": card_no, "cvv": cvv}


@app.get("/cards/{username}")
def list_cards(username: str):
    docs = list(cards.find({"username": username}))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

# -------------------------------------------------------------------
# STATEMENTS
# -------------------------------------------------------------------
@app.get("/statements/{username}")
def statements_all(username: str):
    u = users.find_one({"username": username})
    acct = u.get("account_no") if u else ""
    docs = list(tx.find({
        "$or": [
            {"from": username},
            {"to_account": acct},
            {"to": username}
        ]
    }).sort("time", 1))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@app.get("/statements/{username}/{year}/{month}")
def monthly_statement(username: str, year: int, month: int):
    user = users.find_one({"username": username})
    if not user:
        return {"error": "User not found"}
    acct = user.get("account_no", "")
    last_day = calendar.monthrange(year, month)[1]
    dt_start = datetime.datetime(year, month, 1, 0, 0, 0)
    dt_end = datetime.datetime(year, month, last_day, 23, 59, 59)
    start_ts = int(dt_start.timestamp())
    end_ts = int(dt_end.timestamp())

    period_docs = list(tx.find({
        "$and": [
            {"time": {"$gte": start_ts, "$lte": end_ts}},
            {"$or": [
                {"from": username},
                {"to_account": acct},
                {"to": username}
            ]}
        ]
    }).sort("time", 1))

    incoming_sum = 0.0
    outgoing_sum = 0.0
    for d in period_docs:
        amt = float(d.get("amount", 0))
        if d.get("from") == username:
            outgoing_sum += amt
        else:
            incoming_sum += amt

    opening_balance = round(user.get("balance", 0.0) - (incoming_sum - outgoing_sum), 2)
    running = opening_balance
    tx_list = []
    for d in period_docs:
        amt = float(d.get("amount", 0))
        signed_amt = -amt if d.get("from") == username else amt
        running = round(running + signed_amt, 2)
        tx_list.append({
            "date": datetime.datetime.utcfromtimestamp(d.get("time")).isoformat() + "Z",
            "description": d.get("description") or d.get("to") or d.get("from") or "",
            "amount": signed_amt,
            "balance": running
        })
    closing_balance = running

    return {
        "month": f"{year}-{str(month).zfill(2)}",
        "opening_balance": opening_balance,
        "closing_balance": closing_balance,
        "transactions": tx_list
    }

# -------------------------------------------------------------------
# ADMIN ENDPOINTS
# -------------------------------------------------------------------
@app.get("/admin/users")
def admin_users():
    docs = list(users.find({}))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@app.get("/admin/transactions")
def admin_transactions():
    docs = list(tx.find({}))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


@app.post("/admin/modify_balance")
async def admin_modify(req: Request):
    data = await req.json()
    username = data.get("username")
    new_balance = float(data.get("balance"))
    users.update_one({"username": username}, {"$set": {"balance": new_balance}})
    return {"status": "ok"}

# -------------------------------------------------------------------
# FILE UPLOAD
# -------------------------------------------------------------------
@app.post("/upload_doc")
async def upload_doc(file: UploadFile = File(...), username: str = ""):
    content = await file.read()
    db.files.insert_one({
        "username": username,
        "filename": file.filename,
        "content": content
    })
    return {"status": "uploaded", "size": len(content)}


# -------------------------------------------------------------------
# ------------------- FIXED DEPOSITS (FD) --------------------------
# -------------------------------------------------------------------

# Create FD
@app.post("/fd/create")
async def create_fd(req: Request):
    data = await req.json()
    username = data.get("username")
    # Accept either duration_months (new) or fallback to duration_days if provided
    duration_months = data.get("duration_months")
    if duration_months is None:
        # backward compatibility: if duration_days passed earlier, convert approx to months
        duration_days = int(data.get("duration_days", 30))
        duration_months = max(1, int(round(duration_days / 30.0)))
    duration_months = int(duration_months)

    amount = float(data.get("amount", 0))
    fd_type = data.get("fd_type", "conventional")
    interest_option = data.get("interest_option", "withdraw")  # 'withdraw' or 'compound'

    user = users.find_one({"username": username})
    if not user:
        return {"error": "User not found"}
    if amount <= 0 or amount > user["balance"]:
        return {"error": "Invalid or insufficient balance"}

    # Deduct principal from user's balance (funds locked into FD)
    users.update_one({"username": username}, {"$inc": {"balance": -amount}})

    # Example month-to-month interest rates (per-month rate)
    month_rate_map = {
        1: 0.0025, 2: 0.005, 3: 0.0075, 4: 0.01, 5: 0.0125, 6: 0.015,
        7: 0.0175, 8: 0.02, 9: 0.0225, 10: 0.025, 11: 0.0275, 12: 0.03
    }

    # Use the per-month rate for the duration_months (example)
    interest_rate = month_rate_map.get(duration_months, 0.03)

    fd_doc = {
        "username": username,
        "amount": amount,
        "interest_rate": interest_rate,
        "start_time": int(time.time()),
        # approximate month -> seconds by 30 days each month (consistent with UI)
        "maturity_time": int(time.time()) + duration_months * 30 * 86400,
        "status": "active",
        "duration_months": duration_months,
        "fd_type": fd_type,
        "interest_option": interest_option,
        "created_at": int(time.time())
    }

    res = fixed_deposits.insert_one(fd_doc)
    fd_doc["_id"] = str(res.inserted_id)

    # record as a transaction (outgoing from user)
    tx.insert_one({
        "from": username,
        "from_account": user.get("account_no"),
        "to": f"FD ({duration_months}m)",
        "to_account": "FD",
        "amount": amount,
        "description": f"FD created ({duration_months} month(s))",
        "time": int(time.time())
    })

    # notification
    notifications.insert_one({
        "username": username,
        "msg": f"FD created: RM{amount} for {duration_months} month(s)",
        "type": "fd_created",
        "time": int(time.time())
    })

    return {"status": "ok", "fd": fd_doc}


# List all FDs for a user
@app.get("/fd/list/{username}")
def list_fd(username: str):
    docs = list(fixed_deposits.find({"username": username}))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


# Withdraw FD (matured)
@app.post("/fd/withdraw")
async def withdraw_fd(req: Request):
    data = await req.json()
    fd_id = data.get("fd_id")
    try:
        fd = fixed_deposits.find_one({"_id": ObjectId(fd_id)})
    except Exception:
        return {"error": "Invalid FD id"}

    if not fd:
        return {"error": "FD not found"}
    if fd.get("status") != "active":
        return {"error": "FD already withdrawn or closed"}

    now = int(time.time())
    if now < fd["maturity_time"]:
        return {"error": "FD not matured yet"}

    principal = fd["amount"]
    duration_years = fd["duration_months"] / 12.0
    # interest calculated as principal * rate * years
    interest = principal * fd["interest_rate"] * duration_years
    total = principal + interest

    # If FD was created with interest_option == "compound", roll it over into a new FD
    if fd.get("interest_option") == "compound":
        # create new FD with amount = principal + interest, same duration and type
        new_fd = {
            "username": fd["username"],
            "amount": total,
            "interest_rate": fd["interest_rate"],
            "start_time": now,
            "maturity_time": now + fd["duration_months"] * 30 * 86400,
            "status": "active",
            "duration_months": fd["duration_months"],
            "fd_type": fd.get("fd_type", "conventional"),
            "interest_option": "compound",
            "created_at": now
        }
        res = fixed_deposits.insert_one(new_fd)
        new_fd["_id"] = str(res.inserted_id)

        # mark old FD as rolled_over
        fixed_deposits.update_one({"_id": ObjectId(fd_id)}, {"$set": {"status": "rolled_over", "rolled_over_at": now, "rolled_to": new_fd["_id"]}})

        # notification
        notifications.insert_one({
            "username": fd["username"],
            "msg": f"FD rolled over: RM{principal:.2f} + RM{interest:.2f} => RM{total:.2f} (new FD created)",
            "type": "fd_rolled",
            "time": int(time.time())
        })

        return {"status": "ok", "rolled_into_fd": new_fd}

    # default behavior: interest_option == "withdraw" -> credit principal + interest to user balance
    users.update_one(
        {"username": fd["username"]},
        {"$inc": {"balance": total}}
    )

    fixed_deposits.update_one(
        {"_id": ObjectId(fd_id)},
        {"$set": {"status": "withdrawn", "withdrawn_at": now}}
    )

    # record as incoming transaction to user's account
    user = users.find_one({"username": fd["username"]})
    acct = user.get("account_no") if user else ""
    tx.insert_one({
        "from": f"FD({fd['duration_months']}m)",
        "from_account": "FD",
        "to": fd["username"],
        "to_account": acct,
        "amount": total,
        "description": f"FD withdrawn ({fd['duration_months']} month(s))",
        "time": now
    })

    # notification
    notifications.insert_one({
        "username": fd["username"],
        "msg": f"FD withdrawn: RM{principal:.2f} principal + RM{interest:.2f} interest",
        "type": "fd_withdrawn",
        "time": int(time.time())
    })

    return {"status": "ok", "principal": principal, "interest": interest, "total": total}


# Cancel FD before maturity
@app.post("/fd/cancel")
async def cancel_fd(req: Request):
    data = await req.json()
    fd_id = data.get("fd_id")
    try:
        fd = fixed_deposits.find_one({"_id": ObjectId(fd_id)})
    except Exception:
        return {"error": "Invalid FD id"}

    if not fd:
        return {"error": "FD not found"}
    if fd.get("status") != "active":
        return {"error": "FD cannot be cancelled"}

    # refund only principal, no interest
    users.update_one({"username": fd["username"]}, {"$inc": {"balance": fd["amount"]}})
    fixed_deposits.update_one(
        {"_id": ObjectId(fd_id)},
        {"$set": {"status": "cancelled", "cancelled_at": int(time.time())}}
    )

    # record tx refunding principal
    user = users.find_one({"username": fd["username"]})
    acct = user.get("account_no") if user else ""
    tx.insert_one({
        "from": "FD(cancel)",
        "from_account": "FD",
        "to": fd["username"],
        "to_account": acct,
        "amount": fd["amount"],
        "description": f"FD cancelled: refund principal RM{fd['amount']}",
        "time": int(time.time())
    })

    # notification
    notifications.insert_one({
        "username": fd["username"],
        "msg": f"FD cancelled: RM{fd['amount']} refunded",
        "type": "fd_cancelled",
        "time": int(time.time())
    })

    return {"status": "ok", "principal": fd["amount"]}


# -------------------------------------------------------------------
# ------------------- NEW: Monthly Statement Endpoint -------------
# -------------------------------------------------------------------
@app.get("/statements/{username}/{year}/{month}")
def monthly_statement(username: str, year: int, month: int):
    """
    Returns a bank-like monthly statement for the given username and year/month.
    - year: integer, e.g. 2025
    - month: 1..12
    """
    # validate month/year
    try:
        year = int(year)
        month = int(month)
        if month < 1 or month > 12:
            return {"error": "Invalid month (1-12)"}
    except Exception:
        return {"error": "Invalid year/month"}

    # user & account
    user = users.find_one({"username": username})
    if not user:
        return {"error": "User not found"}
    acct = user.get("account_no", "")

    # compute month start/end timestamps correctly with calendar (handles leap years)
    last_day = calendar.monthrange(year, month)[1]
    dt_start = datetime.datetime(year, month, 1, 0, 0, 0)
    dt_end = datetime.datetime(year, month, last_day, 23, 59, 59)
    start_ts = int(dt_start.timestamp())
    end_ts = int(dt_end.timestamp())

    # fetch transactions in period (either outgoing from user OR incoming to user's account)
    period_docs = list(tx.find({
        "$and": [
            {"time": {"$gte": start_ts, "$lte": end_ts}},
            {"$or": [
                {"from": username},
                {"to_account": acct},
                # also include txs that refer to this user in other fields
                {"to": username}
            ]}
        ]
    }).sort("time", 1))

    # net change in period = incoming - outgoing
    incoming_sum = 0.0
    outgoing_sum = 0.0
    for d in period_docs:
        amt = float(d.get("amount", 0))
        # treat as outgoing if 'from' matches username
        if d.get("from") == username:
            outgoing_sum += amt
        # treat as incoming if to_account == acct OR to == username
        elif d.get("to_account") == acct or d.get("to") == username:
            incoming_sum += amt

    net_change = incoming_sum - outgoing_sum

    # derive opening balance: current balance - net_change_in_period
    current_balance = user.get("balance", 0.0)
    opening_balance = round(current_balance - net_change, 2)

    # build transactions list with running balance
    running = opening_balance
    tx_list = []

    # sort already by time ascending
    for d in period_docs:
        amt = float(d.get("amount", 0))
        # amount sign: outgoing by user -> negative, incoming -> positive
        if d.get("from") == username:
            signed = -amt
        elif d.get("to_account") == acct or d.get("to") == username:
            signed = amt
        else:
            signed = amt  # default
        running = round(running + signed, 2)

        # description fallback
        desc = d.get("description") or d.get("to") or d.get("from") or ""

        tx_list.append({
            "date": datetime.datetime.utcfromtimestamp(int(d.get("time", 0))).isoformat() + "Z",
            "description": desc,
            "amount": signed,
            "balance": running
        })

    closing_balance = running

    return {
        "month": f"{year}-{str(month).zfill(2)}",
        "opening_balance": round(opening_balance, 2),
        "closing_balance": round(closing_balance, 2),
        "transactions": tx_list
    }
