// ==== GLOBAL CONFIG & HELPERS ====

const API_BASE_URL = "http://127.0.0.1:8000/api";

// TEMP: set this to the profile id for the logged-in user
const PROFILE_ID = 1;

function navigate(page) {
    window.location.href = page;
}

// No localStorage tokens used — backend uses HttpOnly cookies.
function setTokens() {
    // no-op
}

function clearTokens() {
    // no-op (cookies cleared server-side on logout)
}

// Selection helper for chips
let selectedPeople = [];

function toggleSelection(el, name) {
    el.classList.toggle("active");
    if (el.classList.contains("active")) {
        selectedPeople.push(name);
    } else {
        selectedPeople = selectedPeople.filter((p) => p !== name);
    }
}

function getAuthHeaders() {
    return { "Content-Type": "application/json" };
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
    });
    if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
    return res.json();
}

async function apiPost(path, body) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed with ${res.status}`);
    // some endpoints return no body
    const text = await res.text();
    try {
        return JSON.parse(text || "{}");
    } catch (e) {
        return {};
    }
}

// ==== SUPPORT REQUEST (help_Center.html) ====

async function submitSupportRequest(event) {
    if (event) event.preventDefault();

    const subjectEl = document.querySelector('.contact-form input[type="text"]');
    const messageEl = document.querySelector('.contact-form textarea');

    if (!subjectEl || !messageEl) return;

    const body = {
        subject: subjectEl.value,
        message: messageEl.value
    };

    if (!body.subject || !body.message) {
        alert("Please fill in both subject and message.");
        return;
    }

    try {
        await apiPost("/support/", body);
        alert("Support request sent successfully!");
        subjectEl.value = "";
        messageEl.value = "";
    } catch (err) {
        console.error("Failed to send support request:", err);
        alert("Failed to send support request. Please try again.");
    }
}

// Logout: call backend to clear cookies and redirect to login
async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
    } catch (e) {
        console.error("Logout request failed:", e);
    }
    // Redirect to login (frontend served path)
    window.location.href = "/login/login.html";
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
            <span><i class="fas fa-clock"></i> ${job.job_type}</span>
            <span><i class="fas fa-layer-group"></i> ${job.experience_level}</span>
            <button class="primary-btn" onclick="navigate('project-details.html?id=${job.id}')">View Details</button>
          </div>
        </div>
      `;
        });
    } catch (error) {
        console.error("Error loading jobs:", error);
    }
}

async function initCreateJobForm() {
    const jobForm = document.getElementById("jobForm");
    if (!jobForm) return;

    jobForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(jobForm);
        const body = Object.fromEntries(formData.entries());
        body.remote_allowed = jobForm.remote_allowed.checked;

        try {
            await apiPost("/jobs/", body);
            alert("Job posted successfully!");
            navigate("job_listing.html");
        } catch (err) {
            console.error("Failed to post job:", err);
            alert("Error posting job.");
        }
    });
}

// ==== PROJECTS (projects.html, create_project.html) ====

async function loadProjects() {
    try {
        const projects = await apiGet("/projects/");
        const container = document.getElementById("projectList");
        if (!container) return;

        container.innerHTML = "";
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No projects found. Post your first project to get started!</p>
                </div>
            `;
            return;
        }

        projects.forEach((proj) => {
            const statusClass = (proj.status || "active").toLowerCase().replace(' ', '-');
            container.innerHTML += `
                <div class="project-item">
                    <div class="project-left">
                        <h3>${proj.title}</h3>
                        <p>${proj.description.substring(0, 150)}${proj.description.length > 150 ? "..." : ""}</p>
                        <div class="project-info">
                            <span><i class="fas fa-tasks"></i> ${proj.tasks ? proj.tasks.length : 0} Tasks</span>
                            <span><i class="fas fa-calendar"></i> Due: ${new Date(proj.deadline).toLocaleDateString()}</span>
                            <span><i class="fas fa-chart-line"></i> ${proj.progress || 0}% Progress</span>
                        </div>
                    </div>
                    <div class="project-right">
                        <span class="status ${statusClass}">${proj.status || "Active"}</span>
                        <div class="project-actions">
                            <button class="primary-btn" onclick="navigate('project-details.html?id=${proj.id}')">Manage</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Failed to load projects:", e);
    }
}

async function initCreateProjectForm() {
    const projectForm = document.getElementById("projectForm");
    if (!projectForm) return;

    projectForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const projectData = {
            title: document.getElementById("proj_title").value,
            description: document.getElementById("proj_description").value,
            deadline: document.getElementById("proj_deadline").value,
            planned_hours: parseInt(document.getElementById("proj_hours").value),
        };

        try {
            await apiPost("/projects/", projectData);
            alert("Project Created Successfully 🚀");
            navigate("projects.html");
        } catch (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project. Please check if all fields are valid.");
        }
    });
}

// ==== PROJECT DETAILS (project-details.html) ====

// ==== PROJECT DETAILS MODALS & DATA ====

function openAllotModal() {
    selectedPeople = [];
    document.querySelectorAll('.freelancer-chip').forEach(c => c.classList.remove('active'));
    document.getElementById("allotModal").style.display = "flex";
}

function closeAllotModal() {
    document.getElementById("allotModal").style.display = "none";
}

function openMeetModal() {
    selectedPeople = [];
    document.querySelectorAll('.meet-chip').forEach(c => c.classList.remove('active'));
    document.getElementById("meetModal").style.display = "flex";
}

function closeMeetModal() {
    document.getElementById("meetModal").style.display = "none";
}

async function loadFreelancers() {
    try {
        const freelancers = await apiGet("/profile/freelancers/");
        const taskGrid = document.querySelector("#allotModal .freelancer-selection-grid");
        const meetGrid = document.querySelector("#meetModal .freelancer-selection-grid");

        if (taskGrid) {
            taskGrid.innerHTML = freelancers.map(f => `
                <div class="freelancer-chip" onclick="toggleSelection(this, '${f.full_name}')">
                    <div class="avatar-small">${(f.full_name || "??").substring(0, 2).toUpperCase()}</div>
                    <span>${f.full_name} (${f.title || 'Freelancer'})</span>
                </div>
            `).join("");
        }

        if (meetGrid) {
            meetGrid.innerHTML = freelancers.map(f => `
                <div class="freelancer-chip meet-chip" onclick="toggleSelection(this, '${f.full_name}')">
                    <div class="avatar-small">${(f.full_name || "??").substring(0, 2).toUpperCase()}</div>
                    <span>${f.full_name}</span>
                </div>
            `).join("");
        }
    } catch (e) {
        console.error("Failed to load freelancers:", e);
    }
}

async function submitTaskAllocation() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("id");
    const title = document.getElementById("taskTitleInput").value;
    const deadline = document.getElementById("taskDeadlineInput").value;
    const desc = document.getElementById("taskDescInput").value;

    if (!title || selectedPeople.length === 0 || !deadline) {
        alert("Please fill title, select at least one freelancer, and set a deadline.");
        return;
    }

    const taskData = {
        project: projectId,
        title: title,
        description: desc,
        due_date: deadline,
        assigned_to: selectedPeople.join(", "),
        hours: 0,
    };

    try {
        await apiPost("/tasks/", taskData);
        alert("Task Allotted Successfully!");
        closeAllotModal();
        location.reload();
    } catch (e) {
        console.error("Task allocation failed:", e);
        alert("Failed to allot task.");
    }
}

async function submitMeeting() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("id");
    const topic = document.getElementById("meetTopic").value;
    const timing = document.getElementById("meetTiming").value;
    const desc = document.getElementById("meetDesc").value;

    if (!topic || !timing || selectedPeople.length === 0) {
        alert("Please fill topic, timing, and invite at least one freelancer.");
        return;
    }

    const meetData = {
        project: projectId,
        topic: topic,
        timing: timing,
        description: desc,
        attendees: selectedPeople.join(", "),
    };

    try {
        await apiPost("/meetings/", meetData);
        alert("Meeting Scheduled Successfully!");
        closeMeetModal();
        location.reload();
    } catch (e) {
        console.error("Meeting scheduling failed:", e);
        alert("Failed to schedule meeting.");
    }
}

async function initProjectDetailsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("id");
    if (!projectId) return;

    // Attach globals to window so HTML can call them
    window.openAllotModal = openAllotModal;
    window.closeAllotModal = closeAllotModal;
    window.openMeetModal = openMeetModal;
    window.closeMeetModal = closeMeetModal;
    window.toggleSelection = toggleSelection;
    window.submitTaskAllocation = submitTaskAllocation;
    window.submitMeeting = submitMeeting;

    // Load freelancers for modals
    await loadFreelancers();

    try {
        const project = await apiGet(`/projects/${projectId}/`);

        // Update basic info
        const titleEl = document.querySelector(".topbar-left h1");
        const descEl = document.querySelector(".project-description");
        const statusEl = document.querySelector(".status-badge");
        const deadlineEl = document.querySelectorAll(".summary-card h3")[1];
        const hoursEl = document.querySelectorAll(".summary-card h3")[2];
        const progressEl = document.querySelectorAll(".summary-card h3")[3];
        const progressFill = document.querySelector(".progress-fill");
        const progressText = document.querySelector(".progress-text");

        if (titleEl) titleEl.textContent = project.title;
        if (descEl) descEl.textContent = project.description;
        if (statusEl) {
            statusEl.textContent = project.status;
            statusEl.className = `status-badge ${project.status.toLowerCase().replace(" ", "-")}`;
        }
        if (deadlineEl) deadlineEl.textContent = project.deadline;
        if (hoursEl) hoursEl.textContent = `${project.planned_hours} hrs`;
        if (progressEl) progressEl.textContent = `${project.progress}%`;
        if (progressFill) progressFill.style.width = `${project.progress}%`;
        if (progressText) progressText.textContent = `${project.progress}% Completed`;

        // Load tasks and meetings
        const taskContainer = document.getElementById("projectTasks");
        if (taskContainer && project.tasks) {
            // Clear "Loading..."
            taskContainer.innerHTML = "<h3>All Assigned Tasks</h3>";

            if (project.tasks.length === 0) {
                taskContainer.innerHTML += "<p>No tasks assigned yet.</p>";
            } else {
                project.tasks.forEach((t) => {
                    taskContainer.innerHTML += `
                        <div class="task-item">
                            <div>
                                <strong>${t.title}</strong>
                                <p>Assigned to ${t.assigned_to} • ${t.due_date}</p>
                            </div>
                            <span>${t.hours} hrs</span>
                        </div>
                    `;
                });
            }

            // Handle meetings panel
            let meetContainer = document.getElementById("projectMeetings");
            if (!meetContainer) {
                meetContainer = document.createElement("div");
                meetContainer.id = "projectMeetings";
                meetContainer.className = "panel clean-panel";
                taskContainer.parentNode.insertBefore(meetContainer, taskContainer);
            }

            meetContainer.innerHTML = "<h3>Upcoming Meetings</h3>";
            if (!project.meetings || project.meetings.length === 0) {
                meetContainer.innerHTML += "<p>No meetings scheduled.</p>";
            } else {
                project.meetings.forEach((m) => {
                    const time = new Date(m.timing).toLocaleString();
                    meetContainer.innerHTML += `
                        <div class="task-item" style="border-left: 4px solid #3b82f6; padding-left: 15px;">
                            <div>
                                <strong>${m.topic}</strong>
                                <p>Attendees: ${m.attendees} • ${time}</p>
                            </div>
                        </div>
                    `;
                });
            }
        }
    } catch (e) {
        console.error("Failed to load project details:", e);
    }
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

async function initSidebar() {
    try {
        const me = await apiGet("/auth/me/");
        const avatar = document.querySelector(".user-avatar");
        const name = document.querySelector(".user-details h3");
        const roleDisp = document.querySelector(".user-details .role");

        if (avatar) avatar.textContent = (me.first_name || me.username || "").substring(0, 2).toUpperCase();
        if (name) name.textContent = me.full_name || me.username;
        if (roleDisp && me.profile) {
            roleDisp.textContent = me.profile.role.charAt(0).toUpperCase() + me.profile.role.slice(1);
        }
    } catch (e) {
        // Not logged in or error
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initSidebar();
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
    } else if (path.endsWith("projects.html")) {
        loadProjects();
    } else if (path.endsWith("create_project.html")) {
        initCreateProjectForm();
    } else if (path.endsWith("project-details.html")) {
        initProjectDetailsPage();
    }
});



