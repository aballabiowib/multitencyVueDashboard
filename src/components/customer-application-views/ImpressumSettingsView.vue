<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="$emit('close')" class="close-button">X</button>
      <h3>Impostazioni Impressum</h3>

      <!-- Selettore della lingua per l'Impressum -->
      <div class="language-selector-container">
        <label for="impressumLanguage">Seleziona Lingua:</label>
        <select id="impressumLanguage" v-model="currentViewLanguage" class="language-select">
          <option 
            v-for="lang in availableLanguages" 
            :key="lang.code" 
            :value="lang.code"
          >
            {{ lang.name }}
          </option>
        </select>
      </div>

      <div v-if="isLoading" class="loading-message">
        <p>Caricamento testo Impressum...</p>
        <div class="spinner"></div>
      </div>
      <div v-else-if="error" class="error-message">
        <p>Errore durante il caricamento: {{ error }}</p>
        <button @click="fetchImpressumContent" class="retry-button">Riprova</button>
      </div>
      <div v-else class="input-section">
        <div class="input-field-group full-width">
          <label for="impressumText">Contenuto dell'Impressum (HTML):</label>
          <textarea 
            id="impressumText" 
            v-model="impressumContent"
            :placeholder="impressumPlaceholder"
            rows="15"
            class="impressum-textarea"
          ></textarea>
          <p class="text-sm text-gray-500 mt-1">
            Il contenuto verrà salvato come file HTML. Puoi usare tag HTML.
          </p>
        </div>
      </div>
      
      <div class="action-buttons">
        <button class="save-button" @click="saveImpressumContent" :disabled="isSaving">
          {{ isSaving ? 'Salvataggio...' : 'Salva' }}
        </button>
        <button @click="$emit('close')" class="cancel-button" :disabled="isSaving">Annulla</button>
      </div>
      <div v-if="saveError" class="error-message save-error">
        <p>Errore durante il salvataggio: {{ saveError }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
// Importa i dati delle lingue dal file utils
import { languagesData } from '@/utils/language'; 

export default {
  name: 'ImpressumSettingsView',
  emits: ['close'],
  props: {
    customerId: { // Potrebbe non essere direttamente usato per il path del file, ma utile per coerenza
      type: Number,
      required: true
    },
    companyName: { // Utile per il titolo della vista
      type: String,
      default: 'Cliente'
    }
  },
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const router = useRouter();

    const impressumContent = ref('');
    const impressumPlaceholder = ref('Contenuto dell\'Impressum non ancora definito. Inserisci qui il testo.');

    const isLoading = ref(true);
    const error = ref(null);
    const isSaving = ref(false);
    const saveError = ref(null);

    // Stato locale per la lingua visualizzata nell'Impressum
    // Inizializza con 'it-IT' come predefinito
    const currentViewLanguage = ref('it-IT'); 

    // Computed property per le lingue disponibili, ora usa languagesData
    const availableLanguages = computed(() => {
      return languagesData;
    });

    // Funzione per verificare la scadenza del token (riutilizzata da CustomerView)
    const isTokenExpired = (token) => {
      if (!token) return true;
      try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return true;
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const expirationDateString = decodedPayload.expiration_date;
        if (!expirationDateString) return true;
        const expirationTime = new Date(expirationDateString);
        if (isNaN(expirationTime.getTime())) return true;
        const currentTimeMs = Date.now();
        const leewayMs = 5 * 60 * 1000; // 5 minuti di tolleranza
        return expirationTime.getTime() < (currentTimeMs - leewayMs);
      } catch (e) {
        console.error('isTokenExpired: Errore durante la decodifica o la verifica del token JWT:', e);
        return true;
      }
    };

    // Funzione per costruire il percorso API basato sulla lingua
    const getImpressumApiUrl = (language) => {
      // Questo URL punterà al tuo backend che gestirà il file system
      // Ad esempio: http://localhost:8000/api/impressum_content/de-DE/
      // Il backend dovrà mappare questo URL al file document/de-DE/impressum_text.html
      return `http://localhost:8000/api/impressum_content/${language}/`;
    };

    // Funzione per recuperare il contenuto dell'Impressum
    const fetchImpressumContent = async () => {
      isLoading.value = true;
      error.value = null;

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        error.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        isLoading.value = false;
        await authStore.logout();
        router.push('/');
        return;
      }

      // Usa la lingua selezionata localmente
      const languageToFetch = currentViewLanguage.value; 
      const apiUrl = getImpressumApiUrl(languageToFetch);

      const headers = {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'text/html', // Il backend dovrebbe rispondere con text/html
        'Accept': 'text/html',
      };

      // L'header 'Customer' potrebbe non essere necessario per questa API, ma lo manteniamo per coerenza
      if (props.companyName) {
        headers['Customer'] = props.companyName; 
      } else {
        console.warn('Company name not available for Customer header in ImpressumSettingsView.');
      }

      console.log(`Fetching Impressum content for language ${languageToFetch} from: ${apiUrl}`);

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          mode: 'cors'
        });

        if (response.ok) {
          const text = await response.text();
          impressumContent.value = text;
          impressumPlaceholder.value = ''; // Rimuovi placeholder se il contenuto è caricato
        } else if (response.status === 404) {
          // File non trovato, usa il placeholder
          impressumContent.value = '';
          impressumPlaceholder.value = 'Contenuto dell\'Impressum non ancora definito. Inserisci qui il testo.';
          console.warn(`Impressum content file not found for ${languageToFetch}. Using placeholder.`);
        } else {
          const errorText = await response.text();
          console.error('Error fetching Impressum content (response not ok):', response.status, errorText);
          error.value = `Impossibile caricare l'Impressum: ${response.status} - ${errorText}`;
          impressumContent.value = ''; // Pulisci il campo in caso di errore
          impressumPlaceholder.value = 'Errore nel caricamento. Controlla la console.';
          if (response.status === 401 || response.status === 403) {
            await authStore.logout();
            router.push('/');
          }
        }
      } catch (err) {
        console.error('Network or server error fetching Impressum content:', err);
        error.value = 'Impossibile connettersi al server per l\'Impressum.';
        impressumContent.value = ''; // Pulisci il campo in caso di errore
        impressumPlaceholder.value = 'Errore di rete. Controlla la connessione.';
      } finally {
        isLoading.value = false;
      }
    };

    // Funzione per salvare il contenuto dell'Impressum
    const saveImpressumContent = async () => {
      isSaving.value = true;
      saveError.value = null;

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        saveError.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        isSaving.value = false;
        await authStore.logout();
        router.push('/');
        return;
      }

      // Usa la lingua selezionata localmente per il salvataggio
      const languageToSave = currentViewLanguage.value;
      const apiUrl = getImpressumApiUrl(languageToSave);

      const headers = {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'text/html', // Stiamo inviando HTML puro
      };

      // L'header 'Customer' potrebbe non essere necessario per questa API, ma lo manteniamo per coerenza
      if (props.companyName) {
        headers['Customer'] = props.companyName; 
      } else {
        console.warn('Company name not available for Customer header in ImpressumSettingsView for saving.');
      }

      console.log(`Saving Impressum content for language ${languageToSave} to: ${apiUrl}`);
      console.log('Payload (first 200 chars):', impressumContent.value.substring(0, 200));

      try {
        const response = await fetch(apiUrl, {
          method: 'PUT', // O POST, a seconda di come il tuo backend è configurato per creare/aggiornare
          headers: headers,
          mode: 'cors',
          body: impressumContent.value // Invia il testo direttamente come body
        });

        if (response.ok) {
          console.log('Impressum content saved successfully!');
          saveError.value = null;
          emit('close'); // Chiudi la modale dopo il salvataggio
        } else {
          const errorText = await response.text();
          console.error('Error saving Impressum content (response not ok):', response.status, errorText);
          saveError.value = `Impossibile salvare l'Impressum: ${response.status} - ${errorText}`;
          if (response.status === 401 || response.status === 403) {
            await authStore.logout();
            router.push('/');
          }
        }
      } catch (err) {
        console.error('Network or server error saving Impressum content:', err);
        saveError.value = 'Impossibile connettersi al server per salvare l\'Impressum.';
      } finally {
        isSaving.value = false;
      }
    };

    // Al montaggio, recupera il contenuto per la lingua iniziale
    onMounted(() => {
      fetchImpressumContent();
    });

    // Guarda i cambiamenti nella lingua selezionata localmente per ricaricare il contenuto
    watch(currentViewLanguage, (newLang, oldLang) => {
      if (newLang !== oldLang) {
        fetchImpressumContent();
      }
    });

    return {
      impressumContent,
      impressumPlaceholder,
      isLoading,
      error,
      isSaving,
      saveError,
      fetchImpressumContent,
      saveImpressumContent,
      companyName, // Esposto per il titolo
      currentViewLanguage, // Esposto per il v-model del selettore
      availableLanguages // Esposto per le opzioni del selettore
    };
  }
};
</script>

<style scoped>
.app-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Sfondo semi-trasparente */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Assicura che sia sopra gli altri elementi */
}

.app-view-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 85%; /* Larghezza della "finestra" */
  max-width: 800px; /* Larghezza massima adatta per testo */
  max-height: 90%; /* Altezza massima */
  overflow-y: auto; /* Scorri se il contenuto è troppo lungo */
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.8em;
  cursor: pointer;
  color: #6c757d;
  transition: color 0.2s ease;
}
.close-button:hover {
  color: #dc3545;
}

h3 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.8em;
}

.language-selector-container {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.language-selector-container label {
  font-weight: bold;
  color: #333;
  font-size: 1.1em;
}

.language-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.language-select:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.2);
}

.loading-message, .error-message {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.loading-message {
  background-color: #e0f0ff;
  color: #0056b3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #ffe0e0;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.retry-button {
  background-color: #007bff;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: #0056b3;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-field-group label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.impressum-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 1em;
  min-height: 250px; /* Altezza minima per l'editor */
  resize: vertical; /* Permette solo il ridimensionamento verticale */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
}

.impressum-textarea:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.save-button, .cancel-button {
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.save-button {
  background-color: #007bff;
  color: white;
  border: 1px solid #007bff;
}

.save-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.cancel-button {
  background-color: #6c757d;
  color: white;
  border: 1px solid #6c757d;
}

.cancel-button:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
}
</style>
