document.addEventListener("DOMContentLoaded", function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBP89OenwCg_NLf50-3T_ZAXhXTdQBqPzw",
    authDomain: "i-saw-you-2a014.firebaseapp.com",
    projectId: "i-saw-you-2a014",
    storageBucket: "i-saw-you-2a014.appspot.com",
    messagingSenderId: "680620817707",
    appId: "1:680620817707:web:ec1e4d86970773ab1e996e",
    measurementId: "G-2V4C89CNBR"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const messageForm = document.getElementById('messageForm');

  function updateUI(user) {
    if (user) {
      loginBtn.style.display = 'none';
      registerBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      loadUserProfile(user);
    } else {
      loginBtn.style.display = 'inline-block';
      registerBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      document.getElementById('userProfilePanel').innerHTML = '';
    }
  }

  auth.onAuthStateChanged(user => {
    updateUI(user);
    loadEncounters();
  });

  loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(result => {
        console.log("Zalogowano:", result.user);
      })
      .catch(error => {
        console.error("Błąd logowania:", error);
        alert("Nie udało się zalogować: " + error.message);
      });
  });

  registerBtn.addEventListener('click', () => {
    const email = prompt("Podaj email:");
    const password = prompt("Podaj hasło:");
    if (email && password) {
      auth.createUserWithEmailAndPassword(email, password)
        .then(result => {
          console.log("Zarejestrowano:", result.user);
        })
        .catch(error => {
          console.error("Błąd rejestracji:", error);
          alert("Nie udało się zarejestrować: " + error.message);
        });
    }
  });

  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });

  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert("Musisz być zalogowany, aby wysłać wiadomość.");
      return;
    }

    const location = document.getElementById('location').value.trim();
    const time = document.getElementById('time').value.trim();
    const description = document.getElementById('description').value.trim();
    const message = document.getElementById('message').value.trim();

    if (location && time && description && message) {
      await db.collection('encounters').add({
        location,
        time,
        description,
        message,
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert("Wiadomość została wysłana!");
      messageForm.reset();
      loadEncounters();
      loadUserProfile(user);
    } else {
      alert("Proszę wypełnić wszystkie pola.");
    }
  });

  async function loadEncounters() {
    const list = document.getElementById('encounterList');
    list.innerHTML = '';
    const snapshot = await db.collection('encounters').orderBy('createdAt', 'desc').get();
    snapshot.forEach(doc => {
      const data = doc.data();
      const item = document.createElement('div');
      item.className = 'encounter-card';
      item.innerHTML = `
        <h3>${data.location} – ${data.time}</h3>
        <p><strong>Opis:</strong> ${data.description}</p>
        <p><strong>Wiadomość:</strong> ${data.message}</p>
        <p class="author">Od: ${data.userName}</p>
      `;
      list.appendChild(item);
    });
  }

  async function loadUserProfile(user) {
    const panel = document.getElementById('userProfilePanel');
    panel.innerHTML = `
      <h2>Twój profil</h2>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Imię:</strong> ${user.displayName || 'Nie podano'}</p>
      <h3>Twoje ogłoszenia:</h3>
      <div id="userEncounters"></div>
    `;
    const snapshot = await db.collection('encounters')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    const container = document.getElementById('userEncounters');
    snapshot.forEach(doc => {
      const data = doc.data();
      const item = document.createElement('div');
      item.className = 'encounter-card';
      item.innerHTML = `
        <h4>${data.location} – ${data.time}</h4>
        <p>${data.message}</p>
      `;
      container.appendChild(item);
    });
});


