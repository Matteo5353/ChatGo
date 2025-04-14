let map;
let markers = [];
const DEFAULT_ZOOM = 14;
const MARKER_SIZE = 40;
const API_URL = "https://openstreetmap-zue0.onrender.com/places";
// const API_URL = "http://localhost:3000/places";
let currentInfoWindow = null;
let Alllocations = [];
document.addEventListener("DOMContentLoaded", initMap);

async function initMap() {
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

function toggleSidebar() {
  let sidebar = document.getElementById("sidebar"); 
  sidebar.classList.toggle("hidden-sidebar");
}


async function loadLocations() {
  try {
    const response = await fetch(API_URL);
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
  /*
  const mapLink = infoWindow.querySelector(".info-map-link");
  if (place.mapLink === "") {
    mapLink.style.display = "none";
  } else {
    mapLink.style.display = "block";
    mapLink.href = place.mapLink.startsWith("http")
      ? place.mapLink
      : `https://${place.mapLink}`;
  }*/

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

    placesList.innerHTML = locations
      .map(
        (place) => `
                <div class="place-item" id="place-${place.title}">
                    <span class="place-title" onclick="map.flyTo([${place.latitude}, ${place.longitude}], ${DEFAULT_ZOOM})">
                        ${place.title}
                    </span>
                </div>
            `
      )
      .join("");

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



function deleteValue() {
  showLoader();
  try {
    const locations = [...Alllocations];
    const placesList = document.getElementById("placesList");

    placesList.innerHTML = locations
      .map(
        (place) => `
                <div class="place-item" id="place-${place.title}">
                    <span class="place-title" onclick="deleteData('${place._id}')">
                        ${place.title}
                </div>
            `
      )
      .join("");

    toggleMenu("placesMenu");
    
  } finally {
    hideLoader();
  }
}



async function deleteData(placeId) {
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
      throw new Error(`Failed to delete place: ${errorText}`);
    }

    console.log("Place deleted from database successfully!");

    // After successful deletion, remove from Alllocations and UI
    Alllocations = Alllocations.filter((place) => place._id !== placeId);

    // Remove the place item from the DOM
    const placeElement = document.getElementById(`place-${placeId}`);
    if (placeElement) placeElement.remove();

    // Refresh the UI/menu
    backToMenu();
  } catch (error) {
    console.error("Error deleting place:", error);
    alert(`Failed to delete place: ${error.message}`); // Show detailed error
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

  let debounceTimer;
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
      //mapLink: document.getElementById("mapLink").value,
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
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Fill the form inputs with the detected location
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lon;

        // Optional: if you're using Leaflet/OpenStreetMap, center the map too
        if (typeof map !== 'undefined') {
          map.setView([lat, lon], 13); // Adjust zoom level as needed
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
  document.getElementById("ideal").value = "None";
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

let userMarker = null;
let userLocationWatchId = null;

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

    userLocationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const userCoords = [lat, lng];

            if (!userMarker) {
                // First time: create the marker
                userMarker = L.marker(userCoords, {
                    icon: pulsingIcon,
                    interactive: false,
                    zIndexOffset: 1000,
                }).addTo(map);
            } else {
                // Update the marker position
                userMarker.setLatLng(userCoords);
            }

        },
        (error) => {
            console.warn('Error getting location:', error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
        }
    );
}

function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}
