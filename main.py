from fastapi import FastAPI
from pydantic import BaseModel

from coordinator import process_request

app = FastAPI(title="SafeBridge AI API")

# -------------------------
# Request Model
# -------------------------
class ChatRequest(BaseModel):
    message: str

# -------------------------
# Home
# -------------------------
@app.get("/")
def home():
    return {
        "message": "Welcome to SafeBridge AI Backend 🚨"
    }

# -------------------------
# Emergency Alerts
# -------------------------
@app.get("/alerts")
def alerts():
    return {
        "alert": "⚠️ Flash Flood Warning",
        "location": "River Side Area",
        "severity": "High"
    }

# -------------------------
# Shelters
# -------------------------
@app.get("/shelters")
def shelters():
    return {
        "name": "Community Hall Shelter",
        "capacity": 150,
        "status": "Open"
    }

# -------------------------
# AI Chat
# -------------------------
@app.post("/chat")
def chat(request: ChatRequest):

    # Simple security validation
    if len(request.message) > 500:
        return {"error": "Message too long"}

    response = process_request(request.message)

    return response

# -------------------------
# Volunteer Registration
# -------------------------
@app.post("/volunteer")
def volunteer():
    return {
        "message": "✅ Volunteer Registered Successfully"
    }

# -------------------------
# SOS
# -------------------------
@app.post("/sos")
def sos():
    return {
        "status": "SOS Sent",
        "message": "Emergency team has been notified."
    }