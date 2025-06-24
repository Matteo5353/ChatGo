// Load the databases
const BASE_API_URL = 'https://openstreetmap-v0jt.onrender.com';
window.AppConfig = {
  USERS_API_URL: 'https://openstreetmap-v0jt.onrender.com/users',
  PLACES_API_URL: 'https://openstreetmap-v0jt.onrender.com/places'
};



var currentScript = null; 
     async function loadMode(mode) {
        console.log(`Switching to mode: ${mode}`);

        //document.getElementById('dynamic-style').href = `${mode}.css`;

        // Load HTML fragment
        try {
          const response = await fetch(`${mode}.html`);
          if (!response.ok) throw new Error(`${mode}.html not found`);
          const html = await response.text();
          document.getElementById('main-content').innerHTML = html;
          console.log(`${mode}.html loaded`);
        } catch (err) {
          console.error(err);
        }

        // Remove previous JS
        if (currentScript) currentScript.remove();

        // Load JS
        currentScript = document.createElement('script');
        currentScript.src = `${mode}.js`;
        currentScript.onload = () => console.log(`${mode}.js loaded`);
        currentScript.onerror = () => console.error(`Failed to load ${mode}.js`);
        document.body.appendChild(currentScript);
      }
    window.onload = () => loadMode('go');




const loginTerminal = document.getElementById('terminalWindow');
const profileTerminal = document.getElementById('profileWindow');
var isLoggedIn = false;
// var currentUser = {};


function toggleTerminal() {
  // Clear
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("username").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";

  if (loginTerminal.style.display === 'block') {
    loginTerminal.style.display = 'none';
  } else {
    loginTerminal.style.display = 'block';
  }
}

async function showUserProfile() {
  if (!isLoggedIn) {
    toggleTerminal(); // show login if not logged in
    return;
  }
  // Clear the inputs
  document.getElementById("currentLocation").value = "";
  document.getElementById("lastCity").value = "";
  document.getElementById("suggestion").value = "";
  document.getElementById("Bio").value = "";

  const profileWindow = document.getElementById("profileWindow");

  if (profileWindow.style.display === 'block') {
    profileWindow.style.display = 'none';
    return;
  }

  // Show window first
  profileWindow.style.display = 'block';

  // Load latest profile from backend
  try {
    const res = await fetch(`${window.AppConfig.USERS_API_URL}/get-profile?email=${encodeURIComponent(currentUser.email)}`);
    if (!res.ok) {
      throw new Error("Failed to fetch profile");
    }

    const { profile } = await res.json();

    // Populate fields if available
    document.getElementById("currentLocation").value = profile?.location || "";
    document.getElementById("lastCity").value = profile?.lastVisited || "";
    document.getElementById("suggestion").value = profile?.suggestion || "";
    document.getElementById("Bio").value = profile?.bio || "";
    document.getElementById("profilePicture").src = profile?.profilePic || "default-profile.png";

  } catch (err) {
    console.error("Error loading profile:", err);
    alert("Could not load profile.");
  }
}



async function saveUserProfile() {
  const currentLocation = document.getElementById("currentLocation").value;
  const lastCity = document.getElementById("lastCity").value;
  const suggestion = document.getElementById("suggestion").value;
  const bio = document.getElementById("Bio").value;

  const profilePicInput = document.getElementById("uploadProfilePic");
  let profilePicUrl = document.getElementById("profilePicture").src;

  // Upload new profile picture if changed
  if (profilePicInput.files.length > 0) {
    const file = profilePicInput.files[0];
    const base64 = await toBase64(file);

    const uploadRes = await fetch("https://api.cloudinary.com/v1_1/<your-cloud-name>/image/upload", {
      method: "POST",
      body: JSON.stringify({
        file: base64,
        upload_preset: "<your-upload-preset>"
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const uploadData = await uploadRes.json();
    profilePicUrl = uploadData.secure_url;
  }

  const profileData = {
    location: currentLocation,
    lastVisited: lastCity,
    suggestion,
    bio,
    profilePic: profilePicUrl
  };

  const res = await fetch(`${window.AppConfig.USERS_API_URL}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: currentUser.email,
      profile: profileData
    })
  });

  const result = await res.json();
  if (res.ok) {
    alert("Profile saved!");
  } else {
    alert("Error saving profile: " + result.error);
  }
}

// Helper to convert file to base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


function logoutUser() {
  isLoggedIn = false;
  //currentUser = {};
  alert ("You have been logged out");
  profileTerminal.style.display = 'none';
  loginTerminal.style.display = 'block';

}



async function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${window.AppConfig.USERS_API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text(); // fallback to plain text
    alert("Login failed: " + text);
    return;
  }

  const data = await res.json();

  alert("Welcome back, " + data.username);
  // Save user info in memory or localStorage
  window.currentUser = { email };
  toggleTerminal();
  isLoggedIn = true;
  showUserProfile();
}


async function registerUser() {
  window.AppConfig = {
    USERS_API_URL: 'https://openstreetmap-v0jt.onrender.com/users',
};
  const [username, email, password, confirmPassword] = document.querySelectorAll('#registerContent input');

  if (password.value !== confirmPassword.value) {
    return alert("Passwords do not match");
  }

  const res = await fetch(`${window.AppConfig.USERS_API_URL}/register`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      email: email.value,
      password: password.value
    })
  });
  
  if (!res.ok) {
    const text = await res.text(); // fallback to plain text
    console.error("Response error:", text);
    alert("Registration failed: " + text);
    return;
  }

  const data = await res.json();

  if (res.ok) {
    alert("Registered successfully");
    showLoginPage();
  } else {
    alert(data.error || "Registration failed");
  }
}

  

// Switching between login and register page
function showRegisterPage() {
  document.getElementById("loginContent").style.display = "none";
  document.getElementById("registerContent").style.display = "flex";
  document.getElementById("registerContent").style.minHeight = "420px";
}

function showLoginPage() {
  document.getElementById("registerContent").style.display = "none";
  document.getElementById("loginContent").style.display = "flex";
}
