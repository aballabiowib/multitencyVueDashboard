<template>
  <div class="dashboard-container">
    <!-- Sidebar di Navigazione -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <!-- Icona al posto del testo "Dashboard" -->
        <span class="main-dashboard-icon">W</span> 
        <!-- NUOVO: Tooltip per l'icona "W" -->
        <span class="dashboard-header-tooltip">Dashboard</span>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li>
            <router-link to="/dashboard/customer" class="nav-item">
              <span class="nav-icon">
              <img :src="customerIconUrl" alt="Customers" class="svg-img-icon">
              </span>
              <span class="nav-text">Customer</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard/location" class="nav-item">
              <span class="nav-icon">
              <img :src="locationIconUrl" alt="Location" class="svg-img-icon">
              </span>
              <span class="nav-text">Location</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard/machine" class="nav-item">
              <span class="nav-icon">
              <img :src="machinesIconUrl" alt="Machines" class="svg-img-icon">
              </span>
              <span class="nav-text">Machines</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard/administration" class="nav-item">
              <span class="nav-icon">
              <img :src="administrationIconUrl" alt="Machines" class="svg-img-icon">
              </span>
              <span class="nav-text">Amministrazione</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard/alarm" class="nav-item">
              <span class="nav-icon">
              <img :src="alarmIconUrl" alt="Allarmi" class="svg-img-icon">
              </span>
              <span class="nav-text">Allarmi</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard/event" class="nav-item">
              <span class="nav-icon">
              <img :src="eventIconUrl" alt="Eventi" class="svg-img-icon">
              </span>
              <span class="nav-text">Eventi</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard/profile" class="nav-item">
              <span class="nav-icon">
              <img :src="profileIconUrl" alt="Eventi" class="svg-img-icon">
              </span>
              <span class="nav-text">Profilo</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard/settings" class="nav-item">
              <span class="nav-icon">
              <img :src="setupIconUrl" alt="Eventi" class="svg-img-icon">
              </span>
              <span class="nav-text">Impostazioni</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard/reports" class="nav-item">
              <span class="nav-icon">
              <img :src="statisticIconUrl" alt="Eventi" class="svg-img-icon">
              </span>
              <span class="nav-text">Report</span>
            </router-link>
          </li>
          <li>
            <router-link to="/dashboard/dbmaintenance" class="nav-item">
              <span class="nav-icon">
              <img :src="dbmaintenanceIconUrl" alt="Eventi" class="svg-img-icon">
              </span>
              <span class="nav-text">Manutenzione database</span>
            </router-link>
          </li>
          <!-- Aggiungi qui altri elementi di navigazione -->
        </ul>
      </nav>
      <div class="sidebar-footer">
        <button @click="logout" class="logout-button">
          <span class="nav-icon">
              <img :src="exitIconUrl" alt="Exit" class="svg-img-icon">
              </span>
          <span class="nav-text">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Area Principale del Contenuto -->
    <main class="main-content">
      <router-view></router-view> <!-- Qui verranno renderizzate le sotto-viste della dashboard -->
    </main>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';


import customerIconUrl from '@/assets/icons/customers.svg?url'; 
import locationIconUrl from '@/assets/icons/locations.svg?url'; 
import machinesIconUrl from '@/assets/icons/devices.svg?url'; 
import administrationIconUrl from '@/assets/icons/administration.svg?url'; 
import alarmIconUrl from '@/assets/icons/alarm.svg?url'; 
import exitIconUrl from '@/assets/icons/exit.svg?url'; 
import eventIconUrl from '@/assets/icons/events.svg?url'; 
import profileIconUrl from '@/assets/icons/user_profile.svg?url'; 
import setupIconUrl from '@/assets/icons/settings.svg?url'; 
import statisticIconUrl from '@/assets/icons/chart.svg?url'; 
import dbmaintenanceIconUrl from '@/assets/icons/dbmaintenance.svg?url'; 

export default {
  name: 'DashboardPage',
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    // Reindirizza al login se l'utente non è autenticato (ulteriore controllo)
    if (!authStore.isAuthenticated) {
      router.push('/');
    }

    const logout = async () => {
      await authStore.logout();
      router.push('/'); // Reindirizza alla pagina di login dopo il logout
    };

    return {
      user: authStore.user, // Dati utente dallo store
      logout,
      customerIconUrl,
      locationIconUrl,
      machinesIconUrl,
      administrationIconUrl,
      alarmIconUrl,
      exitIconUrl,
      eventIconUrl,
      profileIconUrl,
      setupIconUrl,
      statisticIconUrl,
      dbmaintenanceIconUrl
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  display: flex; /* Utilizza Flexbox per il layout sidebar + contenuto */
  /*min-height: 100vh; /* Occupa l'intera altezza della viewport */
  height: 100vh;
  width: 100vw; /* Modificato: Occupa l'intera larghezza della viewport */
  background-color: #f4f7ff; /* Leggermente cambiato per visibilità */
  font-family: Arial, sans-serif;
  color: #333;
}

/* Stili per la Sidebar */
.sidebar {
  width: 70px; /* Larghezza molto più stretta per le sole icone */
  background-color: #2c3e50; /* Colore scuro per la sidebar */
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  transition: width 0.3s ease; /* Transizione per l'espansione al passaggio del mouse (opzionale) */
}

/* Opzionale: espandi la sidebar al passaggio del mouse */
/*
.sidebar:hover {
  width: 200px; // Larghezza espansa al passaggio del mouse
}
*/

.sidebar-header {
  padding: 0 0 15px; /* Modificato: Ridotto padding inferiore */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 15px; /* Modificato: Ridotto margine inferiore */
  text-align: center; /* Centra l'icona */
  position: relative; /* Necessario per posizionare il tooltip in modo assoluto */
}

.main-dashboard-icon {
  font-size: 2.5em; /* Dimensione grande per l'icona principale */
  font-weight: bold;
  color: #007bff; /* Colore dell'icona principale */
  display: block; /* Assicura che occupi la sua riga */
  line-height: 1; /* Rimuove spazio extra sopra/sotto */
}

/* NUOVO: Stili per il tooltip dell'icona "W" */
.dashboard-header-tooltip {
  opacity: 0;
  visibility: hidden;
  position: absolute;
  top: 50%; /* Centra verticalmente rispetto all'header */
  left: 70px; /* Appare a destra della sidebar stretta */
  transform: translateY(-50%) translateX(-10px); /* Centra verticalmente e aggiunge piccola animazione */
  white-space: nowrap;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 5px;
  z-index: 10;
  pointer-events: none; /* Non blocca gli eventi del mouse */
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
}

.sidebar-header:hover .dashboard-header-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(0);
}


.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1; /* Permette alla nav di occupare lo spazio disponibile */
}

.sidebar-nav li {
  margin-bottom: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 0; /* Rimuovi padding orizzontale, lo gestisce l'icona */
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: background-color 0.3s ease, color 0.3s ease;
  border-left: 5px solid transparent; /* Bordo per indicare l'elemento attivo */
  position: relative; /* Necessario per posizionare il testo in modo assoluto */
  justify-content: center; /* Centra l'icona quando il testo è nascosto */
}

.nav-item:hover {
  background-color: #34495e;
  color: white;
}

/* Stile per l'elemento di navigazione attivo */
.router-link-active,
.router-link-exact-active { /* router-link-exact-active per corrispondenza esatta */
  background-color: #34495e;
  color: white;
  border-left-color: #007bff; /* Colore blu per l'elemento attivo */
  font-weight: bold;
}

.nav-icon {
  font-size: 1.5em; /* Dimensione delle icone (qui sono emoji) */
  margin: 0 auto; /* Centra l'icona orizzontalmente nella sidebar stretta */
  width: 24px; /* Larghezza fissa per allineamento */
  height: 24px; /* Altezza fissa per allineamento */
  display: flex; /* Usa flex per centrare l'immagine SVG all'interno */
  justify-content: center;
  align-items: center;
}

/* Stile per le immagini SVG all'interno delle icone di navigazione */
/* Modificato: Stile per immagini SVG usate con img src */
.nav-icon .svg-img-icon {
  width: 100%; /* L'SVG occupa il 100% della larghezza del suo contenitore */
  height: 100%; /* L'SVG occupa il 100% dell'altezza del suo contenitore */
  object-fit: contain; /* Assicura che l'SVG si adatti senza essere tagliato */
  /* Usa i filtri CSS per cambiare il colore delle SVG usate con img */
  filter: invert(100%) brightness(120%); /* Rende l'SVG bianco per contrastare lo sfondo scuro */
  transition: filter 0.3s ease; /* Transizione per il cambio colore */
}

/* Cambia colore SVG quando l'elemento è attivo o al passaggio del mouse */
.nav-item:hover .svg-img-icon,
.router-link-active .svg-img-icon,
.router-link-exact-active .svg-img-icon {
  /* Filtro per rendere l'SVG blu */
  filter: invert(60%) sepia(100%) saturate(2000%) hue-rotate(190deg) brightness(100%); 
}


.nav-text {
  /* Nascondi il testo di default */
  opacity: 0;
  visibility: hidden;
  position: absolute; /* Posiziona il testo fuori dal flusso normale */
  left: 70px; /* Appare a destra della sidebar stretta */
  white-space: nowrap; /* Impedisce al testo di andare a capo */
  background-color: rgba(0, 0, 0, 0.8); /* Sfondo per il tooltip */
  color: white;
  padding: 8px 12px;
  border-radius: 5px;
  z-index: 10;
  pointer-events: none; /* Non blocca gli eventi del mouse */
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
  transform: translateX(-10px); /* Piccola animazione all'apparire */
}

/* Mostra il testo al passaggio del mouse sull'elemento di navigazione */
.nav-item:hover .nav-text {
  opacity: 1;
  visibility: visible;
  transform: translateX(0); /* Ritorna alla posizione normale */
}

.sidebar-footer {
  padding: 20px 0; /* Rimuovi padding orizzontale */
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto; /* Spinge il footer in basso */
  text-align: center; /* Centra il pulsante */
}

.logout-button {
  width: 80%; /* Riduci la larghezza per stare nella sidebar stretta */
  background-color: #e74c3c; /* Rosso per il logout */
  color: white;
  border: none;
  padding: 12px 0; /* Rimuovi padding orizzontale */
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  display: flex;
  align-items: center;
  justify-content: center; /* Centra icona e testo nel bottone */
  transition: background-color 0.3s ease;
  margin: 0 auto; /* Centra il bottone nella sidebar */
}

.logout-button:hover {
  background-color: #c0392b;
}

/* Stili per l'Area Principale del Contenuto */
.main-content {
  flex-grow: 1; /* Occupa lo spazio rimanente */
  padding: 30px;
  overflow-y: auto; /* Permette lo scroll se il contenuto è troppo lungo */
}

/* Media Query per la Responsività */
@media (max-width: 768px) {
  .dashboard-container {
    flex-direction: column; /* Impila sidebar e contenuto su schermi piccoli */
  }

  .sidebar {
    width: 100%; /* La sidebar occupa tutta la larghezza */
    height: auto; /* Altezza automatica */
    padding: 10px 0;
    flex-direction: row; /* Elementi di navigazione in riga */
    justify-content: space-around; /* Spazia gli elementi */
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .sidebar-header {
    display: none; /* Nasconde l'header della sidebar su mobile */
  }

  .sidebar-nav ul {
    display: flex;
    flex-grow: 1;
    justify-content: space-around;
  }

  .sidebar-nav li {
    margin-bottom: 0;
  }

  .nav-item {
    flex-direction: column; /* Icona sopra il testo */
    padding: 8px 10px;
    border-left: none;
    border-bottom: 3px solid transparent; /* Bordo inferiore per attivo */
    justify-content: center; /* Centra il contenuto del nav-item */
  }

  .nav-item:hover {
    border-left-color: transparent;
    border-bottom-color: #007bff;
  }

  .router-link-active,
  .router-link-exact-active {
    border-left-color: transparent;
    border-bottom-color: #007bff;
  }

  .nav-icon {
    margin-right: 0;
    margin-bottom: 5px;
  }

  .nav-text {
    font-size: 0.8em;
    position: static; /* Rimuovi il posizionamento assoluto su mobile */
    opacity: 1; /* Rendi visibile il testo su mobile */
    visibility: visible;
    transform: none; /* Rimuovi la trasformazione */
    background-color: transparent; /* Rimuovi lo sfondo del tooltip */
    padding: 0;
    pointer-events: auto;
  }
  
  /* Nascondi il testo del tooltip su mobile se non vuoi che appaia sempre */
  /* Oppure puoi stilizzarlo diversamente */
  .sidebar:hover .nav-text {
    opacity: 1; /* Già visibile per default su mobile */
    visibility: visible;
    transform: none;
  }


  .sidebar-footer {
    display: none; /* Nasconde il pulsante di logout dalla sidebar mobile */
  }

  .main-content {
    padding: 20px;
  }
}
</style>