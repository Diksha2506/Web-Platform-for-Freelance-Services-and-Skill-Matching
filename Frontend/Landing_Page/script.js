// Display user role from localStorage
document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role") || "Guest";
  const badgeElement = document.querySelector(".badge");
  if (badgeElement) {
    badgeElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
  }
});

// Logout functionality
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "../login page/login.html";
    });
  }
});

// Button handlers
document.addEventListener("DOMContentLoaded", () => {
  // Get Started buttons
  const primaryBtns = document.querySelectorAll(".primary-btn");
  const secondaryBtns = document.querySelectorAll(".secondary-btn");
  
  primaryBtns.forEach(btn => {
    if (btn.textContent.includes("Get Started") || btn.textContent.includes("Login")) {
      btn.addEventListener("click", () => {
        window.location.href = "../login page/login.html";
      });
    } else if (btn.textContent.includes("Client")) {
      btn.addEventListener("click", () => {
        localStorage.setItem("role", "client");
        window.location.href = "../login page/login.html";
      });
    }
  });
  
  secondaryBtns.forEach(btn => {
    if (btn.textContent.includes("Login")) {
      btn.addEventListener("click", () => {
        window.location.href = "../login page/login.html";
      });
    } else if (btn.textContent.includes("Freelancer")) {
      btn.addEventListener("click", () => {
        localStorage.setItem("role", "freelancer");
        window.location.href = "../login page/login.html";
      });
    }
  });
});

// Small UX polish
window.addEventListener("scroll", () => {
  document.querySelector(".navbar").style.boxShadow =
    window.scrollY > 10 ? "0 4px 10px rgba(0,0,0,0.1)" : "none";
});
