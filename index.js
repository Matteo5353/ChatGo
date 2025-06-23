// Load the page 
const BASE_API_URL = 'https://openstreetmap-v0jt.onrender.com';



let currentScript = null; 
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
    window.AppConfig = {
      PLACES_API_URL: 'https://openstreetmap-v0jt.onrender.com/places',
      };
    window.onload = () => loadMode('go');



// Login page 

const terminal = document.getElementById('terminalWindow');

function toggleTerminal() {
  // Clear
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("username").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";

  if (terminal.style.display === 'block') {
    terminal.style.display = 'none';
  } else {
    terminal.style.display = 'block';
  }
}




async function loginUser() {
  window.AppConfig = {
    USERS_API_URL: 'https://openstreetmap-v0jt.onrender.com/users',
};
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
  toggleTerminal();
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
