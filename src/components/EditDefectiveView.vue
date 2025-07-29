<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="cancel" class="close-button">X</button>
      <h3>Modifica Difetto</h3>

      <div v-if="isLoading" class="loading-indicator">Caricamento dati difetto...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else class="form-section">
        <!-- Input box per la lingua selezionata - Prima riga del form -->
        <div class="input-field-group language-input-field">
          <label for="messageLanguage">Lingua del Messaggio:</label>
          <input
            type="text"
            id="messageLanguage"
            v-model="displayedLanguageName"
            readonly
            :class="getValidationClass(true, displayedLanguageName, false, true)" 
          />
        </div>
        
        <div class="input-field-group code-field">
          <label for="defectCode">Codice:</label>
          <input
            type="text"
            id="defectCode"
            v-model="defect.code"
            readonly
            :class="getValidationClass(true, defect.code, false, true)" 
          />
        </div>
        <div class="input-field-group title-field">
          <label for="defectTitle">Titolo:</label>
          <input
            type="text"
            id="defectTitle"
            v-model="defect.title"
            :class="getValidationClass(isTitleValid, defect.title, false)"
          />
        </div>
        <div class="input-field-group description-field">
          <label for="defectDescription">Descrizione:</label>
          <textarea
            id="defectDescription"
            v-model="defect.description"
            rows="5"
            :class="getValidationClass(isDescriptionValid, defect.description, false)"
          ></textarea>
        </div>
      </div>

      <ValidationLegend v-if="!isLoading && !error" />

      <div class="action-buttons">
        <button @click="saveDefect" class="save-button" :disabled="!isFormValid || isLoading">
          Salva
        </button>
        <button @click="cancel" class="cancel-button">Annulla</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import ValidationLegend from '@/components/ValidationLegend.vue'; // Assumendo questo percorso
import { languagesData } from '@/utils/language'; // Importa i dati delle lingue

export default {
  name: 'EditDefectView',
  components: {
    ValidationLegend,
  },
  emits: ['close', 'defect-updated'], // Emette 'defect-updated' al salvataggio riuscito
  props: {
    defectId: {
      type: [Number, String],
      required: true,
    },
    companyName: {
      type: String,
      default: '',
    },
    selectedLanguage: { // Questa prop riceve la lingua nel formato xx-XX
      type: String,
      default: 'it-IT',
    },
  },
  data() {
    return {
      authStore: useAuthStore(),
      router: useRouter(),
      defect: {
        id: null,
        code: '',
        title: '',      // Inizializzato a stringa vuota
        description: '', // Inizializzato a stringa vuota
      },
      isLoading: false,
      error: null,
    };
  },
  computed: {
    isTitleValid() {
      // Controlla che il titolo non sia null/undefined prima di chiamare trim()
      return (this.defect.title || '').trim().length > 0;
    },
    isDescriptionValid() {
      // Controlla che la descrizione non sia null/undefined prima di chiamare trim()
      return (this.defect.description || '').trim().length > 0;
    },
    isFormValid() {
      return this.isTitleValid && this.isDescriptionValid;
    },
    /**
     * Restituisce il nome completo della lingua basato sul codice selezionato.
     */
    displayedLanguageName() {
      const language = languagesData.find(lang => lang.code === this.selectedLanguage);
      return language ? language.name : this.selectedLanguage;
    }
  },
  mounted() {
    // Aggiunto console.log per verificare il valore di selectedLanguage
    console.log('EditDefectView mounted. selectedLanguage received:', this.selectedLanguage);
    this.fetchDefectDetails();
  },
  methods: {
    /**
     * Verifica se un token JWT è scaduto.
     * @param {string} token - Il token JWT da verificare.
     * @returns {boolean} - True se il token è scaduto o non valido, false altrimenti.
     */
    isTokenExpired(token) {
      if (!token) {
        console.warn('isTokenExpired: Token non presente.');
        return true;
      }

      try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) {
          console.warn('isTokenExpired: Payload del token mancante o non valido.');
          return true;
        }

        const decodedPayload = JSON.parse(atob(payloadBase64));

        const expirationDateString = decodedPayload.expiration_date;
        if (!expirationDateString) {
          console.warn('isTokenExpired: Campo "expiration_date" non trovato nel payload del token.');
          return true;
        }

        const expirationTime = new Date(expirationDateString);

        if (isNaN(expirationTime.getTime())) {
          console.error('isTokenExpired: Impossibile parsare la data di scadenza:', expirationDateString);
          return true;
        }

        const currentTimeMs = Date.now();
        const leewayMs = 5 * 60 * 1000; // 5 minuti di tolleranza

        if (expirationTime.getTime() < currentTimeMs - leewayMs) {
          console.warn('Il token JWT è scaduto (o sta per scadere, con tolleranza).');
          return true;
        }
        return false;
      } catch (e) {
        console.error('isTokenExpired: Errore durante la decodifica o la verifica del token JWT:', e);
        return true;
      }
    },
    /**
     * Restituisce la classe CSS per la validazione del campo input.
     * @param {boolean} isValid - Indica se il campo è valido.
     * @param {string} value - Il valore del campo.
     * @param {boolean} isOptional - Indica se il campo è opzionale.
     * @param {boolean} isReadonly - Indica se il campo è di sola lettura.
     * @returns {string} - La classe CSS per il bordo.
     */
    getValidationClass(isValid, value, isOptional, isReadonly = false) {
      if (isReadonly) {
        return 'border-orange'; // Ora restituisce la classe per il bordo arancione
      }
      const trimmedValue = String(value || '').trim();
      if (trimmedValue === '') {
        return isOptional ? 'border-blue' : 'border-red'; // Blu se opzionale, rosso se obbligatorio
      }
      return isValid ? 'border-green' : 'border-red';
    },
    /**
     * Recupera i dettagli del difetto dall'API.
     */
    async fetchDefectDetails() {
      this.isLoading = true;
      this.error = null;

      if (
        !this.authStore.isAuthenticated ||
        !this.authStore.token ||
        this.isTokenExpired(this.authStore.token)
      ) {
        this.error = 'Sessione scaduta o non autenticata. Impossibile caricare i dettagli.';
        await this.authStore.logout();
        this.router.push('/');
        return;
      }

      try {
        const apiUrl = `http://localhost:8000/api/item_issue/${this.defectId}`;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authStore.token}`,
          'Language': this.selectedLanguage, // Usa la lingua ricevuta dalla prop
          'Customer': this.companyName, // Passa l'header Customer
        };

        const response = await fetch(apiUrl, {
          method: 'GET',
          mode: 'cors',
          headers: headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`
          );
        }

        const item = await response.json();
        console.log('Dettagli difetto ricevuti:', item);

        // Popola l'oggetto defect con i dati ricevuti, gestendo null con stringhe vuote
        this.defect = {
          id: item.id,
          code: item.code || '',
          title: item.title || '',      // Assicurati che sia una stringa vuota se null
          description: item.description || '', // Assicurati che sia una stringa vuota se null
          // Assicurati di mappare tutti i campi rilevanti
        };
      } catch (e) {
        console.error('Errore nel recupero dei dettagli del difetto:', e);
        this.error = `Impossibile caricare i dettagli del difetto: ${e.message}.`;
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Salva le modifiche al difetto tramite chiamata API (PUT/PATCH).
     */
    async saveDefect() {
      if (!this.isFormValid) {
        alert('Per favore, compila tutti i campi obbligatori correttamente.');
        return;
      }

      if (
        !this.authStore.isAuthenticated ||
        !this.authStore.token ||
        this.isTokenExpired(this.authStore.token)
      ) {
        this.error = 'Sessione scaduta o non autenticata. Impossibile salvare le modifiche.';
        await this.authStore.logout();
        this.router.push('/');
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const apiUrl = `http://localhost:8000/api/item_issue/${this.defectId}`; // Endpoint per l'aggiornamento
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authStore.token}`,
          'Language': this.selectedLanguage, // Usa la lingua ricevuta dalla prop
          'Customer': this.companyName,
        };

        const payload = {
          // Invia solo i campi che possono essere modificati
          title: this.defect.title,
          description: this.defect.description,
          // Se la tua API richiede anche il tag_language per la modifica:
          tag_language: this.selectedLanguage,
        };

        const response = await fetch(apiUrl, {
          method: 'PUT', // O 'PATCH' a seconda di come è configurata la tua API
          mode: 'cors',
          headers: headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`
          );
        }

        const result = await response.json();
        console.log('Difetto aggiornato con successo:', result);
        this.$emit('defect-updated'); // Notifica il componente padre che un difetto è stato aggiornato
        this.$emit('close'); // Chiudi la vista dopo il salvataggio

      } catch (e) {
        console.error('Errore durante il salvataggio delle modifiche:', e);
        this.error = `Impossibile salvare le modifiche: ${e.message}.`;
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Annulla l'operazione e chiude la vista.
     */
    cancel() {
      console.log('Operazione annullata. Chiusura vista Modifica Difetto.');
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
/* Stili globali per l'overlay e il contenuto, copiati dalle viste precedenti */
.app-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: 'Inter', sans-serif;
}

.app-view-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%; /* Larghezza della finestra */
  max-width: 1200px; /* Aumentata la larghezza massima per un layout orizzontale */
  max-height: 90%; /* Altezza massima */
  overflow-y: auto;
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
  margin-bottom: 20px;
  font-size: 1.8em;
  text-align: center;
}

/* Stili per la visualizzazione della lingua */
.language-input-field { /* Usiamo questa classe per lo stile del campo input della lingua */
  flex-basis: 100%; /* Occupa tutta la larghezza */
  min-width: unset; /* Rimuovi min-width se presente */
}

/* Stili per la sezione del form */
.form-section {
  display: flex;
  flex-direction: row; /* I campi sono in riga */
  flex-wrap: wrap; /* Permette il wrap su schermi più piccoli */
  gap: 15px; /* Spazio tra i campi */
  margin-bottom: 20px;
}

.input-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1; /* Ogni campo occupa uno spazio uguale */
  min-width: 200px; /* Larghezza minima per evitare che si comprimano troppo */
}

/* Stili specifici per i campi all'interno del form-section */
.code-field {
  flex-basis: 10%; /* Codice più piccolo (circa 1 unità) */
  min-width: 80px; /* Larghezza minima per il codice */
}
.title-field {
  flex-basis: 40%; /* Titolo di dimensione media */
  min-width: 250px;
}
.description-field {
  flex-basis: 45%; /* Descrizione la più grande */
  min-width: 300px;
}


.input-field-group label {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: block;
}

.input-field-group input[type='text'],
.input-field-group textarea {
  width: calc(100% - 22px); /* Regola per padding/bordo */
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
}

.input-field-group input[type='text']:focus,
.input-field-group textarea:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  border-color: #007bff;
}

.input-field-group input[readonly] {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.loading-indicator, .error-message {
  text-align: center;
  padding: 20px;
  color: #555;
  font-style: italic;
}
.error-message {
  color: #dc3545;
  font-weight: bold;
}

/* Stili per i pulsanti di azione */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.save-button,
.cancel-button {
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

.save-button:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.save-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
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

/* Classi per la validazione */
.input-field-group input.border-red,
.input-field-group textarea.border-red {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25) !important;
}

.input-field-group input.border-green,
.input-field-group textarea.border-green {
  border-color: #28a745 !important;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25) !important;
}

.input-field-group input.border-blue,
.input-field-group textarea.border-blue {
  border-color: #007bff !important;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
}

.input-field-group input.border-orange,
.input-field-group textarea.border-orange {
  border-color: #ffb700 !important;
  box-shadow: 0 0 0 2px rgba(255, 187, 0, 0.25) !important;
}



/* Media query per la responsività del form */
@media (max-width: 768px) {
  .form-section {
    flex-direction: column; /* Torna a colonna su schermi piccoli */
  }
  .input-field-group {
    min-width: unset; /* Rimuove la larghezza minima */
    width: 100%;
  }
  .code-field, .title-field, .description-field {
    flex-basis: auto; /* Resetta le basi flessibili */
    min-width: unset;
  }
}
</style>