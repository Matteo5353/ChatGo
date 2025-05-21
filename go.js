var map = null;
var markers = [];
var DEFAULT_ZOOM = 14;
var MARKER_SIZE = 40;
//const API_URL = "https://openstreetmap-zue0.onrender.com/places";

// const API_URL = "http://localhost:3000/places";
var currentInfoWindow = null;
var Alllocations = [];
document.addEventListener("DOMContentLoaded", initMap);
initSliders();


async function initMap() {
  if (map) {
    map.remove();  // Destroy the old map instance
    console.log("Old map removed.");
  }
  showLoader();
  try {
    map = L.map("map").setView([20, 0], 3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );
    document.getElementById('city-input').value = '';
    await loadLocations();
  } finally {
    hideLoader();
    trackUserLocation(map);
  }
}

initMap();

function toggleSidebar() {
  var sidebar = document.getElementById("sidebar"); 
  sidebar.classList.toggle("hidden-sidebar");
}


async function loadLocations() {
  try {
    const response = await fetch(window.AppConfig.API_URL);
    const locations = await response.json();
    Alllocations = [...locations];
    markers.forEach((marker) => map.removeLayer(marker));
    markers = locations.map(createMarker);

    return locations;
  } catch (error) {
    console.error("Error loading locations:", error);
    return [];
  }
}

function createMarker(place) {
  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div style="
            width: ${MARKER_SIZE}px;
            height: ${MARKER_SIZE}px;
            background-image: url('${place.photo}');
            background-size: cover;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
  });

  const marker = L.marker([place.latitude, place.longitude], { icon })
    .addTo(map)
    .on("click", (e) => {
      map
        .flyTo([place.latitude, place.longitude], DEFAULT_ZOOM, {
          animate: true,
          duration: 0.5,
        })
        .once("moveend", () => showInfoWindow(e, place));
    });

  return marker;
}

function showInfoWindow(e, place) {
  const infoWindow = document.getElementById("icon-info");
  infoWindow.style.display = "block";

  // Update content
  infoWindow.querySelector(".info-title").textContent = place.title;
  infoWindow.querySelector(".info-image").src = place.photo;
  infoWindow.querySelector(".info-latitude").textContent =
    place.latitude.toFixed(4);
  infoWindow.querySelector(".info-longitude").textContent =
    place.longitude.toFixed(4);
  infoWindow.querySelector(".info-ideal").textContent = place.ideal;
  infoWindow.querySelector(".info-description").textContent = place.description;
  const mapLink = infoWindow.querySelector(".info-map-link");
  if (place.mapLink === "") {
    mapLink.style.display = "none";
  } else {
    mapLink.style.display = "block";
    mapLink.href = place.mapLink.startsWith("http")
      ? place.mapLink
      : `https://${place.mapLink}`;
  }

  // Position
  const point = map.latLngToContainerPoint(e.latlng);
  infoWindow.style.left = `${point.x + 20}px`;
  infoWindow.style.top = `${point.y - 160}px`;
}

function hideInfoWindow() {
  document.getElementById("icon-info").style.display = "none";
}

async function showPlaces() {
  showLoader();
  try {
    const locations = [...Alllocations];
    const placesList = document.getElementById("placesList");

    placesList.innerHTML = `
      <div class="places-container">
        ${locations
          .map(
            (place) => `
              <div class="place-item" id="place-${place.title}">
                <span class="place-title" onclick="map.flyTo([${place.latitude}, ${place.longitude}], ${DEFAULT_ZOOM})">
                  ${place.title}
                </span>
              </div>
            `
          )
          .join("")}
      </div>`;

      toggleMenu("placesMenu");
    
  } finally {
    hideLoader();
  }
}

function idealForFilter() {
  const selectedValue = document.getElementById("ideal").value;

  // If default is selected, show all markers (not straight return cause otherwise can't show back again)
  if (selectedValue === "None") {
    markers.forEach(marker => map.addLayer(marker));
    return;
  }

  // Hide/show markers based on selected value
  markers.forEach((marker, index) => {
    const location = Alllocations[index];
    if (location.ideal === selectedValue) {
      map.addLayer(marker);
    } else {
      map.removeLayer(marker);
    }
  });
}

function initSliders() {
  const timeSlider = document.getElementById('timeRange');
  const priceSlider = document.getElementById('priceRange');
  const timeValue = document.getElementById('timeValue');
  const priceValue = document.getElementById('priceValue');

  if (!timeSlider || !priceSlider || !timeValue || !priceValue) {
    console.warn('Slider elements missing - skipping init');
    return;
  }

  // Update time display based on slider value
  function updateTimeDisplay(value) {
    const val = parseInt(value, 10);
    if (val >= 240) {
      timeValue.textContent = '4h+';
    } else if (val >= 60) {
      timeValue.textContent = `${Math.floor(val / 60)}h ${val % 60}min`;
    } else {
      timeValue.textContent = `${val} min`;
    }
  }

  // Initialize display right away
  updateTimeDisplay(timeSlider.value);
  priceValue.textContent = `$${priceSlider.value}`;

  // Attach live input listeners
  timeSlider.addEventListener('input', () => updateTimeDisplay(timeSlider.value));
  priceSlider.addEventListener('input', () => {
    priceValue.textContent = `$${priceSlider.value}`;
  });
}


function devareValue() {
  showLoader();
  try {
    const locations = [...Alllocations];
    const placesList = document.getElementById("placesList");

    placesList.innerHTML = `
    <div class="places-container">
        ${locations
        .map(
          (place) => `
                  <div class="place-item" id="place-${place.title}">
                      <span class="place-title" onclick="devareData('${place._id}')">
                          ${place.title}
                  </div>
              `
        )
        .join("")}
      </div>`;

    toggleMenu("placesMenu");
    
  } finally {
    hideLoader();
  }
}



async function devareData(placeId) {
  showLoader();
  try {
    const response = await fetch(`/${placeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: placeId }),
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text();  // Get the error message from the backend
      throw new Error(`Failed to devare place: ${errorText}`);
    }

    console.log("Place devared from database successfully!");

    // After successful devarion, remove from Alllocations and UI
    Alllocations = Alllocations.filter((place) => place._id !== placeId);

    // Remove the place item from the DOM
    const placeElement = document.getElementById(`place-${placeId}`);
    if (placeElement) placeElement.remove();

    // Refresh the UI/menu
    backToMenu();
  } catch (error) {
    console.error("Error devaring place:", error);
    alert(`Failed to devare place: ${error.message}`); // Show detailed error
  } finally {
    hideLoader();
  }
}

function searchCity() {
  const button = document.getElementById('search-btn');
  const input = document.getElementById('city-input');
  const list = document.getElementById('autocomplete-list');

  // Replace label with input
  button.classList.add('active');
  input.focus(); // optional: put cursor in input field

  var debounceTimer;
  input.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    const query = input.value;

    if (query.length < 2) {
      list.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?city=${query}&format=json&limit=5`)
        .then(response => response.json())
        .then(data => {
          list.innerHTML = '';
          data.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.display_name;
            li.addEventListener('click', () => {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);

              map.flyTo([lat, lon], DEFAULT_ZOOM); 
              list.innerHTML = '';
              input.value = item.display_name;
            });
            list.appendChild(li);
          });
        })
        .catch(error => {
          console.error('Error fetching city data:', error);
        });
    }, 300);
  });
}


function showAddPlace() {
  toggleMenu("addPlaceMenu");
}

async function addPlace() {
  showLoader();
  try {
    const placeData = {
      title: document.getElementById("placeTitle").value,
      latitude: parseFloat(document.getElementById("latitude").value),
      longitude: parseFloat(document.getElementById("longitude").value),
      description: document.getElementById("description").value,
      mapLink: document.getElementById("mapLink").value,
      ideal: document.getElementById("ideal").value,
      photo: await readFile(document.getElementById("placePhoto").files[0]),
    };
    if (!placeData.title || !placeData.latitude || !placeData.longitude)
      throw new Error("Please fill in all fields");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(placeData),
    });

    if (!response.ok) throw new Error("Failed to save location");

    await loadLocations();
    backToMenu();
    clearForm();
  } catch (error) {
    console.error("Error saving location:", error);
    alert("Failed to save location. Please check your input.");
  } finally {
    hideLoader();
  }
}

function backToMenu() {
  toggleMenu("mainMenu");
}


function getCurrentLocation() {
  // Remove tap location marker if it exists
  if (typeof selectedLocationMarker !== 'undefined' && selectedLocationMarker) {
    map.removeLayer(selectedLocationMarker);
    selectedLocationMarker = null;
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Fill the form inputs with the detected location
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lon;

        // Optional: if you're using Leafvar/OpenStreetMap, center the map too
        if (typeof map !== 'undefined') {
          map.setView([lat, lon]); // Adjust zoom level as needed
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location. Please enter it manually.");
      },
      {
        enableHighAccuracy: true,  // Use GPS if available
        timeout: 10000,            // Wait up to 10 seconds
        maximumAge: 3000     // accept location from last 3s max
      }

    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

var isSelectingLocation = false;
var mapClickListener = null;

function tapLocation() {
  // If already selecting, remove previous listener first
  if (mapClickListener) {
    map.off('click', mapClickListener);
    mapClickListener = null;
  }

  isSelectingLocation = true;

  // Define the listener
  mapClickListener = function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    // Fill form fields
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lon;

    // Optional: center the map there
    map.setView([lat, lon]);

    // If you want to place a marker on the tapped location:
    if (typeof selectedLocationMarker !== 'undefined' && selectedLocationMarker) {
      selectedLocationMarker.setLatLng([lat, lon]);
    } else {
      selectedLocationMarker = L.marker([lat, lon]).addTo(map);
    }

    // Turn off selection mode after a tap (optional)
    map.off('click', mapClickListener);
    mapClickListener = null;
    isSelectingLocation = false;
  };

  // Attach the listener
  map.on('click', mapClickListener);
}


function toggleMenu(menuId) {
  document.querySelectorAll("#sidebar > div").forEach((div) => {
    div.classList.toggle("hidden", div.id !== menuId);
  });
}

function clearForm() {
  document.getElementById("placeTitle").value = "";
  document.getElementById("latitude").value = "";
  document.getElementById("longitude").value = "";
  document.getElementById("mapLink").value = "";
  document.getElementById("ideal").value = "";
  document.getElementById("description").value = "";
  document.getElementById("placePhoto").value = "";
}

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function createTour() {
  toggleMenu("generate-loop");
}

async function generateTour(timeMinutes) {
  showLoader();
  try {
    const userCoords = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve([position.coords.latitude, position.coords.longitude]),
        (error) => reject(error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    });

    const [userLat, userLng] = userCoords;
    const walkingDistanceLimit = (timeMinutes / 60) * 5; // e.g. 5 km/h pace

    // Filter markers within radius (3 km for example)
    const nearbyLocations = Alllocations.filter(loc => {
      const dist = getDistanceFromLatLonInKm(userLat, userLng, loc.latitude, loc.longitude);
      return dist <= 10;
    });

    if (nearbyLocations.length === 0) {
      console.warn("No nearby markers.");
      return;
    }

    // Map marker coordinates for the route
    const routeCoords = nearbyLocations.map(loc => [loc.latitude, loc.longitude]);

    // Include user position at the start
    const fullRoute = [[userLat, userLng], ...routeCoords];

    // TRIAL FOR MODIFYING THE TOUR BASED OF THE TIME SELECTION OF THE USER.
 /*   console.log(`Total route distance: ${totalDistance.toFixed(2)} km`);
    console.log(`Time allows: ${walkingDistanceLimit.toFixed(2)} km`);

    // Check if distance exceeds limit
    if (totalDistance <= walkingDistanceLimit) {
      drawRouteOnMap(userLat, userLng, routeCoords, map); // draw tour
    } else {
      console.warn("Selected time is too short for this tour.");
      // Time not enough for full route
      if (currentRouteLayer) {
        map.removeLayer(currentRouteLayer);
        currentRouteLayer = null;
      }
    }*/
   drawRouteOnMap(userLat, userLng, routeCoords, map); // draw tour

  } catch (error) {
    console.error("Error generating tour:", error);
  } finally {
    hideLoader();
  }
}


var currentRouteLayer = null;

function drawRouteOnMap(userLat, userLng, nearbyCoordinates, map) {
  // Remove previous route if it exists
  if (currentRouteLayer) {
    map.removeLayer(currentRouteLayer);
  }
  // Step 1: Compute distance from user to each marker
  const toRad = deg => deg * Math.PI / 180;
  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // meters
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Step 2: Sort markers using a greedy "nearest neighbor" approach
  const sortedMarkers = [];
  var current = { lat: userLat, lng: userLng };
  var remaining = [...nearbyCoordinates]; // shallow copy

  while (remaining.length > 0) {
    var nearestIndex = 0;
    var minDist = Infinity;

    for (var i = 0; i < remaining.length; i++) {
      const dist = haversine(current.lat, current.lng, remaining[i][0], remaining[i][1]);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    const next = remaining.splice(nearestIndex, 1)[0];
    sortedMarkers.push(next);
    current = { lat: next[0], lng: next[1] };
  }

  // Step 3: Build waypoints [user, sortedMarkers..., user]
  const waypoints = [
    [userLng, userLat], // start
    ...sortedMarkers.map(coord => [coord[1], coord[0]]),
    [userLng, userLat]  // return to start
  ];

  const waypointsStr = waypoints.map(point => point.join(',')).join(';');


  // Step 4: Request the route
  const osrmUrl = `https://router.project-osrm.org/route/v1/walking/${waypointsStr}?overview=full&geometries=geojson`;

fetch(osrmUrl)
  .then(response => response.json())
  .then(routeGeoJSON => {
    if (routeGeoJSON.routes && routeGeoJSON.routes.length > 0) {
      const route = routeGeoJSON.routes[0].geometry;

      // 1. Draw the main route line
      const latlngs = route.coordinates.map(coord => [coord[1], coord[0]]);
      currentRouteLayer = L.geoJSON(route, {
        style: {
          color: '#ff5733',
          weight: 4,
          opacity: 0.8
        }
      }).addTo(map);

      // 2. Add directional arrows along the line (every N points)
      for (var i = 0; i < latlngs.length - 1; i += 25) {
        const from = latlngs[i];
        const to = latlngs[i + 1];

        const angle = Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI;

        // Create arrow icon rotated toward next point
        const arrowIcon = L.divIcon({
          className: 'arrow-icon',
          html: `<div style="transform: rotate(${angle}deg);">➤</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        // Place the arrow marker
        L.marker(from, { icon: arrowIcon }).addTo(map);
      }
    } else {
      console.error("No route found");
    }
  })
  .catch(err => {
    console.error("Error fetching route:", err);
  });
}
var userMarker = null;
var userLocationWatchId = null;

function trackUserLocation(map) {
    if (!navigator.geolocation) {
        console.warn('Geolocation not supported.');
        return;
    }

    const pulsingIcon = L.divIcon({
        className: '', // Avoid default Leaflet icon styles
        html: '<div class="pulsing-dot"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10], // center the icon
    });

    // If the userMarker already exists, remove it from the map
    if (userMarker) {
        map.removeLayer(userMarker);  // Remove the old marker
        userMarker = null;  // Reset the userMarker variable
    }

    // Clear the watch if it was previously set (optional)
    if (userLocationWatchId !== null) {
        navigator.geolocation.clearWatch(userLocationWatchId);
    }

    userLocationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const userCoords = [lat, lng];

            // First time: create the marker
            userMarker = L.marker(userCoords, {
                icon: pulsingIcon,
                interactive: false,
                zIndexOffset: 1000,
            }).addTo(map);

        },
        (error) => {
            console.warn('Error getting location:', error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000,
        }
    ); 
}


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}
