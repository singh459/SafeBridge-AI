// State variables
let map;
let markerLayers = {
  shelters: L.layerGroup(),
  medical: L.layerGroup(),
  roads: L.layerGroup(),
  sos: L.layerGroup()
};

let currentTab = 'shelters'; // 'shelters' | 'roads' | 'medical'
let currentMode = 'survivor'; // 'survivor' | 'responder'
let responderFormTab = 'report'; // 'report' | 'volunteer' | 'volunteers'

let sosReports = [];
let roadPathLines = [];
let mapClickSelectionMode = false;
let selectedCoordinatesForSOS = null;

// Map base layers
let baseLayers = {
  dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 20
  })
};

let weatherRadarOverlay = null;
let hotspotLayerGroup = L.layerGroup();

// LocalStorage persistence helpers
function loadState() {
  const persistedDisasters = localStorage.getItem('safebridge_activeDisasters');
  const persistedRoads = localStorage.getItem('safebridge_roads');
  const persistedVolunteers = localStorage.getItem('safebridge_volunteers');
  const persistedSOS = localStorage.getItem('safebridge_sosReports');
  
  if (persistedDisasters) {
    DISASTER_DATA.activeDisasters = JSON.parse(persistedDisasters);
  } else {
    localStorage.setItem('safebridge_activeDisasters', JSON.stringify(DISASTER_DATA.activeDisasters));
  }
  
  if (persistedRoads) {
    DISASTER_DATA.roads = JSON.parse(persistedRoads);
  } else {
    localStorage.setItem('safebridge_roads', JSON.stringify(DISASTER_DATA.roads));
  }
  
  if (persistedVolunteers) {
    DISASTER_DATA.volunteers = JSON.parse(persistedVolunteers);
  } else {
    localStorage.setItem('safebridge_volunteers', JSON.stringify(DISASTER_DATA.volunteers || []));
  }
  
  if (persistedSOS) {
    sosReports = JSON.parse(persistedSOS);
  } else {
    localStorage.setItem('safebridge_sosReports', JSON.stringify(sosReports));
  }
}

function saveState(key, data) {
  localStorage.setItem('safebridge_' + key, JSON.stringify(data));
}

// SVG Icons
const icons = {
  shelter: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
  medical: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
  danger: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  sos: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initMap();
  loadInitialData();
  setupEventListeners();
  initChatbot();
});

// Map Setup
function initMap() {
  // Default map centered on Bangalore (matching our mock data coordinates)
  map = L.map('map', {
    zoomControl: false
  }).setView([12.9716, 77.5946], 13);
  
  // Custom Zoom Control at bottom right
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);

  // Add default dark base layer to map
  baseLayers.dark.addTo(map);

  // Add all markers layers to map
  Object.values(markerLayers).forEach(layer => layer.addTo(map));

  // Initialize weather radar and hotspots overlay
  setupWeatherRadar();
  updateHotspots();

  // Map Click Listener for SOS coordinate selection
  map.on('click', (e) => {
    if (mapClickSelectionMode) {
      selectedCoordinatesForSOS = e.latlng;
      document.getElementById('sos-location-coords').value = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
      document.getElementById('sos-select-map-btn').innerHTML = '<i class="fas fa-map-marker-alt"></i> Location Selected';
      document.getElementById('sos-select-map-btn').style.background = 'var(--color-success)';
      mapClickSelectionMode = false;
      map.getContainer().style.cursor = '';
    }
  });
}

function setupWeatherRadar() {
  // Center of scan coordinates, covering city area
  const bounds = L.latLngBounds([12.91, 77.53], [13.03, 77.67]);
  
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <radialGradient id="storm1" cx="45%" cy="45%" r="35%">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.8" />
          <stop offset="45%" stop-color="#f59e0b" stop-opacity="0.65" />
          <stop offset="80%" stop-color="#ef4444" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="storm2" cx="55%" cy="50%" r="20%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.75" />
          <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="180" cy="180" r="110" fill="url(#storm1)" class="weather-radar-overlay" />
      <circle cx="270" cy="230" r="60" fill="url(#storm2)" class="weather-radar-overlay" />
    </svg>
  `;
  
  const svgUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));
  weatherRadarOverlay = L.imageOverlay(svgUrl, bounds, {
    opacity: 0.7,
    interactive: false
  });
}

function updateHotspots() {
  hotspotLayerGroup.clearLayers();
  
  // Danger buffer zones around active disaster locations
  DISASTER_DATA.activeDisasters.forEach(disaster => {
    let lat, lng;
    if (disaster.type === 'flood') {
      lat = 12.9645; lng = 77.5890;
    } else if (disaster.type === 'cyclone') {
      lat = 12.9820; lng = 77.6080;
    } else if (disaster.type === 'earthquake') {
      lat = 12.9560; lng = 77.5760;
    } else {
      lat = 12.9716; lng = 77.5946;
    }
    
    let color = 'var(--color-info)';
    if (disaster.severity === 'critical') color = 'var(--color-danger)';
    if (disaster.severity === 'high') color = 'var(--color-warning)';
    
    const circle = L.circle([lat, lng], {
      radius: disaster.type === 'flood' ? 700 : 1000,
      color: color,
      fillColor: color,
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '3, 6'
    });
    circle.bindPopup(`<strong>Hazard Boundary:</strong> ${disaster.title} (${disaster.location})`);
    hotspotLayerGroup.addLayer(circle);
  });
  
  // Danger buffers around active user SOS reports
  sosReports.forEach(sos => {
    const circle = L.circle([sos.lat, sos.lng], {
      radius: 400,
      color: 'var(--color-danger)',
      fillColor: 'var(--color-danger)',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '2, 4'
    });
    circle.bindPopup(`<strong>SOS Buffer:</strong> Active distress alert for ${sos.name}`);
    hotspotLayerGroup.addLayer(circle);
  });
}

// Marker Creators
function createCustomMarker(lat, lng, color, svgIcon, tooltipText) {
  const markerHtml = `
    <div style="
      background-color: ${color}; 
      border: 2px solid white; 
      border-radius: 50%; 
      width: 32px; 
      height: 32px; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      color: white;
      box-shadow: 0 0 12px ${color}80;
    ">
      ${svgIcon}
    </div>
  `;
  
  const customIcon = L.divIcon({
    html: markerHtml,
    className: 'custom-map-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const marker = L.marker([lat, lng], { icon: customIcon });
  if (tooltipText) {
    marker.bindPopup(tooltipText, { closeButton: true });
  }
  return marker;
}

function loadInitialData() {
  // 1. Load active emergency alerts
  renderAlerts();

  // 2. Load Shelters
  renderShelters();

  // 3. Load Medical Centers
  renderMedical();

  // 4. Load Road Conditions
  renderRoads();
  
  // 5. Recreate saved SOS beacons
  sosReports.forEach(sos => {
    const sosHtml = `<div class="gps-pulse-marker"></div>`;
    const sosIcon = L.divIcon({
      html: sosHtml,
      className: 'custom-sos-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([sos.lat, sos.lng], { icon: sosIcon });
    marker.bindPopup(`
      <div style="font-family: var(--font-body); padding: 5px;">
        <span style="background: var(--color-danger); color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">ACTIVE SOS SIGNAL</span>
        <h4 style="margin-top: 8px; color: #fff; font-size: 13px;">${sos.name} (${sos.condition.toUpperCase()})</h4>
        <p style="font-size: 12px; margin-top: 4px;"><strong>Needs:</strong> ${sos.needs.join(', ') || 'General Help'}</p>
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">"${sos.description}"</p>
        <p style="font-size: 11px; margin-top: 6px;">📞 ${sos.phone}</p>
      </div>
    `);
    markerLayers.sos.addLayer(marker);
  });

  // 6. Update header statistics counter
  updateHeaderCounters();
}

// Render Alerts (Left Panel)
function renderAlerts() {
  const container = document.getElementById('alert-list');
  container.innerHTML = '';
  
  DISASTER_DATA.activeDisasters.forEach(disaster => {
    const card = document.createElement('div');
    card.className = `alert-card ${disaster.severity}`;
    card.onclick = () => {
      // Find relative center/marker to pan map
      if (disaster.type === 'flood') {
        map.flyTo([12.9645, 77.5890], 14); // center around flooded region
      } else if (disaster.type === 'cyclone') {
        map.flyTo([12.9820, 77.6080], 14);
      } else if (disaster.type === 'earthquake') {
        map.flyTo([12.9560, 77.5760], 14);
      }
    };
    
    card.innerHTML = `
      <div class="alert-card-header">
        <span class="alert-card-title">${disaster.title}</span>
        <span class="alert-card-time">${disaster.timestamp}</span>
      </div>
      <div class="alert-card-loc"><i class="fas fa-map-marker-alt"></i> ${disaster.location}</div>
      <div class="alert-card-desc">${disaster.description}</div>
    `;
    container.appendChild(card);
  });
}

// Render Shelters
function renderShelters(filterTerm = '', statusFilter = 'all') {
  markerLayers.shelters.clearLayers();
  const listContainer = document.getElementById('directory-list');
  
  if (currentTab !== 'shelters') return;
  listContainer.innerHTML = '';
  
  const filteredShelters = DISASTER_DATA.shelters.filter(shelter => {
    const matchesSearch = shelter.name.toLowerCase().includes(filterTerm.toLowerCase()) || 
                          shelter.address.toLowerCase().includes(filterTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shelter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  filteredShelters.forEach(shelter => {
    const occupiedPercent = Math.min(100, Math.round((shelter.capacity.occupied / shelter.capacity.total) * 100));
    const isFull = shelter.status === 'full';
    
    // Add Marker on map
    const color = isFull ? 'var(--color-warning)' : 'var(--color-info)';
    const popupContent = `
      <div style="font-family: var(--font-body); padding: 5px;">
        <strong style="font-size: 14px; color: #fff;">${shelter.name}</strong><br/>
        <span style="color: var(--text-secondary); font-size: 11px;">${shelter.address}</span><br/>
        <div style="margin-top: 6px; font-size: 12px;">
          <strong>Capacity:</strong> ${shelter.capacity.occupied}/${shelter.capacity.total} (${occupiedPercent}%)
        </div>
        <div style="margin-top: 4px; display: flex; gap: 4px; flex-wrap: wrap;">
          ${shelter.amenities.map(a => `<span style="background: rgba(255,255,255,0.08); font-size: 9px; padding: 2px 5px; border-radius: 3px;">${a}</span>`).join('')}
        </div>
      </div>
    `;
    const marker = createCustomMarker(shelter.lat, shelter.lng, color, icons.shelter, popupContent);
    markerLayers.shelters.addLayer(marker);

    // Add list element
    const card = document.createElement('div');
    card.className = 'directory-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${shelter.name}</span>
        <span class="status-indicator ${shelter.status}">${shelter.status}</span>
      </div>
      <div class="card-detail"><i class="fas fa-map-marker-alt"></i> ${shelter.address}</div>
      <div class="card-detail"><i class="fas fa-phone"></i> ${shelter.phone}</div>
      
      <div style="margin-bottom: 4px; display: flex; justify-content: space-between; font-size: 11px;">
        <span>Capacity (${occupiedPercent}%)</span>
        <span>${shelter.capacity.occupied}/${shelter.capacity.total} beds</span>
      </div>
      <div class="capacity-bar-container">
        <div class="capacity-bar" style="width: ${occupiedPercent}%; background-color: ${isFull ? 'var(--color-warning)' : 'var(--color-info)'}"></div>
      </div>
      
      <div class="amenities-container">
        ${shelter.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
      </div>
      
      <div class="card-actions">
        <button class="card-action-btn" onclick="zoomToMarker(${shelter.lat}, ${shelter.lng})">
          <i class="fas fa-location-arrow"></i> Locate on Map
        </button>
        <button class="card-action-btn" onclick="window.open('tel:${shelter.phone}')">
          <i class="fas fa-phone-alt"></i> Call Shelter
        </button>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

// Render Medical Centers
function renderMedical(filterTerm = '') {
  markerLayers.medical.clearLayers();
  const listContainer = document.getElementById('directory-list');
  
  if (currentTab !== 'medical') return;
  listContainer.innerHTML = '';

  const filteredMedical = DISASTER_DATA.medicalCenters.filter(m => {
    return m.name.toLowerCase().includes(filterTerm.toLowerCase()) || 
           m.address.toLowerCase().includes(filterTerm.toLowerCase()) ||
           m.specialties.some(s => s.toLowerCase().includes(filterTerm.toLowerCase()));
  });

  filteredMedical.forEach(m => {
    let capColor = 'var(--color-success)';
    if (m.capacity === 'critical') capColor = 'var(--color-danger)';
    if (m.capacity === 'busy') capColor = 'var(--color-warning)';
    
    // Add marker on map
    const markerColor = m.capacity === 'critical' ? 'var(--color-danger)' : 'var(--color-info)';
    const popupContent = `
      <div style="font-family: var(--font-body); padding: 5px;">
        <strong style="font-size: 14px; color: #fff;">${m.name}</strong><br/>
        <span style="color: var(--text-secondary); font-size: 11px;">${m.address}</span><br/>
        <div style="margin-top: 6px; font-size: 12px;">
          <strong>Wait Time:</strong> ${m.waitTime} | <strong>Status:</strong> ${m.capacity.toUpperCase()}
        </div>
      </div>
    `;
    const marker = createCustomMarker(m.lat, m.lng, markerColor, icons.medical, popupContent);
    markerLayers.medical.addLayer(marker);

    // List item
    const card = document.createElement('div');
    card.className = 'directory-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${m.name}</span>
        <span class="status-indicator" style="background: ${capColor}15; color: ${capColor}">${m.capacity} capacity</span>
      </div>
      <div class="card-detail"><i class="fas fa-clock"></i> Wait Time: <strong>${m.waitTime}</strong></div>
      <div class="card-detail"><i class="fas fa-map-marker-alt"></i> ${m.address}</div>
      <div class="card-detail"><i class="fas fa-phone"></i> ${m.phone}</div>
      
      <div class="amenities-container" style="margin-top: 8px;">
        ${m.specialties.map(s => `<span class="amenity-tag" style="border-color: rgba(59, 130, 246, 0.2); color: #60a5fa">${s}</span>`).join('')}
      </div>
      
      <div class="card-actions" style="margin-top: 10px;">
        <button class="card-action-btn" onclick="zoomToMarker(${m.lat}, ${m.lng})">
          <i class="fas fa-location-arrow"></i> View Hospital
        </button>
        <button class="card-action-btn" onclick="window.open('tel:${m.phone}')">
          <i class="fas fa-phone-alt"></i> Call ER
        </button>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

// Render Roads
function renderRoads(filterTerm = '') {
  // Clear map markers & lines
  markerLayers.roads.clearLayers();
  roadPathLines.forEach(line => map.removeLayer(line));
  roadPathLines = [];
  
  const listContainer = document.getElementById('directory-list');
  if (currentTab !== 'roads') return;
  listContainer.innerHTML = '';

  const filteredRoads = DISASTER_DATA.roads.filter(road => {
    return road.name.toLowerCase().includes(filterTerm.toLowerCase()) || 
           road.reason.toLowerCase().includes(filterTerm.toLowerCase());
  });

  filteredRoads.forEach(road => {
    // Determine colors
    let color = 'var(--color-success)';
    if (road.status === 'blocked') color = 'var(--color-danger)';
    if (road.status === 'warning') color = 'var(--color-warning)';
    
    // Draw road polyline
    const polyline = L.polyline(road.path, {
      color: color,
      weight: 6,
      opacity: 0.8,
      lineCap: 'round',
      dashArray: road.status === 'warning' ? '8, 8' : null
    });
    
    polyline.bindPopup(`
      <div style="font-family: var(--font-body);">
        <strong style="color: #fff;">${road.name}</strong><br/>
        <span style="font-size: 11px; color: ${color}; font-weight: 700; text-transform: uppercase;">${road.status}</span><br/>
        <span style="font-size: 12px;">${road.reason}</span>
      </div>
    `);
    
    polyline.addTo(map);
    roadPathLines.push(polyline);

    // Draw hazard marker at the center of the road path
    const centerPoint = road.path[Math.floor(road.path.length / 2)];
    if (road.status !== 'safe') {
      const hazardMarker = createCustomMarker(
        centerPoint[0], 
        centerPoint[1], 
        color, 
        icons.danger, 
        `<strong style="color:#fff">${road.name}</strong>: ${road.reason}`
      );
      markerLayers.roads.addLayer(hazardMarker);
    }

    // List item
    const card = document.createElement('div');
    card.className = 'directory-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${road.name}</span>
        <span class="status-indicator ${road.status}">${road.status}</span>
      </div>
      <div class="card-detail" style="color: ${color}">
        <i class="fas fa-exclamation-triangle"></i> Status Info: <strong>${road.reason}</strong>
      </div>
      
      <div class="card-actions" style="margin-top: 10px;">
        <button class="card-action-btn" onclick="zoomToRoad(${JSON.stringify(road.path)})">
          <i class="fas fa-location-arrow"></i> Show Route Path
        </button>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

// Navigation helpers
function zoomToMarker(lat, lng) {
  map.flyTo([lat, lng], 15);
}

function zoomToRoad(path) {
  const bounds = L.polyline(path).getBounds();
  map.flyToBounds(bounds, { padding: [50, 50] });
}

// Header Stats Counter
function updateHeaderCounters() {
  const openShelters = DISASTER_DATA.shelters.filter(s => s.status === 'open').length;
  const blockedRoads = DISASTER_DATA.roads.filter(r => r.status === 'blocked').length;
  const activeSOS = sosReports.length;

  document.getElementById('stat-shelters-count').textContent = `${openShelters} Shelters`;
  document.getElementById('stat-roads-count').textContent = `${blockedRoads} Blocked Roads`;
  document.getElementById('stat-sos-count').textContent = `${activeSOS} SOS Beacons`;
}

// Interactive tab switching
function switchTab(tabId) {
  currentTab = tabId;
  
  // Style active button
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`tab-${tabId}`).classList.add('active');

  // Clear directory search
  document.getElementById('dir-search').value = '';

  // Show status filter container only for shelters
  const statusFilterPills = document.getElementById('shelter-status-filters');
  if (tabId === 'shelters') {
    statusFilterPills.style.display = 'flex';
  } else {
    statusFilterPills.style.display = 'none';
  }

  // Rerender active tab directory lists
  if (tabId === 'shelters') renderShelters();
  if (tabId === 'medical') renderMedical();
  if (tabId === 'roads') renderRoads();
}

// Dashboard mode toggle
function toggleDashboardMode(mode) {
  currentMode = mode;
  const container = document.getElementById('mode-toggle-container');
  const directorySection = document.getElementById('directory-section');
  const responderSection = document.getElementById('responder-section');

  if (mode === 'survivor') {
    container.classList.remove('responder');
    directorySection.style.display = 'flex';
    responderSection.style.display = 'none';
    switchTab(currentTab); // refresh markers
  } else {
    container.classList.add('responder');
    directorySection.style.display = 'none';
    responderSection.style.display = 'flex';
    switchResponderTab(responderFormTab);
  }
}

function renderVolunteers() {
  const listContainer = document.getElementById('vol-directory-list');
  listContainer.innerHTML = '';
  
  const list = DISASTER_DATA.volunteers || [];
  if (list.length === 0) {
    listContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No registered volunteers yet.</div>';
    return;
  }
  
  list.forEach(v => {
    const card = document.createElement('div');
    card.className = 'directory-card';
    
    let badgeClass = 'volunteer-manpower';
    let icon = 'fa-user-gear';
    
    if (v.resourceType === 'medical') {
      badgeClass = 'volunteer-medical';
      icon = 'fa-user-doctor';
    } else if (v.resourceType === 'transport') {
      badgeClass = 'volunteer-resource';
      icon = 'fa-truck-field';
    } else if (v.resourceType === 'food') {
      badgeClass = 'volunteer-resource';
      icon = 'fa-box-open';
    }
    
    card.innerHTML = `
      <div class="card-header">
        <span class="card-title"><i class="fas ${icon}" style="margin-right: 6px;"></i>${v.name}</span>
        <span class="status-indicator ${badgeClass}">${v.resourceType}</span>
      </div>
      <div class="card-detail"><i class="fas fa-phone"></i> ${v.phone}</div>
      <div style="font-size: 12px; color: var(--text-secondary); background: rgba(255,255,255,0.02); padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); line-height: 1.4;">
        <strong>Capability:</strong> ${v.capacity}
      </div>
      <div class="card-actions" style="margin-top: 10px;">
        <button class="card-action-btn" onclick="window.open('tel:${v.phone}')" style="background: var(--color-success)20; border-color: var(--color-success)40; color: var(--color-success)">
          <i class="fas fa-phone-alt"></i> Contact Responder
        </button>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

// Switch Responder Form Tabs
function switchResponderTab(tab) {
  responderFormTab = tab;
  document.querySelectorAll('.resp-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`resp-tab-${tab}`).classList.add('active');

  const reportForm = document.getElementById('hazard-report-form');
  const volunteerForm = document.getElementById('volunteer-registration-form');
  const volunteersList = document.getElementById('active-volunteers-list');

  if (tab === 'report') {
    reportForm.style.display = 'block';
    volunteerForm.style.display = 'none';
    volunteersList.style.display = 'none';
  } else if (tab === 'volunteer') {
    reportForm.style.display = 'none';
    volunteerForm.style.display = 'block';
    volunteersList.style.display = 'none';
  } else if (tab === 'volunteers') {
    reportForm.style.display = 'none';
    volunteerForm.style.display = 'none';
    volunteersList.style.display = 'block';
    renderVolunteers();
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Survivor Tabs
  document.getElementById('tab-shelters').addEventListener('click', () => switchTab('shelters'));
  document.getElementById('tab-roads').addEventListener('click', () => switchTab('roads'));
  document.getElementById('tab-medical').addEventListener('click', () => switchTab('medical'));

  // Dashboard Modes
  document.getElementById('btn-mode-survivor').addEventListener('click', () => toggleDashboardMode('survivor'));
  document.getElementById('btn-mode-responder').addEventListener('click', () => toggleDashboardMode('responder'));

  // Responder Form Tabs
  document.getElementById('resp-tab-report').addEventListener('click', () => switchResponderTab('report'));
  document.getElementById('resp-tab-volunteer').addEventListener('click', () => switchResponderTab('volunteer'));
  document.getElementById('resp-tab-volunteers').addEventListener('click', () => switchResponderTab('volunteers'));

  // Floating Layers Panel controls
  const layersPanel = document.querySelector('.map-layers-panel');
  document.getElementById('layers-panel-toggle').addEventListener('click', () => {
    layersPanel.classList.toggle('expanded');
  });

  // Base Layer selection
  document.getElementById('layer-base-dark').addEventListener('change', (e) => {
    if (e.target.checked) switchBaseLayer('dark');
  });
  document.getElementById('layer-base-satellite').addEventListener('change', (e) => {
    if (e.target.checked) switchBaseLayer('satellite');
  });

  // Overlays selection
  document.getElementById('layer-toggle-weather').addEventListener('change', (e) => {
    toggleWeatherLayer(e.target.checked);
  });
  document.getElementById('layer-toggle-hotspots').addEventListener('change', (e) => {
    toggleHotspotLayer(e.target.checked);
  });

  // Check Danger Zones by default on startup
  document.getElementById('layer-toggle-hotspots').checked = true;
  toggleHotspotLayer(true);

  // Directory Search
  document.getElementById('dir-search').addEventListener('input', (e) => {
    const searchVal = e.target.value;
    if (currentTab === 'shelters') renderShelters(searchVal);
    if (currentTab === 'medical') renderMedical(searchVal);
    if (currentTab === 'roads') renderRoads(searchVal);
  });

  // Shelter Filters
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      const filter = e.target.dataset.filter;
      renderShelters(document.getElementById('dir-search').value, filter);
    });
  });

  // SOS Modal controls
  const sosModal = document.getElementById('sos-modal');
  document.getElementById('trigger-sos-btn').addEventListener('click', () => {
    sosModal.classList.add('active');
    // Pre-populate coordinates with current map center
    const center = map.getCenter();
    document.getElementById('sos-location-coords').value = `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;
    selectedCoordinatesForSOS = center;
  });

  document.getElementById('close-sos-btn').addEventListener('click', () => {
    sosModal.classList.remove('active');
    mapClickSelectionMode = false;
    map.getContainer().style.cursor = '';
  });

  // Interactive Map Click Location Selection for SOS
  document.getElementById('sos-select-map-btn').addEventListener('click', (e) => {
    e.preventDefault();
    mapClickSelectionMode = true;
    map.getContainer().style.cursor = 'crosshair';
    e.target.innerHTML = '<i class="fas fa-mouse-pointer"></i> Click Map Location...';
    e.target.style.background = 'var(--color-warning)';
    sosModal.classList.remove('active');
    
    // Quick notification on map
    alert("Click anywhere on the interactive map to set your SOS beacon location.");
    
    // Automatically reopen modal after click on map
    const reopenModalAfterClick = () => {
      if (selectedCoordinatesForSOS) {
        sosModal.classList.add('active');
        map.off('click', reopenModalAfterClick);
      }
    };
    map.on('click', reopenModalAfterClick);
  });

  // SOS Badges select
  document.querySelectorAll('.sos-badge-option').forEach(badge => {
    badge.addEventListener('click', (e) => {
      const parent = e.target.closest('.sos-badge-option');
      parent.classList.toggle('active');
    });
  });

  // SOS Form Submission
  document.getElementById('sos-submit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('sos-name').value;
    const phone = document.getElementById('sos-phone').value;
    const condition = document.getElementById('sos-condition').value;
    const description = document.getElementById('sos-desc').value;
    
    // Gather selected need badges
    const needs = [];
    document.querySelectorAll('.sos-badge-option.active').forEach(badge => {
      needs.push(badge.dataset.need);
    });

    if (!selectedCoordinatesForSOS) {
      alert("Please select a location for the SOS beacon.");
      return;
    }

    // Create custom SOS marker object
    const sosId = `sos-${Date.now()}`;
    const newSOS = {
      id: sosId,
      name,
      phone,
      condition,
      needs,
      description,
      lat: selectedCoordinatesForSOS.lat,
      lng: selectedCoordinatesForSOS.lng
    };

    sosReports.push(newSOS);
    saveState('sosReports', sosReports);
    updateHotspots();
    
    // Add pulsing red marker to SOS layer group
    const sosHtml = `
      <div class="gps-pulse-marker"></div>
    `;
    const sosIcon = L.divIcon({
      html: sosHtml,
      className: 'custom-sos-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([newSOS.lat, newSOS.lng], { icon: sosIcon });
    marker.bindPopup(`
      <div style="font-family: var(--font-body); padding: 5px;">
        <span style="background: var(--color-danger); color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">ACTIVE SOS SIGNAL</span>
        <h4 style="margin-top: 8px; color: #fff; font-size: 13px;">${newSOS.name} (${newSOS.condition.toUpperCase()})</h4>
        <p style="font-size: 12px; margin-top: 4px;"><strong>Needs:</strong> ${newSOS.needs.join(', ') || 'General Help'}</p>
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">"${newSOS.description}"</p>
        <p style="font-size: 11px; margin-top: 6px;">📞 ${newSOS.phone}</p>
      </div>
    `);

    markerLayers.sos.addLayer(marker);
    map.flyTo([newSOS.lat, newSOS.lng], 15);
    
    // Clear Form & Close Modal
    document.getElementById('sos-submit-form').reset();
    document.querySelectorAll('.sos-badge-option').forEach(b => b.classList.remove('active'));
    sosModal.classList.remove('active');
    
    // Update Header Counts
    updateHeaderCounters();
    
    // Notify user
    alert("Emergency SOS beacon deployed successfully. Disaster responders have been notified.");
  });

  // Hazard Report Form Submit (Responder Mode)
  document.getElementById('hazard-report-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const hazardType = document.getElementById('hazard-type').value;
    const title = document.getElementById('hazard-title').value;
    const locName = document.getElementById('hazard-location').value;
    const description = document.getElementById('hazard-desc').value;
    const severity = document.getElementById('hazard-severity').value;

    // Create a new simulated alert in active alerts list
    const newAlert = {
      id: `d-${Date.now()}`,
      type: hazardType,
      title: title,
      severity: severity,
      location: locName,
      description: description,
      timestamp: "Just now"
    };

    DISASTER_DATA.activeDisasters.unshift(newAlert); // Add to beginning of array
    saveState('activeDisasters', DISASTER_DATA.activeDisasters);
    renderAlerts();
    
    // Generate simulated road blockage based on map center
    const center = map.getCenter();
    const newRoadBlockage = {
      id: `r-${Date.now()}`,
      name: title,
      status: severity === 'critical' || severity === 'high' ? 'blocked' : 'warning',
      reason: description,
      type: hazardType,
      path: [
        [center.lat - 0.003, center.lng - 0.003],
        [center.lat, center.lng],
        [center.lat + 0.003, center.lng + 0.003]
      ]
    };
    
    DISASTER_DATA.roads.push(newRoadBlockage);
    saveState('roads', DISASTER_DATA.roads);
    updateHotspots();

    if (currentTab === 'roads') {
      renderRoads();
    }
    updateHeaderCounters();

    // Reset Form
    document.getElementById('hazard-report-form').reset();
    alert("Hazard reported successfully. The disaster map, hazard zones, and live alert feeds have been updated.");
  });

  // Volunteer/Resource registration submit
  document.getElementById('volunteer-registration-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const volName = document.getElementById('vol-name').value;
    const volPhone = document.getElementById('vol-phone').value;
    const resourceType = document.getElementById('vol-resource-type').value;
    const volCap = document.getElementById('vol-capacity').value;

    const newVol = {
      id: `v-${Date.now()}`,
      name: volName,
      phone: volPhone,
      resourceType: resourceType,
      capacity: volCap
    };

    if (!DISASTER_DATA.volunteers) {
      DISASTER_DATA.volunteers = [];
    }
    DISASTER_DATA.volunteers.push(newVol);
    saveState('volunteers', DISASTER_DATA.volunteers);

    if (responderFormTab === 'volunteers') {
      renderVolunteers();
    }

    // Reset Form
    document.getElementById('volunteer-registration-form').reset();
    alert(`Thank you, ${volName}! Your details have been registered under "${resourceType.toUpperCase()}". Emergency coordination units can now access your resource profile in the Active Volunteers directory.`);
  });
}

function switchBaseLayer(type) {
  if (type === 'dark') {
    map.removeLayer(baseLayers.satellite);
    baseLayers.dark.addTo(map);
  } else if (type === 'satellite') {
    map.removeLayer(baseLayers.dark);
    baseLayers.satellite.addTo(map);
  }
}

function toggleWeatherLayer(enable) {
  if (enable) {
    weatherRadarOverlay.addTo(map);
  } else {
    map.removeLayer(weatherRadarOverlay);
  }
}

function toggleHotspotLayer(enable) {
  if (enable) {
    hotspotLayerGroup.addTo(map);
  } else {
    map.removeLayer(hotspotLayerGroup);
  }
}

// Chat suggestion chips
const defaultSuggestions = [
  { text: "🔍 Open Shelters", query: "shelter" },
  { text: "🛣️ Blocked Roads", query: "road" },
  { text: "🚑 Medical Help", query: "medical" },
  { text: "🚨 Active SOS", query: "sos" },
  { text: "🌀 Cyclone Safety", query: "cyclone" }
];

function renderSuggestionChips(chips = defaultSuggestions) {
  const container = document.getElementById('chat-suggestions');
  container.innerHTML = '';
  chips.forEach(chip => {
    const btn = document.createElement('button');
    btn.className = 'suggestion-chip';
    btn.textContent = chip.text;
    btn.onclick = () => {
      document.getElementById('chat-input').value = chip.query;
      document.getElementById('chat-send-btn').click();
    };
    container.appendChild(btn);
  });
}

// Intelligent chatbot responses based on live database state
function getChatbotResponse(text) {
  const cleanText = text.toLowerCase();
  
  if (cleanText.includes('shelter') || cleanText.includes('refuge') || cleanText.includes('stay') || cleanText.includes('safe zone')) {
    const openShelters = DISASTER_DATA.shelters.filter(s => s.status === 'open');
    const fullShelters = DISASTER_DATA.shelters.filter(s => s.status === 'full');
    
    let reply = `🏠 **Emergency Shelter Status Report**\n`;
    reply += `We have **${openShelters.length} open** and **${fullShelters.length} full** shelters registered.\n\n`;
    
    if (openShelters.length > 0) {
      reply += `**Open Shelters:**\n`;
      openShelters.forEach(s => {
        const bedsLeft = s.capacity.total - s.capacity.occupied;
        reply += `- **${s.name}** (${s.address}): **${bedsLeft} beds available** (Occupied: ${s.capacity.occupied}/${s.capacity.total}). Amenities: ${s.amenities.slice(0, 3).join(', ')}.\n`;
      });
    }
    if (fullShelters.length > 0) {
      reply += `\n**At Capacity:**\n`;
      fullShelters.forEach(s => {
        reply += `- **${s.name}** (${s.address}): FULL (Occupied: ${s.capacity.occupied}/${s.capacity.total})\n`;
      });
    }
    
    reply += `\n*You can switch to the **Shelters** tab on the right sidebar to locate these on the map or call directly.*`;
    return reply;
  }
  
  if (cleanText.includes('road') || cleanText.includes('highway') || cleanText.includes('blocked') || cleanText.includes('route') || cleanText.includes('traffic') || cleanText.includes('pass')) {
    const blocked = DISASTER_DATA.roads.filter(r => r.status === 'blocked');
    const warning = DISASTER_DATA.roads.filter(r => r.status === 'warning');
    const safe = DISASTER_DATA.roads.filter(r => r.status === 'safe');
    
    let reply = `🛣️ **Live Road Conditions Bulletin**\n\n`;
    
    if (blocked.length > 0) {
      reply += `🔴 **BLOCKED ROUTES (Critical danger):**\n`;
      blocked.forEach(r => {
        reply += `- **${r.name}**: ${r.reason}\n`;
      });
    } else {
      reply += `🟢 No critical roadblocks reported.\n`;
    }
    
    if (warning.length > 0) {
      reply += `\n🟡 **WARNINGS (Proceed with caution):**\n`;
      warning.forEach(r => {
        reply += `- **${r.name}**: ${r.reason}\n`;
      });
    }
    
    if (safe.length > 0) {
      reply += `\n🟢 **SAFE & OPERATIONAL CORRIDORS:**\n`;
      safe.forEach(r => {
        reply += `- **${r.name}**\n`;
      });
    }
    
    reply += `\n*Avoid blocked routes. You can locate warning details in the **Road Safety** tab.*`;
    return reply;
  }

  if (cleanText.includes('sos') || cleanText.includes('distress') || cleanText.includes('beacon') || cleanText.includes('rescue')) {
    if (sosReports.length === 0) {
      return `🚨 **Active SOS Signals**\n\nThere are currently **0 active SOS distress beacons** deployed. Responders are on stand-by.\n\n*If you are in immediate danger, click the **Trigger SOS** button on the top right to broadcast your coordinates.*`;
    }
    
    let reply = `🚨 **Active SOS Beacons (${sosReports.length})**\n\n`;
    sosReports.forEach((s, idx) => {
      reply += `**${idx + 1}. ${s.name}** (${s.condition.toUpperCase()} condition)\n`;
      reply += `- Needs: ${s.needs.join(', ') || 'Immediate rescue'}\n`;
      reply += `- Details: "${s.description}"\n`;
      reply += `- Call back: ${s.phone}\n\n`;
    });
    reply += `*Responders can view these on the map as blinking red beacons.*`;
    return reply;
  }

  if (cleanText.includes('volunteer') || cleanText.includes('aid') || cleanText.includes('helper') || cleanText.includes('donate')) {
    const list = DISASTER_DATA.volunteers || [];
    let reply = `🤝 **Emergency Aid & Volunteer Network**\n\n`;
    reply += `We currently have **${list.length} registered support units** ready to coordinate.\n\n`;
    
    if (list.length > 0) {
      reply += `**Active Resources:**\n`;
      list.forEach(v => {
        let emoji = '👤';
        if (v.resourceType === 'medical') emoji = '🩺';
        if (v.resourceType === 'transport') emoji = '🚤';
        if (v.resourceType === 'food') emoji = '📦';
        reply += `${emoji} **${v.name}** (${v.resourceType.toUpperCase()}): "${v.capacity}"\n`;
      });
    }
    
    reply += `\n*Want to help? Switch to **Responder Mode** at the top right and click **Register Aid / Volunteer** to add your resources.*`;
    return reply;
  }
  
  if (cleanText.includes('medical') || cleanText.includes('doctor') || cleanText.includes('hospital') || cleanText.includes('injury') || cleanText.includes('hurt') || cleanText.includes('clinic') || cleanText.includes('er')) {
    let reply = `🚑 **Active Medical Centers Triage Status**\n\n`;
    DISASTER_DATA.medicalCenters.forEach(m => {
      let capStatus = m.capacity.toUpperCase();
      let colorEmoji = '🟢';
      if (m.capacity === 'critical') colorEmoji = '🔴';
      if (m.capacity === 'busy') colorEmoji = '🟡';
      
      reply += `${colorEmoji} **${m.name}**\n`;
      reply += `- Status: **${capStatus}** | Est. Wait: **${m.waitTime}**\n`;
      reply += `- Specialties: ${m.specialties.join(', ')}\n`;
      reply += `- Contact: ${m.phone}\n\n`;
    });
    return reply;
  }
  
  if (cleanText.includes('flood') || cleanText.includes('water') || cleanText.includes('drown') || cleanText.includes('submerge')) {
    return DISASTER_DATA.chatbotResponses.flood[0];
  }
  if (cleanText.includes('cyclone') || cleanText.includes('storm') || cleanText.includes('wind') || cleanText.includes('hurricane')) {
    return DISASTER_DATA.chatbotResponses.cyclone[0];
  }
  if (cleanText.includes('earthquake') || cleanText.includes('quake') || cleanText.includes('shaking') || cleanText.includes('structural')) {
    return DISASTER_DATA.chatbotResponses.earthquake[0];
  }
  
  // Default dynamic options instruction
  return `I am **SafeBridge AI**, your emergency crisis assistant. I have live access to the local disaster map database. Ask me queries like:\n` +
         `- *"Are there any open shelters?"*\n` +
         `- *"Is any road blocked?"*\n` +
         `- *"Show active SOS reports"* \n` +
         `- *"Who are the active volunteers?"* \n` +
         `- *"Show wait time at hospitals"*`;
}

// Chatbot Logic
function initChatbot() {
  appendChatMessage('ai', DISASTER_DATA.chatbotResponses.greetings[0]);
  renderSuggestionChips();

  const sendBtn = document.getElementById('chat-send-btn');
  const chatInput = document.getElementById('chat-input');

  const handleMessageSend = () => {
    const text = chatInput.value.trim();
    if (!text) return;

    appendChatMessage('user', text);
    chatInput.value = '';

    // Show Typing Indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-bubble ai';
    typingIndicator.id = 'chat-typing-indicator';
    typingIndicator.innerHTML = 'Thinking...';
    document.getElementById('chat-messages').appendChild(typingIndicator);
    document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;

    setTimeout(() => {
      // Remove typing indicator
      const indicator = document.getElementById('chat-typing-indicator');
      if (indicator) indicator.remove();

      // Formulate response dynamically
      const response = getChatbotResponse(text);
      appendChatMessage('ai', response);
      
      // Re-render chips to help prompt further questions
      renderSuggestionChips();
    }, 800);
  };

  sendBtn.addEventListener('click', handleMessageSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleMessageSend();
  });
}

function appendChatMessage(sender, text) {
  const container = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  
  // Custom markdown converter for bold (**), lists (-), and line breaks
  let formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items in <ul>
  formattedText = formattedText.replace(/((?:<li>.*?<\/li>\n?)+)/gs, '<ul>$1</ul>');
  
  // Convert newlines to breaks
  formattedText = formattedText.replace(/\n/g, '<br/>');
  
  // Clean up br tags inside lists
  formattedText = formattedText.replace(/<li><br\/>/g, '<li>').replace(/<\/li><br\/>/g, '</li>');
    
  bubble.innerHTML = formattedText;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}
