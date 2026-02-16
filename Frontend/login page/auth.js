// Register User
async function registerUser(event) {
  event.preventDefault();

  const role = document.getElementById("role").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Test User", // later replace with actual name input
        email,
        password,
        role
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful!");
      window.location.href = "login.html";
    } else {
      alert(data.error || "Registration failed");
    }

  } catch (error) {
    alert("Server error. Try again later.");
    console.error(error);
  }
}

// Login User
async function loginUser(event) {
  event.preventDefault();

  const role = document.getElementById("loginRole").value;
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert(role + " login successful!");

      // role-based redirect (example)
      if (role === "freelancer") {
        window.location.href = "freelancer-dashboard.html";
      } else {
        window.location.href = "client-dashboard.html";
      }

    } else {
      alert(data.message || "Invalid credentials");
    }

  } catch (error) {
    alert("Server error. Try again later.");
    console.error(error);
  }
}

// Role toggle for login
function setRole(role) {
    document.getElementById("loginRole").value = role;

    const buttons = document.querySelectorAll(".role-toggle button");
    buttons.forEach(btn => btn.classList.remove("active"));

    const loginBtn = document.querySelector(".login-btn");

    if (role === "freelancer") {
        buttons[0].classList.add("active");
        loginBtn.textContent = "Sign in as Freelancer";
    } else {
        buttons[1].classList.add("active");
        loginBtn.textContent = "Sign in as Client";
    }
}

function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const role = document.getElementById("loginRole").value;

    if (!email || !password) {
        alert("Please fill all fields");
        return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", role);

    // ✅ Redirect based on role
    if (role === "client") {
        window.location.href = "/Frontend/ClientProfile_Page/dashboard.html";
    } else {
        window.location.href = "/Frontend/FreelancerProfile/dashboard.html"; //for freelancer
    }
}


