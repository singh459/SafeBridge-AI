const DISASTER_DATA = {
  activeDisasters: [
    {
      id: "d1",
      type: "flood",
      title: "Flash Flood Alert",
      severity: "critical",
      location: "Riverside Sector & Downtown Area",
      description: "Water levels rising rapidly by 1.2m. Evacuate immediate low-lying areas. Avoid Riverside Drive.",
      timestamp: "10 mins ago"
    },
    {
      id: "d2",
      type: "cyclone",
      title: "Cyclone 'Vardah' Approaching",
      severity: "high",
      location: "Coastal Belt & East Zone",
      description: "Landfall expected in 4 hours. High winds up to 120km/h. All residents advised to secure loose objects and seek shelter.",
      timestamp: "25 mins ago"
    },
    {
      id: "d3",
      type: "earthquake",
      title: "Aftershock Warning",
      severity: "medium",
      location: "North Ridge District",
      description: "Magnitude 4.2 aftershock recorded. Check structural integrity of buildings before re-entry.",
      timestamp: "1 hour ago"
    }
  ],

  shelters: [
    {
      id: "s1",
      name: "St. Mary's Community Hall",
      type: "flood",
      lat: 12.9716,
      lng: 77.5946,
      status: "open",
      capacity: { total: 250, occupied: 180 },
      amenities: ["Food", "Water", "First Aid", "Power Generators", "Pets Allowed"],
      address: "12th Cross Road, Ashok Nagar",
      phone: "+1 (555) 019-2834"
    },
    {
      id: "s2",
      name: "Central Sports Stadium (Safe Haven)",
      type: "cyclone",
      lat: 12.9820,
      lng: 77.6080,
      status: "open",
      capacity: { total: 1000, occupied: 420 },
      amenities: ["Food", "Water", "Full Medical Camp", "Sleeping Cots", "Charging Stations", "Child Care"],
      address: "M. Chinnaswamy Stadium Road",
      phone: "+1 (555) 019-5821"
    },
    {
      id: "s3",
      name: "Oakridge Secondary School",
      type: "earthquake",
      lat: 12.9560,
      lng: 77.5760,
      status: "full",
      capacity: { total: 150, occupied: 150 },
      amenities: ["Food", "Water", "Basic First Aid", "Blankets"],
      address: "4th Main Road, Chamarajpet",
      phone: "+1 (555) 019-3344"
    },
    {
      id: "s4",
      name: "Metro Station Level 2 (Dry Zone)",
      type: "flood",
      lat: 12.9645,
      lng: 77.5890,
      status: "open",
      capacity: { total: 500, occupied: 120 },
      amenities: ["Water", "First Aid", "Elevated Dry Area", "Security Desk"],
      address: "City Market Metro Station",
      phone: "+1 (555) 019-9900"
    }
  ],

  medicalCenters: [
    {
      id: "m1",
      name: "City General Hospital (ER)",
      lat: 12.9756,
      lng: 77.5856,
      status: "active",
      capacity: "critical",
      waitTime: "45 mins",
      specialties: ["Trauma Care", "Surgery", "Pediatrics", "Burn Ward"],
      phone: "+1 (555) 011-8899",
      address: "Hospital Road, Shivaji Nagar"
    },
    {
      id: "m2",
      name: "Red Cross Mobile Clinic 1",
      lat: 12.9690,
      lng: 77.6210,
      status: "active",
      capacity: "stable",
      waitTime: "10 mins",
      specialties: ["First Aid", "Wound Dressings", "Dehydration Treatment", "Vaccines"],
      phone: "+1 (555) 011-2244",
      address: "Near Domlur Flyover Park"
    },
    {
      id: "m3",
      name: "Apollo Emergency Care Center",
      lat: 12.9510,
      lng: 77.6040,
      status: "active",
      capacity: "busy",
      waitTime: "25 mins",
      specialties: ["Cardiac Care", "Orthopedics", "General Triage"],
      phone: "+1 (555) 011-5566",
      address: "Richmond Road, Near Life Style"
    }
  ],

  roads: [
    {
      id: "r1",
      name: "Outer Ring Road (Bridge Section)",
      status: "blocked",
      reason: "Severe water logging (1.5m deep)",
      type: "flood",
      path: [
        [12.9780, 77.6400],
        [12.9680, 77.6420],
        [12.9580, 77.6450]
      ]
    },
    {
      id: "r2",
      name: "North Ridge Highway (Route 4)",
      status: "warning",
      reason: "Debris and minor rockfall, drive slow",
      type: "earthquake",
      path: [
        [12.9990, 77.5800],
        [12.9890, 77.5750],
        [12.9790, 77.5700]
      ]
    },
    {
      id: "r3",
      name: "MG Road Main Corridor",
      status: "safe",
      reason: "Cleared of debris, fully operational",
      type: "clear",
      path: [
        [12.9740, 77.6010],
        [12.9742, 77.6110],
        [12.9745, 77.6210]
      ]
    },
    {
      id: "r4",
      name: "Riverside Parkway",
      status: "blocked",
      reason: "River overflowing, road submerged",
      type: "flood",
      path: [
        [12.9610, 77.5850],
        [12.9630, 77.5920],
        [12.9650, 77.6000]
      ]
    }
  ],

  volunteers: [
    {
      id: "v1",
      name: "Bangalore Rescue Alliance",
      phone: "+1 (555) 019-8800",
      resourceType: "transport",
      capacity: "3 inflatable rescue boats, 2 4x4 off-road trucks"
    },
    {
      id: "v2",
      name: "Dr. Sarah D'Souza",
      phone: "+1 (555) 011-3322",
      resourceType: "medical",
      capacity: "Trauma specialist, available for mobile first-aid camp setup"
    },
    {
      id: "v3",
      name: "Youth Volunteer Network",
      phone: "+1 (555) 019-1122",
      resourceType: "manpower",
      capacity: "25 volunteers ready for supply distribution or debris clearing"
    }
  ],

  chatbotResponses: {
    greetings: [
      "Hello, I am **SafeBridge AI**, your emergency crisis assistant. How can I help you stay safe today? You can ask me about shelters, road safety, first aid tips, or cyclone/flood guides."
    ],
    shelter: [
      "Here are the active emergency shelters: \n\n" +
      "1. **St. Mary's Community Hall** (Ashok Nagar) - Open, has food & power generators.\n" +
      "2. **Central Sports Stadium** (M. Chinnaswamy Rd) - Open, massive capacity, full medical camp.\n" +
      "3. **Metro Station Level 2** (City Market) - Open dry zone.\n\n" +
      "Would you like me to find the nearest shelter relative to a specific district?"
    ],
    flood: [
      "⚠️ **FLOOD SAFETY PROTOCOLS** ⚠️\n\n" +
      "- **Move to Higher Ground**: Immediately head to the top floor or an elevated shelter if water enters your building.\n" +
      "- **Avoid Flowing Water**: Do not attempt to walk, swim, or drive through flood waters. Just 6 inches of fast-flowing water can knock you over; 2 feet can float a car.\n" +
      "- **Electrical Safety**: Turn off power at the main breaker if it's safe to do so. Never touch electrical equipment if you are wet or standing in water.\n" +
      "- **Stay Informed**: Avoid Riverside Parkway and Outer Ring Road which are currently submerged."
    ],
    cyclone: [
      "🌀 **CYCLONE SAFETY GUIDE** 🌀\n\n" +
      "- **Stay Indoors**: Remain in the strongest part of your house (usually the bathroom or hallway away from windows).\n" +
      "- **Prepare Emergency Kit**: Ensure you have clean water, high-energy snacks, a flashlight, batteries, and first-aid supplies ready.\n" +
      "- **Disconnect Appliances**: Unplug major appliances to avoid damage from power surges.\n" +
      "- **Evacuate if Ordered**: If emergency services instruct you to move to a shelter like **Central Sports Stadium**, do so immediately."
    ],
    earthquake: [
      "🫨 **EARTHQUAKE SAFETY RULES (DROP, COVER, HOLD ON)** 🫨\n\n" +
      "- **Drop**: Drop onto your hands and knees to protect yourself from falling.\n" +
      "- **Cover**: Cover your head and neck under a sturdy table or desk. If no shelter is nearby, get next to an interior wall.\n" +
      "- **Hold On**: Hold onto your shelter until the shaking stops.\n" +
      "- **Outdoors**: Move away from buildings, streetlights, and utility wires, then drop and cover.\n" +
      "- *Caution*: Watch out for aftershocks. The North Ridge Highway is currently reporting debris fall."
    ],
    medical: [
      "🚑 **MEDICAL SERVICES AVAILABILITY** 🚑\n\n" +
      "- **City General Hospital (ER)**: Operating, but at critical capacity. Wait time is approx. 45 mins. Handles trauma and surgery.\n" +
      "- **Red Cross Mobile Clinic 1** (Domlur Park): Open, wait time is under 10 mins. Great for first aid, dressings, and dehydration.\n" +
      "- **Apollo Emergency Care Center** (Richmond Rd): Open, wait time is 25 mins. Handles general triage & cardiac care.\n\n" +
      "*For life-threatening emergencies, press the **SOS Beacon** on the top panel of this app to alert active rescue response units.*"
    ],
    road: [
      "🛣️ **CURRENT ROAD CONDITIONS** 🛣️\n\n" +
      "- **Blocked**: **Outer Ring Road** (Water logging) & **Riverside Parkway** (Overflowing river).\n" +
      "- **Warning**: **North Ridge Highway** (Debris/rockfalls). Drive extremely slowly.\n" +
      "- **Safe**: **MG Road Main Corridor** (Fully cleared & open).\n\n" +
      "Use our interactive map to visualize these paths directly."
    ],
    supplies: [
      "📦 **CRITICAL SUPPLIES NEEDED** 📦\n\n" +
      "Emergency shelters are currently requesting the following donations:\n" +
      "- Dry rations and high-calorie nutrition bars.\n" +
      "- Bottled drinking water.\n" +
      "- Blankets and warm clothing.\n" +
      "- Baby formula and hygiene kits.\n\n" +
      "You can toggle the dashboard to **Responder Mode** to sign up as a volunteer or submit details about resources you can distribute."
    ],
    default: [
      "I'm here to help. Please type keywords like **flood**, **cyclone**, **earthquake**, **shelter**, **medical**, or **road** to get specific instructions, directions, and safety tips."
    ]
  }
};
