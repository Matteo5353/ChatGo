let map;
let markers = [];
const DEFAULT_ZOOM = 14;
const MARKER_SIZE = 40;
const API_URL = "https://openstreetmap-zue0.onrender.com/places";
// const API_URL = "http://localhost:3000/places";
let currentInfoWindow = null;
let isAddingCity = false;
let Alllocations = [];
document.addEventListener("DOMContentLoaded", initMap);

async function initMap() {
  showLoader();
  try {
    map = L.map("map").setView([20, 0], 3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );
    await loadLocations();
    loadCitiesList();
  } finally {
    hideLoader();
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

    placesList.innerHTML = locations
      .filter((place) => !place.isCity)
      .map(
        (place) => `
                <div class="place-item" id="place-${place.title}">
                    <span class="place-title" onclick="map.flyTo([${place.latitude}, ${place.longitude}], ${DEFAULT_ZOOM})">
                        ${place.title}
                    </span>
                      <button class="delete-btn" data-title="${place.title}" onclick="deletePlace('${place.title}')">✖</button> <!-- This is the delete button for each place -->
                </div>
            `
      )
      .join("");

    toggleMenu("placesMenu");
    
  } finally {
    hideLoader();
  }
}


async function deletePlace(placeTitle) {
  showLoader();
  try {
    // Ensure you're using the correct URL for your backend
    const response = await fetch('https://matteo5353.github.io/chatgo-first-website/places/delete', { // Update this URL
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: placeTitle })
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text();  // Get the error message from the backend
      throw new Error(`Failed to delete place: ${errorText}`);
    }

    console.log("Place deleted from database successfully!");

    // After successful deletion, remove from Alllocations and UI
    Alllocations = Alllocations.filter((place) => place.title !== placeTitle);

    // Remove the place item from the DOM
    const placeElement = document.getElementById(`place-${placeTitle}`);
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






function showAddPlace(isCity) {
  isAddingCity = isCity;
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
      isCity: isAddingCity,
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
    if (isAddingCity) loadCitiesList();
    backToMenu();
    clearForm();
  } catch (error) {
    console.error("Error saving location:", error);
    alert("Failed to save location. Please check your input.");
  } finally {
    hideLoader();
  }
}

function loadCitiesList() {
  const citiesList = document.getElementById("citiesList");
  fetch(API_URL)
    .then((res) => res.json())
    .then((locations) => {
      citiesList.innerHTML = locations
        .filter((place) => place.isCity)
        .map(
          (city) => `
                    <div class="city-item" onclick="map.flyTo([${city.latitude}, ${city.longitude}], ${DEFAULT_ZOOM})">
                        ${city.title}
                    </div>
                `
        )
        .join("");
    });
}

function backToMenu() {
  toggleMenu("mainMenu");
  loadCitiesList();
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

function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}
