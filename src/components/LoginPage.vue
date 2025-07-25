<template>
  <div class="login-page" data-v-inspector="src/components/LoginPage.vue:2:3">
    <!-- Sezione Sinistra: Carosello di Immagini -->
    <div class="left-panel" data-v-inspector="src/components/LoginPage.vue:4:5">
      <img :src="currentImage" :key="currentImageIndex" alt="Sfondo Carosello" class="carousel-image" data-v-inspector="src/components/LoginPage.vue:5:7">
      
      <!-- Controlli del carosello (opzionali, puoi anche fare solo autoplay) -->
      <div class="carousel-nav" data-v-inspector="src/components/LoginPage.vue:8:7">
        <button @click="prevImage" class="nav-button" data-v-inspector="src/components/LoginPage.vue:9:9">&lt;</button>
        <button @click="nextImage" class="nav-button" data-v-inspector="src/components/LoginPage.vue:10:9">&gt;</button>
      </div>
    </div>

    <!-- Sezione Destra: Form di Login -->
    <div class="right-panel" data-v-inspector="src/components/LoginPage.vue:15:5">
      <div class="login-form-container" data-v-inspector="src/components/LoginPage.vue:16:7">
        <h2 data-v-inspector="src/components/LoginPage.vue:17:9">Accedi</h2>
        <div class="input-group" data-v-inspector="src/components/LoginPage.vue:18:9">
          <label for="username" data-v-inspector="src/components/LoginPage.vue:19:11">Username:</label>
          <input type="text" id="username" v-model="username" placeholder="Inserisci il tuo username" data-v-inspector="src/components/LoginPage.vue:20:11" />
        </div>
        <div class="input-group" data-v-inspector="src/components/LoginPage.vue:22:9">
          <label for="password" data-v-inspector="src/components/LoginPage.vue:23:11">Password:</label>
          <input type="password" id="password" v-model="password" placeholder="Inserisci la tua password" data-v-inspector="src/components/LoginPage.vue:24:11" />
        </div>
        <button @click="handleLogin" class="login-button" data-v-inspector="src/components/LoginPage.vue:26:9">Accedi</button>
        <div class="forgot-password" data-v-inspector="src/components/LoginPage.vue:27:9">
          <a href="#" @click.prevent="handleForgotPassword" data-v-inspector="src/components/LoginPage.vue:28:11">Hai dimenticato la password?</a>
        </div>
      </div>

      <div class="language-selector-container" data-v-inspector="src/components/LoginPage.vue:32:7">
        <h3 data-v-inspector="src/components/LoginPage.vue:33:9">Seleziona la lingua:</h3>
        <div class="flags-pagination-wrapper" data-v-inspector="src/components/LoginPage.vue:34:9">
          <button @click="prevFlagsPage" :disabled="currentFlagsPage === 0" class="flags-nav-button" data-v-inspector="src/components/LoginPage.vue:35:11">&lt;</button>
          <div class="flags-group" data-v-inspector="src/components/LoginPage.vue:36:11">
            <img 
              v-for="flag in paginatedFlags" 
              :key="flag.code"
              :src="flag.src" 
              :alt="flag.name" 
              @click="setLanguage(flag.code)" 
              class="flag-icon" 
              :class="{ 'active-flag': selectedLanguage === flag.code }" data-v-inspector="src/components/LoginPage.vue:37:13"
            >
          </div>
          <button @click="nextFlagsPage" :disabled="currentFlagsPage === totalFlagsPages - 1" class="flags-nav-button" data-v-inspector="src/components/LoginPage.vue:47:11">&gt;</button>
        </div>
        <div class="flags-page-indicator" data-v-inspector="src/components/LoginPage.vue:49:9">
          {{ currentFlagsPage + 1 }} / {{ totalFlagsPages }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'; // Importa lo store di autenticazione
import { useRouter } from 'vue-router';
// Importa le tue immagini dalla cartella src/assets/images/
// Crea questa cartella e metti le tue immagini lì.
import image1 from '@/assets/images/locker.png'; // Esempio: src/assets/images/sfondo1.jpg
import image2 from '@/assets/images/loker1.png'; // Esempio: src/assets/images/sfondo2.jpg
import image3 from '@/assets/images/locker2.jpg'; // Esempio: src/assets/images/sfondo3.jpg
import image4 from '@/assets/images/locker3.png';
import image5 from '@/assets/images/locker4.png';
import image6 from '@/assets/images/locker5.png';
import image7 from '@/assets/images/login-visual-1.svg';
import image8 from '@/assets/images/penguin1.png';
import image9 from '@/assets/images/penguin2.png';

// Importa le tue immagini delle bandierine
import flag_it_IT from '@/assets/flags/it-IT.png';
import flag_en_EN from '@/assets/flags/en-EN.png';
import flag_nl_NL from '@/assets/flags/nl-NL.png';
import flag_at_AT from '@/assets/flags/at-AT.png';
import flag_be_BE from '@/assets/flags/be-BE.png';
import flag_dk_DK from '@/assets/flags/dk-DK.png';
import flag_es_ES from '@/assets/flags/es-ES.png';
import flag_fr_FR from '@/assets/flags/fr-FR.png';
import flag_hr_HR from '@/assets/flags/hr-HR.png';
import flag_hu_HU from '@/assets/flags/hu-HU.png';
import flag_ie_IE from '@/assets/flags/ie-IE.png';
import flag_lu_LU from '@/assets/flags/lu-LU.png';
import flag_no_NO from '@/assets/flags/no-NO.png';
import flag_pl_PL from '@/assets/flags/pl-PL.png';
import flag_pt_PT from '@/assets/flags/pt-PT.png';
import flag_se_SE from '@/assets/flags/se-SE.png';
import flag_sk_SK from '@/assets/flags/sk-SK.png';
import flag_tr_TR from '@/assets/flags/tr-TR.png';
import flag_za_ZA from '@/assets/flags/za-ZA.png';

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      // Array delle immagini per il carosello
      images: [
        image1, 
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        image9
      ],
      currentImageIndex: 0,
      carouselInterval: null, // Per l'autoplay del carosello
      selectedLanguage: 'it-IT',

      // NUOVO: Dati per la paginazione delle bandierine
      flagsPerPage: 5, // Numero di bandierine per pagina
      currentFlagsPage: 0, // Indice della pagina corrente (inizia da 0)

      // Array completo delle bandierine con metadati
      allFlags: [
        { code: 'it-IT', name: 'Italiano', src: flag_it_IT },
        { code: 'en-EN', name: 'English', src: flag_en_EN },
        { code: 'nl-NL', name: 'Nederland', src: flag_nl_NL },
        { code: 'at-AT', name: 'Austrian', src: flag_at_AT },
        { code: 'be-BE', name: 'Belgium', src: flag_be_BE },
        { code: 'dk-DK', name: 'Danmark', src: flag_dk_DK },
        { code: 'es-ES', name: 'Spanish', src: flag_es_ES },
        { code: 'fr-FR', name: 'French', src: flag_fr_FR },
        { code: 'hr-HR', name: 'Croatia', src: flag_hr_HR },
        { code: 'hu-HU', name: 'Hungary', src: flag_hu_HU }, // Corretto alt da Danmark a Hungary
        { code: 'ie-IE', name: 'Ireland', src: flag_ie_IE },
        { code: 'lu-LU', name: 'Luxembourg', src: flag_lu_LU }, // Corretto alt da Luxenburg a Luxembourg
        { code: 'no-NO', name: 'Norway', src: flag_no_NO }, // Corretto alt da Norwai a Norway
        { code: 'pl-PL', name: 'Poland', src: flag_pl_PL }, // Corretto alt da Danmark a Poland
        { code: 'pt-PT', name: 'Portugal', src: flag_pt_PT },
        { code: 'se-SE', name: 'Sweden', src: flag_se_SE },
        { code: 'sk-SK', name: 'Slovakia', src: flag_sk_SK }, // Corretto alt da Slovachia a Slovakia
        { code: 'tr-TR', name: 'Turkey', src: flag_tr_TR }, // Corretto alt da Danmark a Turkey
        { code: 'za-ZA', name: 'South Africa', src: flag_za_ZA }, // Corretto alt da Danmark a South Africa
      ],
    };
  },
  setup() {
    // Setup function for Composition API access to store and router
    const authStore = useAuthStore();
    const router = useRouter(); // Get the router instance

    // Return properties for use in template (if needed) or methods
    return {
      authStore,
      router
    };
  },
  computed: {
    // Restituisce l'URL dell'immagine corrente del carosello
    currentImage() {
      return this.images[this.currentImageIndex];
    },
    //Calcola le bandierine da mostrare nella pagina corrente
    paginatedFlags() {
      const start = this.currentFlagsPage * this.flagsPerPage;
      const end = start + this.flagsPerPage;
      return this.allFlags.slice(start, end);
    },
    //Calcola il numero totale di pagine di bandierine
    totalFlagsPages() {
      return Math.ceil(this.allFlags.length / this.flagsPerPage);
    }
  },
  mounted() {
    // Avvia l'autoplay del carosello quando il componente è montato
    this.startCarousel();
    if (this.authStore.isAuthenticated) {
      this.router.push('/dashboard');
    }
  },
  beforeUnmount() {
    // Ferma l'autoplay quando il componente viene distrutto per evitare memory leak
    this.stopCarousel();
  },
  methods: {
    async handleLogin() {
      const username = this.username;
      const password = this.password;

      if (!username || !password) {
        alert('Per favore, inserisci username e password.');
        return;
      }

      //console.log('Tentativo di login con:', { username, password });

      try {
        // CAMBIA QUESTO URL con l'endpoint reale della tua API di backend!
        const apiUrl = 'http://localhost:8000/api/auth/login'; 

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }), 
        });

        if (response.ok) {
          const data = await response.json(); // I dati ricevuti dal backend
          console.log('Login riuscito!', data);
          //alert('Login effettuato con successo!', data);

          // Ottieni l'istanza dello store di autenticazione
          //this.authStore = useAuthStore();
          // Chiama l'azione 'login' dello store per salvare i dati
          this.authStore.login(data); 
          console.log("authStore", this.authStore)

          // Qui reindirizzeresti l'utente ad un'altra pagina (es. dashboard)
          // Esempio: this.$router.push('/dashboard'); (se usi Vue Router)
          // Redirect to the Dashboard page
          this.router.push('/dashboard');
          
        } else {
          const errorData = await response.json();
          console.error('Errore di login:', response.status, errorData);
          alert(`Login fallito: ${errorData.message || 'Credenziali non valide.'}`);
        }
      } catch (error) {
        console.error('Si è verificato un errore di rete o del server:', error);
        alert('Errore di connessione al server. Riprova più tardi.');
      }
    },
    handleForgotPassword() {
      // Logica per il reset della password: qui reindirizzeresti l'utente a una pagina di reset
      alert('Hai cliccato su "Hai dimenticato la password?"');
    },
    // Metodi per la navigazione del carosello
    nextImage() {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    },
    prevImage() {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    },
    // Metodi per l'autoplay del carosello
    startCarousel() {
      // Cambia immagine ogni 5 secondi (5000ms)
      this.carouselInterval = setInterval(this.nextImage, 5000); 
    },
    stopCarousel() {
      clearInterval(this.carouselInterval);
    },

    setLanguage(lang) {
      this.selectedLanguage = lang;
      console.log('Lingua selezionata:', lang);
      // Qui integreresti la logica per cambiare la lingua dell'intera app
      // Ad esempio, potresti usare una libreria di internazionalizzazione (i18n) come vue-i18n
    },
    // NUOVO: Metodo per andare alla pagina precedente delle bandierine
    prevFlagsPage() {
      if (this.currentFlagsPage > 0) {
        this.currentFlagsPage--;
      }
    },
    // NUOVO: Metodo per andare alla pagina successiva delle bandierine
    nextFlagsPage() {
      if (this.currentFlagsPage < this.totalFlagsPages - 1) {
        this.currentFlagsPage++;
      }
    }
  }
};
</script>

<style scoped>
/*
  Layout principale della pagina di login:
  Utilizza CSS Grid per dividere la pagina in due colonne uguali.
*/
.login-page {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Due colonne di uguale larghezza */
  height: 100vh; /* Occupa il 100% dell'altezza del suo genitore (#app-container) */
  width: 100%;  /* Occupa il 100% della larghezza del suo genitore */
  min-height: 100%;
  overflow: hidden; /* Nasconde qualsiasi contenuto che sfora */
}

/*
  Sezione Sinistra: Carosello di Immagini
  Occupa la prima colonna della griglia.
*/
.left-panel {
  position: relative; /* Per posizionare l'immagine e i controlli al suo interno */
  overflow: hidden;   /* Importante per tagliare l'immagine se sfora */
  display: flex;      /* Per centrare l'immagine all'interno del pannello */
  justify-content: center;
  align-items: center;
  background-color: #333; /* Colore di fallback se l'immagine non si carica */
}

.carousel-image {
  width: 100%; /* L'immagine occupa il 100% della larghezza del suo contenitore */
  height: 100%; /* L'immagine occupa il 100% dell'altezza del suo contenitore */
  object-fit: contain;
  object-position: center; /* Centra l'immagine all'interno del suo spazio, anche se tagliata. */
  filter: brightness(70%); /* Scurisce l'immagine per far risaltare i controlli */
  transition: opacity 1s ease-in-out; /* Transizione fluida tra le immagini */
  position: absolute; /* Permette alle immagini di sovrapporsi per la transizione */
}

.carousel-nav {
  position: absolute;
  bottom: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 10px; /* Spazio tra i bottoni */
  z-index: 10; /* Assicura che i bottoni siano sopra l'immagine */
}

.nav-button {
  background-color: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 8px 15px;
  font-size: 1.2em;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.nav-button:hover {
  background-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

/*
  Sezione Destra: Form di Login
  Occupa la seconda colonna della griglia.
*/
.right-panel {
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centra orizzontalmente il form */
  align-items: center;     /* Centra verticalmente il form */
  background-color: #f0f2f5; /* Colore di sfondo per il pannello destro */
  padding: 20px; /* Padding interno */
}

.login-form-container {
  background-color: #ffffff;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 400px;
  margin-bottom: 30px; /* **Spazio sotto il riquadro di login** */
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 600;
}

.input-group input {
  width: calc(100% - 24px); /* 100% meno padding e bordo */
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.input-group input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.2);
}

.login-button {
  background-color: #007bff;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  width: 100%;
  margin-top: 15px;
  font-weight: bold;
}

.login-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.forgot-password {
  margin-top: 25px;
}

.forgot-password a {
  color: #007bff;
  text-decoration: none;
  font-size: 0.95em;
  transition: color 0.3s ease;
}

.forgot-password a:hover {
  text-decoration: underline;
  color: #0056b3;
}

/* NUOVO: Layout del contenitore del selettore di lingua */
.language-selector-container {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  text-align: center;
  width: 100%;
  max-width: 400px;
  margin-top: 20px; /* Aggiungi un po' di margine superiore per staccarsi dal form */
}

.language-selector-container h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2em;
}

/* Wrapper per i pulsanti di navigazione e il gruppo di bandierine */
.flags-pagination-wrapper {
  display: flex;
  align-items: center; /* Allinea verticalmente pulsanti e bandierine */
  justify-content: center; /* Centra il gruppo completo */
  gap: 10px; /* Spazio tra i pulsanti e le bandierine */
}

/* Stili per il gruppo di bandierine (la sezione centrale che mostra le 6 bandierine) */
.flags-group {
  display: flex;
  justify-content: center; /* Centra le bandierine all'interno del loro gruppo */
  flex-wrap: wrap; /* Permette alle bandierine di andare a capo su più righe se non c'è spazio */
  gap: 10px; /* Spazio tra le bandierine */
  max-width: calc(40px * 6 + 10px * 5); /* Esempio: 6 bandierine da 40px + 5 gap da 10px */
  /* Regola max-width per controllare quante bandierine stanno su una riga prima di wrap */
}

.flag-icon {
  width: 40px; /* Dimensione delle bandierine */
  height: auto;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
}

.flag-icon:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
}

.flag-icon.active-flag {
  border-color: #007bff;
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 123, 255, 0.4);
}

/* Stili per i pulsanti di navigazione delle bandierine */
.flags-nav-button {
  background-color: #e0e0e0;
  border: none;
  border-radius: 50%; /* Pulsanti rotondi */
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2em;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.flags-nav-button:hover:not(:disabled) {
  background-color: #d0d0d0;
}

.flags-nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Indicatore di pagina */
.flags-page-indicator {
  margin-top: 15px;
  font-size: 0.9em;
  color: #666;
}

/* Media Queries per la Responsività (mantenuto e adattato) */
@media (max-width: 768px) {
  .login-page {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .left-panel {
    height: 300px;
  }

  .right-panel {
    padding: 30px 20px;
  }

  .login-form-container,
  .language-selector-container {
    padding: 30px;
    margin-bottom: 20px; 
    margin-top: 0; /* Rimuovi eventuale margine superiore su mobile per non aggiungere troppo spazio */
  }
  
  .flags-group {
    /* Potresti voler ridurre il max-width o il gap su schermi molto piccoli */
    max-width: calc(40px * 4 + 10px * 3); /* Esempio: 4 bandierine per riga */
  }
}
</style>
