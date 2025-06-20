function loadTasks() {
  ['todo', 'putz'].forEach(type => {
    const tasks = JSON.parse(localStorage.getItem(type + 'Tasks') || '[]');
    renderList(type, tasks);
  });
  updateCalendar();
  checkNotifications();
}

function addTask(type) {
  const input = document.getElementById(type + 'Input');
  const reminder = document.getElementById(type + 'Reminder').value;
  const repeat = document.getElementById(type + 'Repeat').value;
  const text = input.value.trim();
  if (!text) return;
  const tasks = JSON.parse(localStorage.getItem(type + 'Tasks') || '[]');
  tasks.push({ text, reminder, repeat });
  localStorage.setItem(type + 'Tasks', JSON.stringify(tasks));
  input.value = '';
  document.getElementById(type + 'Reminder').value = '';
  document.getElementById(type + 'Repeat').value = '';
  renderList(type, tasks);
  updateCalendar();
}

function removeTask(type, index) {
  const tasks = JSON.parse(localStorage.getItem(type + 'Tasks') || '[]');
  tasks.splice(index, 1);
  localStorage.setItem(type + 'Tasks', JSON.stringify(tasks));
  renderList(type, tasks);
  updateCalendar();
}

function renderList(type, tasks) {
  const list = document.getElementById(type + 'List');
  list.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.innerHTML = `${task.text} <small>${task.reminder ? new Date(task.reminder).toLocaleString() : ''} ${task.repeat ? '[' + task.repeat + ']' : ''}</small>`;
    const btn = document.createElement('button');
    btn.textContent = 'Entfernen';
    btn.className = 'remove-btn';
    btn.onclick = () => removeTask(type, index);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function updateCalendar() {
  const calendarList = document.getElementById('calendarList');
  calendarList.innerHTML = '';
  const allTasks = ['todo', 'putz'].flatMap(type => {
    const tasks = JSON.parse(localStorage.getItem(type + 'Tasks') || '[]');
    return tasks.filter(t => t.reminder).map(t => ({ ...t, type }));
  });
  allTasks.sort((a, b) => new Date(a.reminder) - new Date(b.reminder));
  allTasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${new Date(task.reminder).toLocaleString()}: ${task.text} [${task.type}]`;
    calendarList.appendChild(li);
  });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

function exportData() {
  const data = {
    todo: JSON.parse(localStorage.getItem('todoTasks') || '[]'),
    putz: JSON.parse(localStorage.getItem('putzTasks') || '[]')
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mein_alltag_export.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.todo) localStorage.setItem('todoTasks', JSON.stringify(data.todo));
      if (data.putz) localStorage.setItem('putzTasks', JSON.stringify(data.putz));
      loadTasks();
    } catch (err) {
      alert('Fehler beim Import: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function checkNotifications() {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  } else {
    const now = new Date();
    ['todo', 'putz'].forEach(type => {
      const tasks = JSON.parse(localStorage.getItem(type + 'Tasks') || '[]');
      tasks.forEach(task => {
        if (task.reminder) {
          const reminderTime = new Date(task.reminder);
          const timeDiff = reminderTime - now;
          if (timeDiff > 0 && timeDiff < 60000) {
            new Notification(`Erinnerung (${type}):`, { body: task.text });
            if (task.repeat === 'daily') {
              reminderTime.setDate(reminderTime.getDate() + 1);
              task.reminder = reminderTime.toISOString();
            } else if (task.repeat === 'weekly') {
              reminderTime.setDate(reminderTime.getDate() + 7);
              task.reminder = reminderTime.toISOString();
            }
          }
        }
      });
      localStorage.setItem(type + 'Tasks', JSON.stringify(tasks));
    });
  }
}

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

loadTasks();
setInterval(checkNotifications, 60000);
