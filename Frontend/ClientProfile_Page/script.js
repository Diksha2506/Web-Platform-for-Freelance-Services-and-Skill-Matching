// ==== GLOBAL CONFIG & HELPERS ====

const API_BASE_URL = "http://127.0.0.1:8000/api";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// TEMP: set this to the profile id for the logged-in user
const PROFILE_ID = 1;

function navigate(page) {
    window.location.href = page;
}

// Store tokens (call this from your login page JS after /auth/login/)
function setTokens(access, refresh) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

function clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getAuthHeaders() {
    const token = getAccessToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
    return res.json();
}

async function apiPost(path, body) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed with ${res.status}`);
    return res.json();
}

// Optional: logout button handler (clear tokens + redirect to login)
async function handleLogout() {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refresh) {
        try {
            await apiPost("/auth/logout/", { refresh });
        } catch (e) {
            console.error("Logout API error (ignored):", e);
        }
    }
    clearTokens();
    window.location.href = "../login page/login.html";
}

// ==== JOB LISTING + CREATE JOB (job_listing.html, create_job.html) ====

async function loadJobs() {
    try {
        const jobs = await apiGet("/jobs/");
        const container = document.getElementById("jobContainer");
        if (!container) return;

        container.innerHTML = "";
        if (jobs.length === 0) {
            container.innerHTML = "<p>No jobs posted yet.</p>";
            return;
        }

        jobs.forEach((job) => {
            container.innerHTML += `
        <div class="job-card">
          <div class="job-header">
            <h3>${job.title}</h3>
            <span class="price">₹ ${job.budget}</span>
          </div>
          <p class="description">${job.description}</p>
          <div class="job-footer">
            <span>Posted just now • Fixed Price • Remote</span>
            <button class="apply-btn">Apply</button>
          </div>
        </div>
      `;
        });
    } catch (error) {
        console.error("Error loading jobs:", error);
    }
}

// Post job form (create_job.html)
function initCreateJobForm() {
    const form = document.getElementById("jobForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const budget = document.getElementById("budget").value;

        try {
            await apiPost("/jobs/", { title, description, budget });
            alert("Job Posted Successfully 🚀");
            navigate("job_listing.html");
        } catch (error) {
            console.error("Error posting job:", error);
            alert("Failed to post job");
        }
    });
}

// ==== DASHBOARD (dashboard.html) ====

async function initDashboardPage() {
    const cards = document.querySelector(".cards");
    if (!cards) return; // not on dashboard

    try {
        const summary = await apiGet("/dashboard/summary/");
        const jobs = await apiGet("/dashboard/jobs/");
        const messages = await apiGet("/dashboard/messages/");

        // Stats cards
        const cardEls = cards.querySelectorAll(".card h2");
        if (cardEls.length >= 4) {
            cardEls[0].textContent = summary.active_projects;
            cardEls[1].textContent = summary.pending_proposals;
            cardEls[2].textContent = `$${summary.total_spent}`;
            cardEls[3].textContent = summary.hired_freelancers;
        }

        // "My Jobs" panel
        const jobPanel = document.querySelectorAll(".panel")[0];
        if (jobPanel) {
            const listContainer = jobPanel.querySelector(".job-item")?.parentNode;
            if (listContainer) {
                listContainer.innerHTML = "";
                jobs.forEach((j) => {
                    const div = document.createElement("div");
                    div.className = "job-item";
                    div.innerHTML = `<h4>${j.title}</h4><span class="status">Active</span>`;
                    listContainer.appendChild(div);
                });
            }
        }

        // "Recent Messages" panel
        const msgPanel = document.querySelectorAll(".panel")[1];
        if (msgPanel) {
            const listContainer = msgPanel.querySelector(".message-item")?.parentNode;
            if (listContainer) {
                listContainer.innerHTML = "";
                messages.forEach((m) => {
                    const div = document.createElement("div");
                    div.className = "message-item";
                    div.innerHTML = `<h4>${m.sender_name}</h4><p>${m.content}</p>`;
                    listContainer.appendChild(div);
                });
            }
        }
    } catch (e) {
        console.error("Failed to load dashboard data:", e);
    }
}

// ==== PROFILE (profile.html) ====

async function initProfilePage() {
    const profileContainer = document.querySelector(".profile-container");
    if (!profileContainer) return;

    // Attach logout button
    const logoutBtn = document.querySelector(".logout-top");
    if (logoutBtn) logoutBtn.onclick = handleLogout;

    try {
        const profile = await apiGet(`/profile/${PROFILE_ID}/`);

        // Left card
        const avatar = document.querySelector(".profile-avatar");
        const usernameEl = document.querySelector(".profile-role")?.previousElementSibling;
        const emailEl = document.querySelector(".profile-email");

        if (avatar) avatar.textContent = profile.full_name?.[0]?.toUpperCase() || "U";
        if (usernameEl) usernameEl.textContent = profile.full_name || "User";
        if (emailEl && profile.user_email) emailEl.textContent = profile.user_email;

        // Right form
        const fullNameInput = document.querySelector('input[type="text"]');
        const emailInput = document.querySelector('input[type="email"]');
        const titleInput =
            document.querySelector('input[placeholder="Project Manager"]') ||
            document.querySelector('input[value="Project Manager"]');
        const bioTextarea = document.querySelector("textarea");
        const skillsInput =
            document.querySelector('input[value*="React"]') ||
            document.querySelector('input[placeholder*="Skills"]');

        if (fullNameInput) fullNameInput.value = profile.full_name || "";
        if (emailInput && profile.user_email) emailInput.value = profile.user_email;
        if (titleInput) titleInput.value = profile.title || "";
        if (bioTextarea) bioTextarea.value = profile.bio || "";
        if (skillsInput) skillsInput.value = profile.skills || "";

        const saveBtn = document.querySelector(".save-btn");
        if (saveBtn) {
            saveBtn.onclick = async () => {
                try {
                    await fetch(`${API_BASE_URL}/profile/${PROFILE_ID}/`, {
                        method: "PUT",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            full_name: fullNameInput?.value || "",
                            title: titleInput?.value || "",
                            bio: bioTextarea?.value || "",
                            skills: skillsInput?.value || "",
                        }),
                    });
                    alert("Profile updated");
                } catch (e) {
                    console.error("Failed to update profile:", e);
                    alert("Failed to update profile");
                }
            };
        }
    } catch (e) {
        console.error("Failed to load profile:", e);
    }
}

// ==== MESSAGES (massages.html) ====

async function initMessagesPage() {
    const chatContainer = document.querySelector(".chat-container");
    if (!chatContainer) return;

    try {
        const threads = await apiGet("/messages/threads/");
        const messages = await apiGet("/messages/");

        // Left conversation list
        const list = document.querySelector(".chat-list");
        if (list) {
            const searchInput = list.querySelector(".chat-search");
            list.innerHTML = "";
            if (searchInput) list.appendChild(searchInput);

            threads.forEach((t) => {
                const div = document.createElement("div");
                div.className = "chat-user";
                const initials = (t.sender_name || "U").slice(0, 2).toUpperCase();
                div.innerHTML = `
          <div class="avatar">${initials}</div>
          <div>
            <h4>${t.sender_name}</h4>
            <p>${t.content.substring(0, 40)}...</p>
          </div>
        `;
                list.appendChild(div);
            });
        }

        // Right chat window (all messages to current user)
        const msgContainer = document.querySelector(".chat-messages");
        if (msgContainer) {
            msgContainer.innerHTML = "";
            messages.forEach((m) => {
                const div = document.createElement("div");
                div.className = "message received";
                div.innerHTML = `
          ${m.content}
          <span>${new Date(m.created_at).toLocaleTimeString()}</span>
        `;
                msgContainer.appendChild(div);
            });
        }

        // Send message (simple version: send to a fixed receiver id)
        const inputEl = document.querySelector(".chat-input input");
        const sendBtn = document.querySelector(".chat-input button");
        if (inputEl && sendBtn) {
            sendBtn.onclick = async () => {
                const content = inputEl.value.trim();
                if (!content) return;

                // TODO: change receiver to actual user id you want to chat with
                const receiverId = 1;
                try {
                    await apiPost("/messages/", { receiver: receiverId, content });
                    inputEl.value = "";
                    const newMessages = await apiGet("/messages/");
                    const msgContainer2 = document.querySelector(".chat-messages");
                    if (msgContainer2) {
                        msgContainer2.innerHTML = "";
                        newMessages.forEach((m) => {
                            const div = document.createElement("div");
                            div.className = "message received";
                            div.innerHTML = `
                ${m.content}
                <span>${new Date(m.created_at).toLocaleTimeString()}</span>
              `;
                            msgContainer2.appendChild(div);
                        });
                    }
                } catch (e) {
                    console.error("Failed to send message:", e);
                    alert("Failed to send message");
                }
            };
        }
    } catch (e) {
        console.error("Failed to load messages:", e);
    }
}

// ==== PAYMENTS (payments.html) ====

async function initPaymentsPage() {
    const paymentsHeader = document.querySelector(".payment-cards");
    if (!paymentsHeader) return;

    try {
        const summary = await apiGet("/payments/summary/");
        const transactions = await apiGet("/payments/transactions/");

        const cards = paymentsHeader.querySelectorAll(".payment-card h2");
        if (cards.length >= 3) {
            cards[0].textContent = `$${summary.total_spent}`;
            cards[1].textContent = `$${summary.in_escrow}`;
            cards[2].textContent = `$${summary.pending}`;
        }

        const list = document.querySelector(".transaction-panel");
        if (list) {
            const itemsContainer = list.querySelectorAll(".transaction-item")[0]?.parentNode;
            if (itemsContainer) {
                itemsContainer.innerHTML = "";
                transactions.forEach((t) => {
                    const statusClass =
                        t.status === "completed"
                            ? "completed"
                            : t.status === "escrow"
                                ? "escrow"
                                : "pending";
                    const div = document.createElement("div");
                    div.className = "transaction-item";
                    div.innerHTML = `
            <div>
              <h4>${t.description}</h4>
              <span>${new Date(t.created_at).toLocaleDateString()}</span>
            </div>
            <div class="transaction-right">
              <h4>$${t.amount}</h4>
              <span class="status ${statusClass}">${t.status}</span>
            </div>
          `;
                    itemsContainer.appendChild(div);
                });
            }
        }
    } catch (e) {
        console.error("Failed to load payments:", e);
    }
}

// ==== SETTINGS (settings.html) ====

async function initSettingsPage() {
    const settingsCard = document.querySelector(".settings-card");
    if (!settingsCard) return;

    try {
        const me = await apiGet("/auth/me/");
        const emailInput = document.querySelector('input[type="email"]');
        const usernameInput = document.querySelector('input[type="text"]');

        if (emailInput) emailInput.value = me.email || "";
        if (usernameInput) usernameInput.value = me.username || "";

        const accountBtn = document.querySelector(".settings-card .primary-btn");
        if (accountBtn) {
            accountBtn.onclick = () => {
                alert("Account update endpoint not implemented yet (backend TODO).");
            };
        }

        const deleteBtn = document.querySelector(".delete-btn");
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                alert("Delete account endpoint not implemented yet (backend TODO).");
            };
        }
    } catch (e) {
        console.error("Failed to load settings:", e);
    }
}

// ==== ROUTER: RUN PAGE-SPECIFIC INITIALIZERS ====

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    if (path.endsWith("dashboard.html")) {
        initDashboardPage();
    } else if (path.endsWith("job_listing.html")) {
        loadJobs();
    } else if (path.endsWith("create_job.html")) {
        initCreateJobForm();
    } else if (path.endsWith("profile.html")) {
        initProfilePage();
    } else if (path.endsWith("massages.html")) {
        initMessagesPage();
    } else if (path.endsWith("payments.html")) {
        initPaymentsPage();
    } else if (path.endsWith("settings.html")) {
        initSettingsPage();
    }
});



