from agents.alert_agent import get_alert
from agents.shelter_agent import get_shelter
from agents.medical_agent import get_hospital
from agents.route_agent import safe_route


def process_request(message):

    message = message.lower()

    if "alert" in message or "flood" in message:
        return get_alert()

    elif "shelter" in message:
        return get_shelter()

    elif "hospital" in message or "medical" in message:
        return get_hospital()

    elif "route" in message or "road" in message:
        return safe_route()

    else:
        return {
            "response": "I can help with alerts, shelters, hospitals, routes, and emergency assistance."
        }