import { PROGRAM, getProgramDay, getScheduledDay } from "./program.js";
import {
  saveSession,
  getAllSessions,
  setSetting,
  getSetting,
  deleteSetting,
  exportBackup,
  importBackup,
  clearAllData
} from "./storage.js";

const app = document.querySelector("#app");
const title = document.querySelector("#screen-title");
const installDialog = document.querySelector("#install-dialog");
const confirmDialog = document.querySelector("#confirm-dialog");
const confirmTitle = document.querySelector("#confirm-title");
const confirmMessage = document.querySelector("#confirm-message");
const confirmAction = document.querySelector("#confirm-action");

let currentView = "today";
let selectedDayId = getScheduledDay().id;
let activeSession = null;
let timerTicker = null;

const TIMER_KEY = "sabertooth-personal-timer-end";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

function getTimerEnd() {
  return Number(localStorage.getItem(TIMER_KEY) || 0);
}

function setTimerEnd(timestamp) {
  if (timestamp > Date.now()) localStorage.setItem(TIMER_KEY, String(timestamp));
  else localStorage.removeItem(TIMER_KEY);
}

function startRestTimer(seconds) {
  if (!seconds) return;
  setTimerEnd(Date.now() + seconds * 1000);
  renderTimerOnly();
  ensureTimerTicker();
}

function adjustTimer(seconds) {
  const existing = Math.max(Date.now(), getTimerEnd());
  setTimerEnd(existing + seconds * 1000);
  renderTimerOnly();
}

function cancelTimer() {
  localStorage.removeItem(TIMER_KEY);
  renderTimerOnly();
}

function ensureTimerTicker() {
  if (timerTicker) return;
  timerTicker = window.setInterval(() => {
    const timer = document.querySelector("#rest-timer");
    if (!timer) {
      if (getTimerEnd() <= Date.now()) localStorage.removeItem(TIMER_KEY);
      return;
    }
    const remaining = Math.ceil((getTimerEnd() - Date.now()) / 1000);
    if (remaining <= 0) {
      localStorage.removeItem(TIMER_KEY);
      timer.remove();
      if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
      return;
    }
    const timeNode = timer.querySelector(".timer-time");
    if (timeNode) timeNode.textContent = formatDuration(remaining);
  }, 250);
}

function timerMarkup() {
  const remaining = Math.ceil((getTimerEnd() - Date.now()) / 1000);
  if (remaining <= 0) return "";
  return `
    <div id="rest-timer" class="timer-bar">
      <div><div class="small muted">REST</div><div class="timer-time">${formatDuration(remaining)}</div></div>
      <div class="timer-actions">
        <button type="button" data-action="timer-minus">−15</button>
        <button type="button" data-action="timer-plus">+30</button>
        <button type="button" data-action="timer-cancel">Skip</button>
      </div>
    </div>`;
}

function renderTimerOnly() {
  const old = document.querySelector("#rest-timer");
  if (old) old.remove();
  if (currentView !== "today" || !activeSession) return;
  const footer = document.querySelector("#workout-actions");
  if (footer) footer.insertAdjacentHTML("beforebegin", timerMarkup());
}

function sessionFromDay(day) {
  const logs = {};
  for (const exercise of day.exercises) {
    logs[exercise.id] = Array.from({ length: exercise.sets }, () => ({
      reps: exercise.defaultReps ?? "",
      weight: exercise.defaultWeight ?? "",
      rpe: "",
      seconds: exercise.defaultSeconds ?? "",
      distance: exercise.defaultDistance ?? "",
      done: false
    }));
  }
  return {
    id: uid(),
    dayId: day.id,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    logs
  };
}

async function persistActiveSession() {
  if (activeSession) await setSetting("activeSession", activeSession);
}

function setCompletionStats(session) {
  const day = getProgramDay(session.dayId);
  let total = 0;
  let complete = 0;
  day.exercises.forEach((exercise) => {
    const sets = session.logs[exercise.id] || [];
    total += sets.length;
    complete += sets.filter((set) => set.done).length;
  });
  return { total, complete, percent: total ? Math.round((complete / total) * 100) : 0 };
}

function fieldMarkup(label, field, value, exercise, setIndex, extraClass = "") {
  return `
    <div class="field ${extraClass}">
      <label>${label}</label>
      <input inputmode="decimal" type="number" step="0.5" value="${value ?? ""}" data-exercise="${exercise.id}" data-set="${setIndex}" data-field="${field}" />
    </div>`;
}

function setRowMarkup(exercise, set, setIndex) {
  const done = set.done ? "is-done" : "";
  const check = set.done ? "✓" : "○";

  if (exercise.kind === "weighted") {
    return `
      <div class="set-row">
        <div class="set-index">${setIndex + 1}</div>
        ${fieldMarkup("lb", "weight", set.weight, exercise, setIndex)}
        ${fieldMarkup("reps", "reps", set.reps, exercise, setIndex)}
        ${fieldMarkup("RPE", "rpe", set.rpe, exercise, setIndex, "rpe-field")}
        <button class="done-toggle ${done}" type="button" data-action="toggle-set" data-exercise="${exercise.id}" data-set="${setIndex}" aria-label="Mark set complete">${check}</button>
      </div>`;
  }

  if (exercise.kind === "distance") {
    return `
      <div class="set-row simple">
        <div class="set-index">${setIndex + 1}</div>
        ${fieldMarkup("meters", "distance", set.distance, exercise, setIndex)}
        <button class="done-toggle ${done}" type="button" data-action="toggle-set" data-exercise="${exercise.id}" data-set="${setIndex}" aria-label="Mark set complete">${check}</button>
      </div>`;
  }

  if (exercise.kind === "time") {
    return `
      <div class="set-row simple">
        <div class="set-index">${setIndex + 1}</div>
        ${fieldMarkup("seconds", "seconds", set.seconds, exercise, setIndex)}
        <button class="done-toggle ${done}" type="button" data-action="toggle-set" data-exercise="${exercise.id}" data-set="${setIndex}" aria-label="Mark set complete">${check}</button>
      </div>`;
  }

  return `
    <div class="set-row simple">
      <div class="set-index">${setIndex + 1}</div>
      ${fieldMarkup("reps", "reps", set.reps, exercise, setIndex)}
      <button class="done-toggle ${done}" type="button" data-action="toggle-set" data-exercise="${exercise.id}" data-set="${setIndex}" aria-label="Mark set complete">${check}</button>
    </div>`;
}

function exerciseCardMarkup(exercise, session) {
  const sets = session.logs[exercise.id] || [];
  const allDone = sets.length > 0 && sets.every((set) => set.done);
  return `
    <article class="card exercise-card" id="exercise-${exercise.id}">
      <div class="exercise-head">
        <div>
          <div class="exercise-name">${allDone ? "✓ " : ""}${exercise.name}</div>
          <div class="exercise-target">${exercise.sets} set${exercise.sets > 1 ? "s" : ""} · ${exercise.target}${exercise.perSide ? " · per side" : ""}</div>
        </div>
        <span class="tag">${exercise.section}</span>
      </div>
      ${sets.map((set, index) => setRowMarkup(exercise, set, index)).join("")}
      ${exercise.progression ? `<p class="cue">${exercise.progression}</p>` : ""}
      ${exercise.techniqueUrl ? `<div class="exercise-footer"><a class="link-button" href="${exercise.techniqueUrl}" target="_blank" rel="noreferrer">Technique ↗</a><span class="small muted">Rest ${exercise.restSec ? `${exercise.restSec}s` : "as needed"}</span></div>` : exercise.restSec ? `<div class="exercise-footer"><span></span><span class="small muted">Rest ${exercise.restSec}s</span></div>` : ""}
    </article>`;
}

function groupExercises(day) {
  const groups = [];
  for (const exercise of day.exercises) {
    let group = groups.find((row) => row.section === exercise.section);
    if (!group) {
      group = { section: exercise.section, exercises: [] };
      groups.push(group);
    }
    group.exercises.push(exercise);
  }
  return groups;
}

function dayOptions(selected) {
  return PROGRAM.map((day) => `<option value="${day.id}" ${day.id === selected ? "selected" : ""}>${day.name}</option>`).join("");
}

async function renderToday() {
  title.textContent = "Today";
  const day = activeSession ? getProgramDay(activeSession.dayId) : getProgramDay(selectedDayId);

  if (!activeSession) {
    app.innerHTML = `
      <section class="card hero-card">
        <div class="eyebrow">READY WHEN YOU ARE</div>
        <h2>${day.name}</h2>
        <p class="muted">${day.subtitle}</p>
        <select id="day-selector" class="day-selector" aria-label="Choose workout day">${dayOptions(day.id)}</select>
        <button class="primary-button full-width" type="button" data-action="start-workout">Start workout</button>
      </section>
      <section class="card">
        <h3>What’s included</h3>
        ${groupExercises(day).map((group) => `<p><strong>${group.section}</strong><br><span class="muted small">${group.exercises.map((exercise) => exercise.name).join(" · ")}</span></p>`).join("")}
      </section>`;
    return;
  }

  const stats = setCompletionStats(activeSession);
  app.innerHTML = `
    <section class="card hero-card">
      <div class="eyebrow">WORKOUT IN PROGRESS</div>
      <h2>${day.name}</h2>
      <p class="muted">Started ${formatTime(activeSession.startedAt)} · <span id="set-progress-text">${stats.complete}/${stats.total} sets done</span></p>
      <progress id="set-progress" value="${stats.complete}" max="${stats.total}"></progress>
    </section>
    ${groupExercises(day).map((group) => `
      <div class="section-title"><strong>${group.section}</strong><span>${group.exercises.length} exercise${group.exercises.length > 1 ? "s" : ""}</span></div>
      ${group.exercises.map((exercise) => exerciseCardMarkup(exercise, activeSession)).join("")}
    `).join("")}
    ${timerMarkup()}
    <section id="workout-actions" class="card">
      <div class="button-row">
        <button class="secondary-button" type="button" data-action="discard-workout">Discard</button>
        <button class="primary-button" type="button" data-action="finish-workout">Finish workout</button>
      </div>
    </section>`;
  ensureTimerTicker();
}

function renderProgram() {
  title.textContent = "Program";
  app.innerHTML = `
    <section class="card hero-card">
      <div class="eyebrow">4 DAYS · ~45 MINUTES</div>
      <h2>Strength + mobility + agility</h2>
      <p class="muted">Monday · Tuesday · Thursday · Saturday</p>
    </section>
    ${PROGRAM.map((day) => `
      <section class="card">
        <h2>${day.name}</h2>
        <p class="muted">${day.subtitle}</p>
        ${groupExercises(day).map((group) => `<p><strong>${group.section}</strong><br><span class="small muted">${group.exercises.map((exercise) => `${exercise.name} (${exercise.sets}×${exercise.target})`).join(" · ")}</span></p>`).join("")}
        <button class="secondary-button full-width" type="button" data-action="choose-day" data-day="${day.id}">Open in Today</button>
      </section>`).join("")}`;
}

async function renderHistory() {
  title.textContent = "History";
  const sessions = (await getAllSessions()).filter((session) => session.finishedAt);
  if (!sessions.length) {
    app.innerHTML = `<section class="card empty"><h2>No completed workouts yet</h2><p>Finish your first workout and it will appear here.</p></section>`;
    return;
  }

  app.innerHTML = `
    <section class="card">
      ${sessions.map((session) => {
        const day = getProgramDay(session.dayId);
        const stats = setCompletionStats(session);
        return `<div class="history-row"><div><strong>${day.name}</strong><div class="small muted">${formatDate(session.startedAt)} · ${formatTime(session.startedAt)}</div></div><div class="small">${stats.complete}/${stats.total} sets</div></div>`;
      }).join("")}
    </section>`;
}

function bestWeightForExercise(sessions, exerciseId) {
  let best = null;
  for (const session of sessions) {
    const sets = session.logs?.[exerciseId] || [];
    for (const set of sets) {
      const weight = Number(set.weight);
      if (set.done && Number.isFinite(weight) && (best === null || weight > best)) best = weight;
    }
  }
  return best;
}

async function renderProgress() {
  title.textContent = "Progress";
  const sessions = (await getAllSessions()).filter((session) => session.finishedAt);
  const completed = sessions.length;
  const last30 = sessions.filter((session) => Date.now() - new Date(session.startedAt).getTime() <= 30 * 86400000).length;
  const lifts = [
    ["Back squat", "back-squat"],
    ["Bench press", "bench"],
    ["Deadlift", "deadlift"],
    ["KB overhead press", "sa-kb-ohp"]
  ];

  app.innerHTML = `
    <section class="stat-grid">
      <div class="stat"><strong>${completed}</strong><span class="small muted">Completed workouts</span></div>
      <div class="stat"><strong>${last30}</strong><span class="small muted">Last 30 days</span></div>
    </section>
    <div class="section-title"><strong>Best logged loads</strong><span>completed sets</span></div>
    <section class="card">
      ${lifts.map(([name, id]) => {
        const best = bestWeightForExercise(sessions, id);
        return `<div class="history-row"><span>${name}</span><strong>${best === null ? "—" : `${best} lb`}</strong></div>`;
      }).join("")}
    </section>
    <section class="card">
      <h3>Progression rule</h3>
      <p class="small muted">Weeks 1–3 learn/build around RPE 6–7. Week 4 deload. Weeks 5–7 build mostly RPE 7–8. Week 8 deload. Weeks 9–11 progress without training to failure. Week 12 reduce accessories and establish a smooth new baseline.</p>
    </section>`;
}

function renderSettings() {
  title.textContent = "Settings";
  app.innerHTML = `
    <section class="card">
      <h2>Local-first data</h2>
      <p class="small muted">Workout data is stored in this browser on this device. No Sabertooth account, subscription, analytics service, or hosted workout database is required.</p>
      <div class="setting-row">
        <strong>Export backup</strong>
        <span class="small muted">Save a JSON backup to Files or iCloud Drive.</span>
        <button class="secondary-button" type="button" data-action="export-backup">Export JSON</button>
      </div>
      <div class="setting-row">
        <strong>Restore backup</strong>
        <span class="small muted">Import a Sabertooth Personal backup. Existing sessions with matching IDs will be replaced.</span>
        <input id="backup-file" class="file-input" type="file" accept="application/json,.json" />
      </div>
      ${activeSession ? `<div class="setting-row"><strong>Active workout</strong><span class="small muted">${getProgramDay(activeSession.dayId).name} started ${formatTime(activeSession.startedAt)}</span><button class="secondary-button" type="button" data-action="resume-workout">Resume</button></div>` : ""}
      <div class="setting-row">
        <strong>Reset local data</strong>
        <span class="small muted">Deletes workout history and settings from this browser.</span>
        <button class="danger-button" type="button" data-action="reset-data">Reset everything</button>
      </div>
    </section>
    <section class="card"><h3>Install</h3><p class="small muted">On iPhone: Safari → Share → Add to Home Screen. The base workout app is designed to work offline after its first successful load.</p></section>`;
}

async function render() {
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === currentView));
  if (currentView === "today") return renderToday();
  if (currentView === "program") return renderProgram();
  if (currentView === "history") return renderHistory();
  if (currentView === "progress") return renderProgress();
  if (currentView === "settings") return renderSettings();
}

async function askConfirm(heading, message, actionText = "Confirm") {
  if (!confirmDialog || typeof confirmDialog.showModal !== "function") return window.confirm(message);
  confirmTitle.textContent = heading;
  confirmMessage.textContent = message;
  confirmAction.textContent = actionText;
  confirmDialog.showModal();
  return new Promise((resolve) => {
    const onClose = () => {
      confirmDialog.removeEventListener("close", onClose);
      resolve(confirmDialog.returnValue === "confirm");
    };
    confirmDialog.addEventListener("close", onClose);
  });
}

async function handleAction(action, element) {
  if (action === "start-workout") {
    activeSession = sessionFromDay(getProgramDay(selectedDayId));
    await persistActiveSession();
    return render();
  }

  if (action === "toggle-set") {
    if (!activeSession) return;
    const exerciseId = element.dataset.exercise;
    const setIndex = Number(element.dataset.set);
    const exercise = getProgramDay(activeSession.dayId).exercises.find((item) => item.id === exerciseId);
    const set = activeSession.logs[exerciseId]?.[setIndex];
    if (!exercise || !set) return;
    set.done = !set.done;
    await persistActiveSession();
    if (set.done && exercise.restSec) startRestTimer(exercise.restSec);
    const card = document.querySelector(`#exercise-${exerciseId}`);
    if (card) card.outerHTML = exerciseCardMarkup(exercise, activeSession);
    const stats = setCompletionStats(activeSession);
    const progress = document.querySelector("#set-progress");
    const progressText = document.querySelector("#set-progress-text");
    if (progress) progress.value = stats.complete;
    if (progressText) progressText.textContent = `${stats.complete}/${stats.total} sets done`;
    return;
  }

  if (action === "finish-workout") {
    if (!activeSession) return;
    const stats = setCompletionStats(activeSession);
    const ok = await askConfirm("Finish workout?", `${stats.complete} of ${stats.total} sets are marked complete. Save this workout to history?`, "Finish");
    if (!ok) return;
    activeSession.finishedAt = new Date().toISOString();
    await saveSession(activeSession);
    await deleteSetting("activeSession");
    activeSession = null;
    cancelTimer();
    currentView = "history";
    return render();
  }

  if (action === "discard-workout") {
    const ok = await askConfirm("Discard workout?", "This removes the current in-progress workout. Completed workout history is unaffected.", "Discard");
    if (!ok) return;
    activeSession = null;
    await deleteSetting("activeSession");
    cancelTimer();
    return render();
  }

  if (action === "timer-plus") return adjustTimer(30);
  if (action === "timer-minus") return adjustTimer(-15);
  if (action === "timer-cancel") return cancelTimer();

  if (action === "choose-day") {
    selectedDayId = element.dataset.day;
    await setSetting("selectedDayId", selectedDayId);
    currentView = "today";
    return render();
  }

  if (action === "resume-workout") {
    currentView = "today";
    return render();
  }

  if (action === "export-backup") {
    const payload = await exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sabertooth-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  if (action === "reset-data") {
    const ok = await askConfirm("Reset Sabertooth?", "This permanently deletes all Sabertooth Personal workout history and settings stored in this browser.", "Reset");
    if (!ok) return;
    await clearAllData();
    localStorage.removeItem(TIMER_KEY);
    activeSession = null;
    selectedDayId = getScheduledDay().id;
    currentView = "today";
    return render();
  }
}

async function handleAppChange(target) {
  if (target.matches("input[data-field]")) {
    if (!activeSession) return;
    const { exercise, set, field } = target.dataset;
    const log = activeSession.logs[exercise]?.[Number(set)];
    if (!log) return;
    log[field] = target.value === "" ? "" : Number(target.value);
    await persistActiveSession();
    return;
  }

  if (target.id === "day-selector") {
    selectedDayId = target.value;
    await setSetting("selectedDayId", selectedDayId);
    return render();
  }

  if (target.id === "backup-file") {
    const file = target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      await importBackup(payload);
      activeSession = await getSetting("activeSession");
      selectedDayId = await getSetting("selectedDayId", getScheduledDay().id);
      window.alert("Backup restored.");
      return render();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not restore backup.");
    }
  }
}

async function init() {
  selectedDayId = await getSetting("selectedDayId", getScheduledDay().id);
  activeSession = await getSetting("activeSession");

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.view;
      render();
    });
  });

  app.addEventListener("click", (event) => {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement || !app.contains(actionElement)) return;
    handleAction(actionElement.dataset.action, actionElement).catch((error) => {
      console.error(error);
      window.alert("Sabertooth could not save that change. Please try again.");
    });
  });

  app.addEventListener("change", (event) => {
    handleAppChange(event.target).catch((error) => {
      console.error(error);
      window.alert("Sabertooth could not save that change. Please try again.");
    });
  });

  document.querySelector("#install-help")?.addEventListener("click", () => {
    if (installDialog && typeof installDialog.showModal === "function") installDialog.showModal();
    else window.alert("On iPhone: Safari → Share → Add to Home Screen.");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }

  ensureTimerTicker();
  await render();
}

init().catch((error) => {
  console.error(error);
  app.innerHTML = `<section class="card"><h2>Sabertooth could not start</h2><p class="muted">${error instanceof Error ? error.message : "Unknown error"}</p></section>`;
});
