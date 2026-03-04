const API_BASE = "http://localhost:8000/api";

// Register User (calls Django REST register endpoint)
async function registerUser(event) {
  event.preventDefault();

  const role = document.getElementById("role").value;
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username,
        email,
        password,
        password_confirm: confirmPassword,
        role,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // If client signed up, attempt auto-login (server sets HttpOnly cookies)
      if (role === "client") {
        try {
          const loginRes = await fetch(`${API_BASE}/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password }),
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            const userRole = loginData.user.role;
            console.log("Auto-login successful after registration. Role:", userRole);
            setTimeout(() => {
              if (userRole === "client") {
                window.location.href = "/client/dashboard.html";
              } else {
                window.location.href = "/freelancer/dashboard.html";
              }
            }, 500);
            return;
          }
        } catch (err) {
          console.error("Auto-login failed:", err);
        }
      }
      alert("Registration successful! Please sign in.");
      window.location.href = "login.html";
    } else {
      alert(data.detail || data.message || JSON.stringify(data));
    }
  } catch (error) {
    alert("Server error. Try again later.");
    console.error(error);
  }
}

// Login User (calls Django REST token endpoint)
async function loginUser(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const role = document.getElementById("role").value;

  if (!username || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      const userRole = data.user.role;
      console.log("Login successful. Role:", userRole);

      setTimeout(() => {
        if (userRole === "client") {
          window.location.href = "/client/dashboard.html";
        } else {
          window.location.href = "/freelancer/dashboard.html";
        }
      }, 500);
    } else {
      const data = await response.json();
      console.error("Login failed:", data);
      alert(data.detail || data.error || data.non_field_errors || "Login failed. Please try again.");
    }
  } catch (error) {
    alert("Server error. Try again later.");
    console.error("Login error:", error);
  }
}

// Role toggle for login and register
function setRole(role) {
  const roleInput = document.getElementById("role");
  if (roleInput) roleInput.value = role;

  const toggleContainer = document.querySelector(".role-toggle");
  const buttons = document.querySelectorAll(".role-toggle button");
  const loginBtn = document.querySelector(".login-btn");

  buttons.forEach((btn) => btn.classList.remove("active"));

  if (role === "freelancer") {
    buttons[0].classList.add("active");
    if (toggleContainer) toggleContainer.classList.remove("client-active");
    if (loginBtn && window.location.pathname.includes("login.html")) {
      loginBtn.textContent = "Sign in as Freelancer";
    }
  } else {
    buttons[1].classList.add("active");
    if (toggleContainer) toggleContainer.classList.add("client-active");
    if (loginBtn && window.location.pathname.includes("login.html")) {
      loginBtn.textContent = "Sign in as Client";
    }
  }
}

// Mock Google Authentication
function googleAuth() {
  const role = document.getElementById("role") ? document.getElementById("role").value : "freelancer";
  alert(`Connecting to Google to authenticate as a ${role}...`);
  // Redirect to backend OAuth endpoint would go here
  // window.location.href = `${API_BASE}/auth/google/?role=${role}`;
}

// Mock GitHub Authentication
function githubAuth() {
  const role = document.getElementById("role") ? document.getElementById("role").value : "freelancer";
  alert(`Connecting to GitHub to authenticate as a ${role}...`);
  // Redirect to backend OAuth endpoint would go here
  // window.location.href = `${API_BASE}/auth/github/?role=${role}`;
}
