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


