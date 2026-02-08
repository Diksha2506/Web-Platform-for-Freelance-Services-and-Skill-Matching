// Register User
function registerUser(event) {
  event.preventDefault();

  let role = document.getElementById("role").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users")) || [];

  let userExists = users.find(user => user.email === email);
  if (userExists) {
    alert("User already exists!");
    return;
  }

  users.push({ role, email, password });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful!");
  window.location.href = "login.html";
}

// Login User
function loginUser(event) {
  event.preventDefault();

  let role = document.getElementById("loginRole").value;
  let email = document.getElementById("loginEmail").value;
  let password = document.getElementById("loginPassword").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];

  let validUser = users.find(
    user => user.email === email && user.password === password && user.role === role
  );

  if (validUser) {
    alert(role + " login successful!");

    //later redirection to respective dashboard can be implemented here
  } else {
    alert("Invalid credentials!");
  }
}
