# 🚨 SafeBridge AI

> **An AI-powered Emergency Response & Disaster Assistance Platform**

SafeBridge AI is a disaster management platform built to help citizens, volunteers, and emergency responders during natural disasters and emergencies. The platform uses a **Multi-Agent AI architecture** where specialized AI agents collaborate to provide real-time assistance.

---

## 🌍 Problem Statement

During floods, earthquakes, cyclones, or other emergencies, people often struggle to find:

- Safe shelters
- Medical assistance
- Safe travel routes
- Real-time emergency alerts
- Volunteer support

SafeBridge AI provides these services through intelligent AI agents.

---

## ✨ Features

- 🚨 Live Disaster Alerts
- 🏠 Nearby Shelter Information
- 🏥 Medical Assistance
- 🛣 Safe Route Suggestions
- 🤝 Volunteer Registration
- 🆘 Emergency SOS Support
- 💬 AI Crisis Assistant
- 📍 Interactive Disaster Dashboard
- 📊 Real-Time Emergency Monitoring

---

# 🤖 AI Agents

SafeBridge AI uses multiple specialized agents.

### 🚨 Alert Agent
Provides disaster alerts and warning information.

### 🏠 Shelter Agent
Finds available emergency shelters.

### 🏥 Medical Agent
Suggests nearby hospitals and medical facilities.

### 🛣 Route Agent
Provides safe travel routes by avoiding dangerous areas.

### 🤝 Volunteer Agent
Registers volunteers and emergency support teams.

### 🎯 Coordinator Agent
Coordinates all agents and returns the best response.

---

# 🧠 Multi-Agent Workflow

```
User Request
      │
      ▼
Coordinator Agent
      │
 ┌────┼─────────────┐
 │    │      │      │
 ▼    ▼      ▼      ▼
Alert Shelter Medical Route
Agent Agent   Agent   Agent
      │
      ▼
Response
```

---

# 📁 Project Structure

```
SafeBridge-AI/

│
├── index.html
├── style.css
├── app.js
├── data.js
│
├── backend/
│   ├── main.py
│   ├── coordinator.py
│   │
│   └── agents/
│       ├── __init__.py
│       ├── alert_agent.py
│       ├── shelter_agent.py
│       ├── medical_agent.py
│       ├── route_agent.py
│       └── volunteer_agent.py
│
└── README.md
```

---

# 💻 Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Python
- FastAPI
- Uvicorn

### AI Architecture

- Multi-Agent Design
- Coordinator Agent Pattern

---

# 🚀 Installation

## 1. Clone Repository

```bash
git clone <repository-url>
cd SafeBridge-AI
```

---

## 2. Install Python Packages

```bash
pip install fastapi uvicorn
```

---

## 3. Start Backend

```bash
cd backend
python -m uvicorn main:app --reload
```

Backend URL

```
http://127.0.0.1:8000
```

---

## 4. Launch Frontend

Open

```
index.html
```

in your browser.

---

# 🔒 Security Features

- Input Validation
- Request Size Validation
- Modular Backend
- Agent Isolation
- Safe API Responses



---

# 🎯 Project Workflow

```
User

   │

Dashboard

   │

FastAPI Backend

   │

Coordinator Agent

   │

──────────────

Alert Agent

Shelter Agent

Medical Agent

Route Agent

Volunteer Agent

──────────────

   │

Response

   │

Dashboard
```

---

# 📸 Dashboard

SafeBridge AI provides:

- Live Alert Feed
- AI Crisis Assistant
- Disaster Map
- Shelter Tracking
- Volunteer Registration
- SOS Button
- Emergency Statistics

---

# 🎓 Use Cases

- Flood Management
- Earthquake Response
- Cyclone Assistance
- Emergency Relief
- Disaster Preparedness
- Community Volunteer Coordination


---

## ⭐ Thank You

SafeBridge AI aims to improve disaster preparedness and emergency response through intelligent AI agents, helping communities stay informed and safe.
