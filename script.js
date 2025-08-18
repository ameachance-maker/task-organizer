// Vérification du chargement du script
console.log("script.js chargé à", new Date().toLocaleString());

document.addEventListener('DOMContentLoaded', () => {
  console.log("Événement DOMContentLoaded déclenché");

  // Vérification du SDK EmailJS
  if (typeof emailjs === 'undefined') {
    console.error("❌ Erreur : EmailJS SDK non chargé.");
    alert("Erreur : EmailJS SDK non chargé. Vérifiez votre connexion Internet.");
    return;
  }

  // ✅ Initialisation EmailJS avec ta clé publique
  emailjs.init("y3P0QZRMxXPC8j-Kt");

  // Notifications
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      console.log("Permission de notification :", permission);
    });
  }

  // Charger email utilisateur depuis localStorage
  const savedEmail = localStorage.getItem('userEmail');
  if (savedEmail) {
    document.getElementById('user-email').value = savedEmail;
    console.log("Email chargé depuis localStorage :", savedEmail);
  }

  showDailySuggestions();
  loadTasks();
  updateStats();

  // Sauvegarde email quand modifié
  document.getElementById('user-email').addEventListener('change', () => {
    const email = document.getElementById('user-email').value.trim();
    localStorage.setItem('userEmail', email);
    console.log("Email sauvegardé :", email);
  });

  // ✅ Bouton test email
  document.getElementById('test-email-btn').addEventListener('click', () => {
    const userEmail = document.getElementById('user-email').value.trim();
    console.log("Test email pour :", userEmail);

    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      alert("Veuillez entrer un email valide.");
      return;
    }

    // ⚠️ Paramètres attendus par ton template
    const templateParams = {
      reply_to: userEmail,
      task: "Test de tâche",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString()
    };

    emailjs.send("service_fvn9wqi", "template_tky9fxj", templateParams)
      .then((response) => {
        console.log("✅ Email envoyé :", response);
        alert("Email de test envoyé avec succès !");
      })
      .catch((error) => {
        console.error("❌ Erreur EmailJS :", error);
        alert("Erreur lors de l'envoi de l'email : " + (error.text || error));
      });
  });
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
const userEmailInput = document.getElementById('user-email');

// Suggestions quotidiennes
const suggestions = {
  0: ['Préparer le repas', 'Appeler la famille', 'Lire un livre', 'Méditer'],
  1: ['Planifier la semaine', 'Faire les courses', 'Réviser les objectifs', 'Nettoyer l’espace de travail'],
  2: ['Répondre aux emails', 'Faire du sport', 'Apprendre quelque chose de nouveau', 'Appeler un ami'],
  3: ['Organiser le bureau', 'Lire un article', 'Préparer les repas de demain', 'Faire une pause créative'],
  4: ['Faire le ménage', 'Préparer le week-end', 'Évaluer la semaine', 'Se détendre'],
  5: ['Sortir avec des amis', 'Faire une pause', 'Regarder un film', 'Cuisiner pour plaisir'],
  6: ['Recharger les batteries', 'Faire une promenade', 'Planifier la semaine prochaine', 'Profiter du repos']
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

// Création tâche
function createTaskElement(taskText, priority, date, time, completed = false) {
  const li = document.createElement('li');
  li.setAttribute('data-priority', priority);
  li.setAttribute('data-tasktext', taskText);
  li.setAttribute('data-date', date);
  li.setAttribute('data-time', time);
  if (completed) li.classList.add('completed');

  const span = document.createElement('span');
  span.textContent = `${taskText} (${priority}) - 📅 ${date} 🕒 ${time}`;

  const actions = document.createElement('div');
  actions.classList.add('task-actions');

  const completeBtn = document.createElement('button');
  completeBtn.innerHTML = '✅';
  completeBtn.classList.add('complete-btn');
  completeBtn.addEventListener('click', () => {
    li.classList.toggle('completed');
    refreshAll();
  });

  const editBtn = document.createElement('button');
  editBtn.innerHTML = '✏️';
  editBtn.classList.add('edit-btn');
  editBtn.addEventListener('click', () => {
    taskInput.value = taskText;
    prioritySelect.value = priority;
    taskDate.value = date;
    taskTime.value = time;
    li.remove();
    refreshAll();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.classList.add('delete-btn');
  deleteBtn.addEventListener('click', () => {
    li.remove();
    refreshAll();
  });

  actions.appendChild(completeBtn);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(span);
  li.appendChild(actions);
  return li;
}

// Notifications locales
function notifyTask(taskText) {
  if (Notification.permission === 'granted') {
    new Notification('Nouvelle tâche ajoutée', {
      body: taskText,
      icon: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png'
    });
  }
}

// Envoi email rappel
function sendReminderEmail(taskText, date, time) {
  const userEmail = userEmailInput.value.trim();
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    alert("Veuillez entrer un email valide pour les rappels.");
    return;
  }

  const templateParams = {
    reply_to: userEmail, // ✅ correspond à ton template
    task: taskText,
    date: date,
    time: time
  };

  emailjs.send("service_fvn9wqi", "template_tky9fxj", templateParams)
    .then(() => alert("Email de rappel envoyé avec succès !"))
    .catch(error => alert("Erreur lors de l'envoi : " + (error.text || error)));
}

// Programmation rappel
function scheduleReminder(taskText, date, time) {
  const userEmail = userEmailInput.value.trim();
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    return;
  }

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
      sendReminderEmail(taskText, date, time);
    }, delay);
  }
}

// Sauvegarde des tâches
function saveTasks() {
  const tasks = [];
  document.querySelectorAll('#tasks li').forEach(li => {
    tasks.push({
      taskText: li.getAttribute('data-tasktext'),
      priority: li.getAttribute('data-priority'),
      date: li.getAttribute('data-date'),
      time: li.getAttribute('data-time'),
      completed: li.classList.contains('completed')
    });
  });
  localStorage.setItem('weeklyTasks', JSON.stringify(tasks));
}

// Chargement des tâches
function loadTasks() {
  const saved = JSON.parse(localStorage.getItem('weeklyTasks') || '[]');
  saved.forEach(task => {
    const li = createTaskElement(task.taskText, task.priority, task.date, task.time, task.completed);
    tasksList.appendChild(li);
    const reminderTime = new Date(`${task.date}T${task.time}`);
    if (reminderTime > new Date()) {
      scheduleReminder(task.taskText, task.date, task.time);
    }
  });
}

// Statistiques
function updateStats() {
  const tasks = JSON.parse(localStorage.getItem('weeklyTasks') || '[]');
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const haute = tasks.filter(t => t.priority === 'Haute' && !t.completed).length;
  const moyenne = tasks.filter(t => t.priority === 'Moyenne' && !t.completed).length;
  const basse = tasks.filter(t => t.priority === 'Basse' && !t.completed).length;

  statsOutput.textContent = `Tu as ${total} tâche(s) : ${completed} complétée(s). 
  En cours : 🔴 ${haute} haute(s) | 🟡 ${moyenne} moyenne(s) | 🟢 ${basse} basse(s)`;
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

  const userEmail = userEmailInput.value.trim();
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    alert("Veuillez entrer un email valide avant d'ajouter une tâche.");
    return;
  }

  const taskElement = createTaskElement(taskText, priority, date, time);
  tasksList.appendChild(taskElement);
  notifyTask(taskText);
  scheduleReminder(taskText, date, time);
  refreshAll();

  taskInput.value = '';
  taskDate.value = '';
  taskTime.value = '';
  prioritySelect.value = 'Moyenne';
});

// Export PDF
exportBtn.addEventListener('click', () => {
  const elementToExport = document.querySelector('main');
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
    taskInput.value = event.results[0][0].transcript;
  };

  recognition.onerror = (event) => {
    alert('Erreur de reconnaissance vocale : ' + event.error);
  };
});

// Rafraîchir
function refreshAll() {
  saveTasks();
  updateStats();
}
