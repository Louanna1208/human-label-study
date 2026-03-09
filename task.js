// Fill this with your deployed Google Apps Script Web App URL, e.g.
// https://script.google.com/macros/s/XXXXXXXXXXXX/exec
const SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE";

let articles = [];
let currentIndex = 0;
let participantId = localStorage.getItem("participant_id") || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
localStorage.setItem("participant_id", participantId);

let responses = JSON.parse(localStorage.getItem("responses") || "[]");

const statusEl = document.getElementById("status");
const studyEl = document.getElementById("study");
const doneEl = document.getElementById("done");
const progressEl = document.getElementById("progress");
const titleEl = document.getElementById("title");
const abstractEl = document.getElementById("abstract");
const model1El = document.getElementById("model1");
const model2El = document.getElementById("model2");
const formEl = document.getElementById("labelForm");
const saveBtn = document.getElementById("saveBtn");

function renderArticle() {
  if (!articles || articles.length === 0) {
    statusEl.textContent = "No articles found in articles.json.";
    statusEl.classList.remove("hidden");
    studyEl.classList.add("hidden");
    return;
  }

  if (currentIndex >= articles.length) {
    studyEl.classList.add("hidden");
    doneEl.classList.remove("hidden");
    return;
  }

  const item = articles[currentIndex];
  progressEl.textContent = `Progress: ${currentIndex + 1} / ${articles.length}`;
  titleEl.textContent = item.title || "";
  abstractEl.textContent = item.abstract || "";
  model1El.textContent = item.model1_summary || "";
  model2El.textContent = item.model2_summary || "";

  document.getElementById("better_summary").value = "";
  document.getElementById("confidence").value = "";
  document.getElementById("notes").value = "";
}

async function loadArticles() {
  try {
    const res = await fetch("articles.json", { cache: "no-cache" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    articles = await res.json();

    currentIndex = responses.length;

    statusEl.classList.add("hidden");
    studyEl.classList.remove("hidden");
    renderArticle();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load articles.json";
  }
}

function saveLocal() {
  localStorage.setItem("responses", JSON.stringify(responses));
}

async function submitResponse(payload) {
  if (!SCRIPT_URL || SCRIPT_URL.startsWith("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE")) {
    console.warn("SCRIPT_URL is not configured. Skipping remote submission.");
    return "local-only";
  }

  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  return res.text();
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (currentIndex >= articles.length) {
    return;
  }

  const item = articles[currentIndex];
  const payload = {
    participant_id: participantId,
    timestamp: new Date().toISOString(),
    paper_id: item.paper_id || "",
    title: item.title || "",
    better_summary: document.getElementById("better_summary").value,
    confidence: document.getElementById("confidence").value,
    notes: document.getElementById("notes").value || ""
  };

  if (!payload.better_summary || !payload.confidence) {
    alert("Please choose better summary and confidence.");
    return;
  }

  try {
    await submitResponse(payload);
    responses.push(payload);
    saveLocal();
    currentIndex += 1;
    renderArticle();
  } catch (err) {
    alert("Submission failed. Your progress is still saved locally.");
    console.error(err);
  }
});

saveBtn.addEventListener("click", () => {
  saveLocal();
  alert("Progress saved locally.");
});

loadArticles().catch(err => {
  statusEl.textContent = "Failed to load articles.json";
  console.error(err);
});

