

const BASE_URL = "https://video-api-r1.onrender.com/api";
const ALLOWED_DOMAIN = "rbunagpur.in";

const app = document.getElementById("app");
const navLinks = document.getElementById("navLinks");
const toastEl = document.getElementById("toast");
function getToken() { return localStorage.getItem("token"); }
function getUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}
function isLoggedIn() { return !!getToken(); }
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("#/login");
}
function isCollegeEmail(email) {
  const re = new RegExp(`^[^\\s@]+@${ALLOWED_DOMAIN.replace(".", "\\.")}$`, "i");
  return re.test((email || "").trim());
}
function showToast(msg, type = "ok") {
  toastEl.textContent = msg;
  toastEl.className = "toast show " + type;
  setTimeout(() => (toastEl.className = "toast"), 2500);
}
function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}
async function apiRequest(path, method = "GET", body = null) {
  const headers = {};
  if (isLoggedIn()) headers["Authorization"] = "Bearer " + getToken();

  let res;
  try {
    res = await fetch(BASE_URL + path, { method, headers, body: body || undefined });
  } catch (e) {
    throw new Error("Could not reach the server. It may be waking up — try again shortly.");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok || (data && data.success === false)) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }
  if (!data) return null;
  return data.data !== undefined ? data.data : data;
}

function navigate(hash) {
  window.location.hash = hash;
}

window.addEventListener("hashchange", render);
window.addEventListener("load", render);

function render() {
  const hash = window.location.hash || "#/login";
  const [, route, param] = hash.split("/"); 

  renderNavbar();
  const publicRoutes = ["login", "register"];
  if (!publicRoutes.includes(route) && !isLoggedIn()) {
    return navigate("#/login");
  }

  switch (route) {
    case "login": return renderLogin();
    case "register": return renderRegister();
    case "dashboard": return renderDashboard();
    case "upload": return renderUpload();
    case "video": return renderVideoDetail(param);
    case "edit": return renderEdit(param);
    default: return navigate("#/login");
  }
}

function renderNavbar() {
  if (isLoggedIn()) {
    navLinks.innerHTML = `
      <a href="#/dashboard">Dashboard</a>
      <a href="#/upload">Upload</a>
      <button id="logoutBtn">Logout</button>
    `;
    document.getElementById("logoutBtn").onclick = logout;
  } else {
    navLinks.innerHTML = `<a href="#/login">Login</a>`;
  }
}

function renderLogin() {
  app.innerHTML = `
    <div class="form-card">
      <h2>Log in</h2>
      <div class="banner" id="banner" style="display:none;"></div>
      <form id="loginForm">
        <label>Email</label>
        <input type="email" id="email" required>
        <label>Password</label>
        <input type="password" id="password" required>
        <button class="primary" type="submit" id="submitBtn">Log in</button>
      </form>
      <p class="switch-link">No account? <a href="#/register">Register</a></p>
    </div>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const banner = document.getElementById("banner");
    const btn = document.getElementById("submitBtn");

    banner.style.display = "none";
    btn.disabled = true;
    btn.textContent = "Logging in…";

    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("password", password);
      const data = await apiRequest("/users/login", "POST", fd);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      showToast("Welcome back!");
      navigate("#/dashboard");
    } catch (err) {
      banner.textContent = err.message;
      banner.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Log in";
    }
  });
}

function renderRegister() {
  app.innerHTML = `
    <div class="form-card">
      <h2>Create account</h2>
      <div class="banner" id="banner" style="display:none;"></div>
      <form id="registerForm">
        <label>Username</label>
        <input type="text" id="username" required>
        <label>Full name</label>
        <input type="text" id="fullName" required>
        <label>College email (@${ALLOWED_DOMAIN})</label>
        <input type="email" id="email" required>
        <div class="error-msg" id="emailError"></div>
        <label>Password</label>
        <input type="password" id="password" required minlength="6">
        <button class="primary" type="submit" id="submitBtn">Register</button>
      </form>
      <p class="switch-link">Already have an account? <a href="#/login">Log in</a></p>
    </div>
  `;

  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("emailError");
  emailInput.addEventListener("blur", () => {
    if (emailInput.value && !isCollegeEmail(emailInput.value)) {
      emailInput.classList.add("invalid");
      emailError.textContent = `Only @${ALLOWED_DOMAIN} emails are allowed.`;
    } else {
      emailInput.classList.remove("invalid");
      emailError.textContent = "";
    }
  });

  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const fullName = document.getElementById("fullName").value.trim();
    const email = emailInput.value.trim();
    const password = document.getElementById("password").value;
    const banner = document.getElementById("banner");
    const btn = document.getElementById("submitBtn");

    banner.style.display = "none";

    if (!isCollegeEmail(email)) {
      emailInput.classList.add("invalid");
      emailError.textContent = `Only @${ALLOWED_DOMAIN} emails are allowed.`;
      return;
    }

    btn.disabled = true;
    btn.textContent = "Creating account…";

    try {
      const fd = new FormData();
      fd.append("username", username);
      fd.append("fullName", fullName);
      fd.append("email", email);
      fd.append("password", password);
      const data = await apiRequest("/users/register", "POST", fd);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      showToast("Account created!");
      navigate("#/dashboard");
    } catch (err) {
      banner.textContent = err.message;
      banner.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Register";
    }
  });
}
async function renderDashboard() {
  app.innerHTML = `
    <div class="page-title">
      <h2>All videos</h2>
      <button class="primary" style="width:auto;" onclick="navigate('#/upload')">+ Upload</button>
    </div>
    <div id="videoArea" class="loading">Loading videos…</div>
  `;

  try {
    const result = await apiRequest("/videos?page=1&limit=20", "GET");
    let videos = [];
    if (Array.isArray(result)) {
      videos = result;
    } else if (result && Array.isArray(result.docs)) {
      videos = result.docs;
    } else if (result && Array.isArray(result.videos)) {
      videos = result.videos;
    } else if (result && Array.isArray(result.data)) {
      videos = result.data;
    }

    const area = document.getElementById("videoArea");

    if (!Array.isArray(videos) || videos.length === 0) {
      area.className = "empty";
      area.textContent = "No videos yet. Be the first to upload one!";
      return;
    }

    area.className = "video-grid";
    area.innerHTML = videos.map(v => `
      <div class="video-card" onclick="navigate('#/video/${v._id || v.id}')">
        <img src="${v.thumbnail || ''}" alt="">
        <div class="info">
          <h4>${escapeHtml(v.title || 'Untitled')}</h4>
          <p>${v.views || 0} views</p>
        </div>
      </div>
    `).join("");
  } catch (err) {
    document.getElementById("videoArea").className = "empty";
    document.getElementById("videoArea").textContent = err.message;
  }
}

function renderUpload() {
  app.innerHTML = `
    <div class="form-card">
      <h2>Upload a video</h2>
      <div class="banner" id="banner" style="display:none;"></div>
      <form id="uploadForm">
        <label>Title</label>
        <input type="text" id="title" required>
        <label>Description</label>
        <textarea id="description" rows="3" required></textarea>
        <label>Video file</label>
        <input type="file" id="videoFile" accept="video/*" required>
        <label>Thumbnail image</label>
        <input type="file" id="thumbnail" accept="image/*" required>
        <button class="primary" type="submit" id="submitBtn">Publish</button>
      </form>
    </div>
  `;

  document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const banner = document.getElementById("banner");
    const btn = document.getElementById("submitBtn");
    banner.style.display = "none";
    btn.disabled = true;
    btn.textContent = "Uploading…";

    try {
      const fd = new FormData();
      fd.append("title", document.getElementById("title").value.trim());
      fd.append("description", document.getElementById("description").value.trim());
      fd.append("videoFile", document.getElementById("videoFile").files[0]);
      fd.append("thumbnail", document.getElementById("thumbnail").files[0]);

      const res = await apiRequest("/videos", "POST", fd);
      const video = res?.video || res?.data || res;
      showToast("Video published!");
      navigate(`#/video/${video._id || video.id}`);
    } catch (err) {
      banner.textContent = err.message;
      banner.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Publish";
    }
  });
}

async function renderVideoDetail(id) {
  app.innerHTML = `<div class="loading">Loading video…</div>`;

  try {
    const res = await apiRequest(`/videos/${id}`, "GET");
    const v = res?.video || res?.data || res;
    const me = getUser();
    const isOwner = me && (v.owner === me._id || v.owner === me.id || (typeof v.owner === "object" && v.owner?._id === me._id));

    app.innerHTML = `
      <video class="video-player" src="${v.videoFile || ''}" controls poster="${v.thumbnail || ''}"></video>
      <h2>${escapeHtml(v.title || '')}</h2>
      <p>${escapeHtml(v.description || '')}</p>
      <p style="color:#888; font-size:0.85rem;">${v.views || 0} views</p>
      ${isOwner ? `
        <div class="detail-actions">
          <button onclick="navigate('#/edit/${v._id || v.id}')">Edit</button>
          <button class="danger" id="deleteBtn">Delete</button>
        </div>
      ` : ""}
    `;

    if (isOwner) {
      document.getElementById("deleteBtn").addEventListener("click", async () => {
        if (!confirm("Delete this video permanently?")) return;
        try {
          await apiRequest(`/videos/${v._id || v.id}`, "DELETE");
          showToast("Video deleted.");
          navigate("#/dashboard");
        } catch (err) {
          showToast(err.message, "err");
        }
      });
    }
  } catch (err) {
    app.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}

async function renderEdit(id) {
  app.innerHTML = `<div class="loading">Loading…</div>`;

  try {
    const res = await apiRequest(`/videos/${id}`, "GET");
    const v = res?.video || res?.data || res;

    app.innerHTML = `
      <div class="form-card">
        <h2>Edit video</h2>
        <div class="banner" id="banner" style="display:none;"></div>
        <form id="editForm">
          <label>Title</label>
          <input type="text" id="title" value="${escapeHtml(v.title || '')}" required>
          <label>Description</label>
          <textarea id="description" rows="3" required>${escapeHtml(v.description || '')}</textarea>
          <label>Replace thumbnail (optional)</label>
          <input type="file" id="thumbnail" accept="image/*">
          <button class="primary" type="submit" id="submitBtn">Save changes</button>
        </form>
      </div>
    `;

    document.getElementById("editForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const banner = document.getElementById("banner");
      const btn = document.getElementById("submitBtn");
      banner.style.display = "none";
      btn.disabled = true;
      btn.textContent = "Saving…";

      try {
        const fd = new FormData();
        fd.append("title", document.getElementById("title").value.trim());
        fd.append("description", document.getElementById("description").value.trim());
        const thumb = document.getElementById("thumbnail").files[0];
        if (thumb) fd.append("thumbnail", thumb);

        await apiRequest(`/videos/${v._id || v.id}`, "PATCH", fd);
        showToast("Video updated.");
        navigate(`#/video/${v._id || v.id}`);
      } catch (err) {
        banner.textContent = err.message;
        banner.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Save changes";
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
  }
}
