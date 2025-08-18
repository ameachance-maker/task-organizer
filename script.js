// Initialisation EmailJS
document.addEventListener('DOMContentLoaded', () => {
  emailjs.init("user_xxxxxxxxxxxxx"); // Remplace par ton vrai USER ID EmailJS

  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      console.log("Permission de notification :", permission);
    });
  }

  showDailySuggestions();
  loadTasks();
  updateStats();
});

// Sélection des éléments
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const taskDate = document.getElementById('task-date');
const taskTime = document.getElementById('task-time');
const addTaskBtn = document.getElementById('add-task-btn');
const tasksList = document.getElementById('tasks');
const exportBtn = document.getElementById('export-pdf-btn');
const suggestionsList = document.getElementById('daily-suggestions');
const voiceBtn = document.getElementById('voice-btn');
const statsOutput = document.getElementById('stats-output');

// Suggestions selon le jour
const suggestions = {
  0: ['Préparer le repas', 'Appeler la famille'],
  1: ['Planifier la semaine', 'Faire les courses'],
  2: ['Répondre aux emails', 'Faire du sport'],
  3: ['Organiser le bureau', 'Lire un article'],
  4: ['Faire le ménage', 'Préparer le week-end'],
  5: ['Sortir avec des amis', 'Faire une pause'],
  6: ['Recharger les batteries', 'Faire une promenade']
};

function showDailySuggestions() {
  const today = new Date().getDay();
  suggestionsList.innerHTML = '';
  suggestions[today].forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    suggestionsList.appendChild(li);
  });
}

// Création d’une tâche
function createTaskElement(taskText, priority, date, time) {
  const li = document.createElement('li');
  li.setAttribute('data-priority', priority);

  const span = document.createElement('span');
  span.textContent = `${taskText} (${priority}) - 📅 ${date} 🕒 ${time}`;

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.classList.add('delete-btn');
  deleteBtn.addEventListener('click', () => {
    li.remove();
    refreshAll();
  });

  li.appendChild(span);
  li.appendChild(deleteBtn);
  return li;
}

// Notification locale immédiate
function notifyTask(taskText) {
  if (Notification.permission === 'granted') {
    new Notification('Nouvelle tâche ajoutée', {
      body: taskText,
      icon: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png'
    });
  }
}

// Notification programmée
function scheduleReminder(taskText, date, time) {
  const now = new Date();
  const reminderTime = new Date(`${date}T${time}`);
  const delay = reminderTime.getTime() - now.getTime();

  if (delay > 0) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('⏰ Rappel de tâche', {
          body: `${taskText} - prévu à ${time} le ${date}`,
          icon: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png'
        });
      }
    }, delay);
  }
}

// Sauvegarde dans localStorage
function saveTasks() {
  const tasks = [];
  document.querySelectorAll('#tasks li').forEach(li => {
    const text = li.querySelector('span').textContent;
    const priority = li.getAttribute('data-priority');
    tasks.push({ text, priority });
  });
  localStorage.setItem('weeklyTasks', JSON.stringify(tasks));
}

// Chargement des tâches
function loadTasks() {
  const saved = JSON.parse(localStorage.getItem('weeklyTasks') || '[]');
  saved.forEach(task => {
    const li = createTaskElement(task.text, task.priority, '', '');
    tasksList.appendChild(li);
  });
}

// Statistiques
function updateStats() {
  const tasks = JSON.parse(localStorage.getItem('weeklyTasks') || '[]');
  const total = tasks.length;
  const haute = tasks.filter(t => t.priority === 'Haute').length;
  const moyenne = tasks.filter(t => t.priority === 'Moyenne').length;
  const basse = tasks.filter(t => t.priority === 'Basse').length;

  statsOutput.textContent = `Tu as ${total} tâche(s) :
  🔴 ${haute} haute(s) priorité | 🟡 ${moyenne} moyenne(s) | 🟢 ${basse} basse(s)`;
}

// Envoi EmailJS
function sendWelcomeEmail(name, email, company_name, company_email, website_link) {
  const templateParams = {
    name,
    email,
    company_name,
    company_email,
    website_link
  };

  console.log("Envoi email avec :", templateParams);

  emailjs.send("service_fvn9wqi", "template_aabg24n", templateParams)
    .then(() => {
      console.log("✅ E-mail envoyé !");
    })
    .catch((error) => {
      console.error("❌ Erreur EmailJS :", error);
    });
}

// Ajout de tâche
addTaskBtn.addEventListener('click', () => {
  const taskText = taskInput.value.trim();
  const priority = prioritySelect.value;
  const date = taskDate.value;
  const time = taskTime.value;

  if (taskText === '' || date === '' || time === '') {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  const taskElement = createTaskElement(taskText, priority, date, time);
  tasksList.appendChild(taskElement);
  notifyTask(taskText);
  scheduleReminder(taskText, date, time);
  refreshAll();

  sendWelcomeEmail(
    "Nicole",
    "afanenicole0635@gmail.com",
    "AfaneCorp",
    "contact@afanecorp.com",
    "https://afanecorp.com"
  );

  taskInput.value = '';
  taskDate.value = '';
  taskTime.value = '';
  prioritySelect.value = 'Moyenne';
});

// Export PDF
exportBtn.addEventListener('click', () => {
  const elementToExport = document.getElementById('task-list');
  const options = {
    margin: 0.5,
    filename: 'taches_hebdomadaires.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(options).from(elementToExport).save();
});

// Reconnaissance vocale
voiceBtn.addEventListener('click', () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('La reconnaissance vocale n’est pas supportée sur ce navigateur.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    taskInput.value = transcript;
  };

  recognition.onerror = (event) => {
    console.error("Erreur vocale :", event.error);
    alert('Erreur de reconnaissance vocale : ' + event.error);
  };
});

// Rafraîchissement global
function refreshAll() {
  saveTasks();
  updateStats();
}
