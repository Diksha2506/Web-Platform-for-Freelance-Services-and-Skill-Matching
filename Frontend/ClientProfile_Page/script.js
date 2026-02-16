function navigate(page) {
    window.location.href = page;
}

// Load jobs from Django API
async function loadJobs() {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/jobs/");
        const jobs = await response.json();

        const container = document.getElementById("jobContainer");
        if (!container) return;

        container.innerHTML = "";

        if (jobs.length === 0) {
            container.innerHTML = "<p>No jobs posted yet.</p>";
            return;
        }

        jobs.forEach(job => {
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

// Run when page loads
loadJobs();

// POST JOB
document.getElementById("jobForm")?.addEventListener("submit", async function(e) {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const budget = document.getElementById("budget").value;

    try {
        const response = await fetch("http://127.0.0.1:8000/api/jobs/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                description: description,
                budget: budget
            })
        });

        if (response.ok) {
            alert("Job Posted Successfully 🚀");
            window.location.href = "job_listing.html";
        } else {
            alert("Failed to post job");
        }

    } catch (error) {
        console.error("Error:", error);
    }
});
