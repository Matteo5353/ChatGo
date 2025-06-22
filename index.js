// Load the page 

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
      API_URL: 'https://openstreetmap-v0jt.onrender.com/places',
      };
      
    window.onload = () => loadMode('go');   



// Login page 

const terminal = document.getElementById('terminalWindow');

function toggleTerminal() {
  if (terminal.style.display === 'block') {
    terminal.style.display = 'none';
  } else {
    terminal.style.display = 'block';
  }
}

function submitLogin() {
    document.getElementById("loginEmail").value = "";
    //document.getElementById("loginPassword").value = "";
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.token) {
            alert('Login successful');
            localStorage.setItem('token', data.token);
            toggleProfilePage(); // hides the modal again
        } else {
            alert(data.error || 'Login failed');
        }
    })
    .catch((err) => {
        console.error('Login error:', err);
    });
}