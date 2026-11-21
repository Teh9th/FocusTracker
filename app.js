// Storage keys
const THEME_KEY = 'focus-tracker-theme';
const TASKS_KEY = 'focus-tracker-tasks';
const FOCUS_SECONDS = 25 * 60;

// DOM elements
const themeButtons = document.querySelectorAll('.theme-btn');
const timerDisplay = document.getElementById('timer-display');
const timerToggleBtn = document.getElementById('timer-toggle');
const timerResetBtn = document.getElementById('timer-reset');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const filterButtons = document.querySelectorAll('.filter-btn');

// App state
let remainingSeconds = FOCUS_SECONDS;
let timerInterval = null;
let currentFilter = 'all';
let tasks = loadTasks();

// --- Theme Switcher (System / Light / Dark) ---

function applyTheme(choice) {
  const validChoice = ['system', 'light', 'dark'].includes(choice) ? choice : 'system';
  document.documentElement.dataset.theme = validChoice;
  localStorage.setItem(THEME_KEY, validChoice);

  themeButtons.forEach((btn) => {
    const isActive = btn.dataset.themeChoice === validChoice;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

themeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    applyTheme(btn.dataset.themeChoice);
  });
});

// --- Focus Timer ---

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const formatted = formatTime(remainingSeconds);
  timerDisplay.textContent = formatted;
  document.title = timerInterval
    ? `${formatted} — Focus & Task Tracker`
    : 'Focus & Task Tracker';
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function toggleTimer() {
  if (timerInterval) {
    stopTimer();
    timerToggleBtn.textContent = 'Resume';
    updateTimerDisplay();
    return;
  }

  if (remainingSeconds === 0) {
    remainingSeconds = FOCUS_SECONDS;
  }

  timerToggleBtn.textContent = 'Pause';
  timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      stopTimer();
      timerToggleBtn.textContent = 'Start Focus';
      updateTimerDisplay();
    }
  }, 1000);

  updateTimerDisplay();
}

function resetTimer() {
  stopTimer();
  remainingSeconds = FOCUS_SECONDS;
  timerToggleBtn.textContent = 'Start Focus';
  updateTimerDisplay();
}

timerToggleBtn.addEventListener('click', toggleTimer);
timerResetBtn.addEventListener('click', resetTimer);

// --- Task List & Persistence ---

function loadTasks() {
  try {
    const saved = localStorage.getItem(TASKS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function getFilteredTasks() {
  if (currentFilter === 'active') return tasks.filter((t) => !t.completed);
  if (currentFilter === 'completed') return tasks.filter((t) => t.completed);
  return tasks;
}

function renderTasks() {
  const activeCount = tasks.filter((t) => !t.completed).length;
  taskCount.textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'} remaining`;

  taskList.innerHTML = '';
  const visibleTasks = getFilteredTasks();

  if (visibleTasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = tasks.length === 0
      ? 'No tasks yet. Add one above to get started.'
      : 'No tasks in this view.';
    taskList.appendChild(empty);
    return;
  }

  visibleTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' completed' : ''}`;

    const label = document.createElement('label');
    label.className = 'task-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    label.append(checkbox, text);
    item.append(label, deleteBtn);
    taskList.appendChild(item);
  });
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  tasks.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    text: trimmed,
    completed: false,
  });

  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = '';
  taskInput.focus();
});

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
    renderTasks();
  });
});

// --- Initialize App ---
applyTheme(localStorage.getItem(THEME_KEY) || 'system');
updateTimerDisplay();
renderTasks();
