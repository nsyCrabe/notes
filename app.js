const DB_NAME = "notes-pwa";
const STORE = "notes";
let db;
let currentId = null;
let saveTimeout = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function tx(mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function getAllNotes() {
  return new Promise((resolve) => {
    const req = tx("readonly").getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.updatedAt - a.updatedAt));
  });
}

function saveNote(note) {
  return new Promise((resolve) => {
    const req = tx("readwrite").put(note);
    req.onsuccess = () => resolve();
  });
}

function deleteNoteDB(id) {
  return new Promise((resolve) => {
    const req = tx("readwrite").delete(id);
    req.onsuccess = () => resolve();
  });
}

const notesList = document.getElementById("notesList");
const searchInput = document.getElementById("searchInput");
const newNoteBtn = document.getElementById("newNoteBtn");
const emptyState = document.getElementById("emptyState");
const editorView = document.getElementById("editorView");
const noteTitle = document.getElementById("noteTitle");
const noteBody = document.getElementById("noteBody");
const saveStatus = document.getElementById("saveStatus");
const deleteBtn = document.getElementById("deleteBtn");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

async function renderList(filter = "") {
  const notes = await getAllNotes();
  const filtered = filter
    ? notes.filter(n =>
        (n.title || "").toLowerCase().includes(filter.toLowerCase()) ||
        (n.body || "").toLowerCase().includes(filter.toLowerCase()))
    : notes;

  notesList.innerHTML = "";

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-list";
    li.textContent = filter ? "Aucun résultat" : "Aucune note pour l'instant";
    notesList.appendChild(li);
    return;
  }

  for (const note of filtered) {
    const li = document.createElement("li");
    li.className = "note-item" + (note.id === currentId ? " active" : "");
    li.innerHTML = `
      <div class="note-title">${escapeHtml(note.title || "Sans titre")}</div>
      <div class="note-preview">${escapeHtml((note.body || "").slice(0, 60))}</div>
      <span class="note-date">${formatDate(note.updatedAt)}</span>
    `;
    li.addEventListener("click", () => openNote(note.id));
    notesList.appendChild(li);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function openNote(id) {
  const notes = await getAllNotes();
  const note = notes.find(n => n.id === id);
  if (!note) return;
  currentId = id;
  noteTitle.value = note.title || "";
  noteBody.value = note.body || "";
  emptyState.classList.add("hidden");
  editorView.classList.remove("hidden");
  saveStatus.textContent = "";
  renderList(searchInput.value);
  closeSidebarOnMobile();
  noteTitle.focus();
}

async function createNote() {
  const id = crypto.randomUUID();
  const note = { id, title: "", body: "", createdAt: Date.now(), updatedAt: Date.now() };
  await saveNote(note);
  await renderList(searchInput.value);
  openNote(id);
}

function scheduleSave() {
  clearTimeout(saveTimeout);
  saveStatus.textContent = "Enregistrement...";
  saveTimeout = setTimeout(async () => {
    if (!currentId) return;
    const notes = await getAllNotes();
    const note = notes.find(n => n.id === currentId);
    if (!note) return;
    note.title = noteTitle.value;
    note.body = noteBody.value;
    note.updatedAt = Date.now();
    await saveNote(note);
    saveStatus.textContent = "Enregistré ✓";
    renderList(searchInput.value);
  }, 400);
}

async function deleteCurrentNote() {
  if (!currentId) return;
  if (!confirm("Supprimer cette note ?")) return;
  await deleteNoteDB(currentId);
  currentId = null;
  editorView.classList.add("hidden");
  emptyState.classList.remove("hidden");
  renderList(searchInput.value);
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 760) sidebar.classList.remove("open");
}

newNoteBtn.addEventListener("click", createNote);
noteTitle.addEventListener("input", scheduleSave);
noteBody.addEventListener("input", scheduleSave);
deleteBtn.addEventListener("click", deleteCurrentNote);
searchInput.addEventListener("input", (e) => renderList(e.target.value));
menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    createNote();
  }
});

(async function init() {
  db = await openDB();
  await renderList();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
})();
