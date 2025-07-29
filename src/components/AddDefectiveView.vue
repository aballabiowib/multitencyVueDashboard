<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="cancel" class="close-button">X</button>
      <h3>Inserisci Nuovo Difetto</h3>

      <div class="form-section">
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

      <ValidationLegend />

      <div class="action-buttons">
        <button @click="saveDefect" class="save-button" :disabled="!isFormValid || isLoading">
          Salva
        </button>
        <button @click="cancel" class="cancel-button">Annulla</button>
      </div>
    </div>

    <!-- Modale di Attenzione per errori di generazione codice -->
    <div v-if="showErrorModal" class="error-modal-overlay">
      <div class="error-modal-content">
        <h4>Attenzione!</h4>
        <p>{{ errorMessageForModal }}</p>
        <button @click="closeErrorModal" class="ok-button">Ok, letto</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import ValidationLegend from '@/components/ValidationLegend.vue'; // Assumendo questo percorso

export default {
  name: 'AddDefectView',
  components: {
    ValidationLegend,
  },
  emits: ['close', 'defect-added'], // Emette 'defect-added' al salvataggio riuscito
  props: {
    companyName: {
      type: String,
      default: '',
    },
    selectedLanguage: {
      type: String,
      default: 'it-IT',
    },
    // Prop per ricevere i difetti esistenti dal componente padre (DefectListView)
    existingDefects: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      authStore: useAuthStore(),
      router: useRouter(),
      defect: {
        // L'ID sarà assegnato dal backend al momento del salvataggio
        id: null,
        code: '',
        title: '',
        description: '',
      },
      codeGenerationError: null, // Mantenuto per coerenza, ma il messaggio va in errorMessageForModal
      isLoading: false,
      error: null,

      // Nuovi stati per la modale di errore
      showErrorModal: false,
      errorMessageForModal: '',
    };
  },
  computed: {
    isTitleValid() {
      // Validazione: il titolo non deve essere vuoto
      return (this.defect.title || '').trim().length > 0;
    },
    isDescriptionValid() {
      // Validazione: la descrizione non deve essere vuota
      return (this.defect.description || '').trim().length > 0;
    },
    isFormValid() {
      // Il form è valido se titolo e descrizione sono validi e non ci sono errori di generazione codice
      // L'errore di generazione codice ora blocca il salvataggio se la modale è attiva o il messaggio è presente.
      return this.isTitleValid && this.isDescriptionValid && !this.codeGenerationError;
    },
  },
  mounted() {
    // Aggiunto console.log per stampare il valore di existingDefects
    console.log('AddDefectView mounted. existingDefects received:', this.existingDefects);
    this.generateDefectCode();
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
     * Genera il codice del difetto F01-F13, trovando il primo disponibile.
     */
    generateDefectCode() {
      const maxTotalDefects = 13; // Il numero massimo totale di difetti consentiti (F01-F13 significa 13 difetti)
      const maxCodeIndex = 13;    // L'indice massimo per un codice (F01 a F13)

      // Ottieni il conteggio corrente dei difetti
      const currentDefectCount = this.existingDefects.length;

      // Se il numero totale di difetti è già uguale o superiore al massimo consentito, mostra errore
      if (currentDefectCount >= maxTotalDefects) {
        this.errorMessageForModal = `Attenzione!!! Puoi solo avere ${maxTotalDefects} messaggi di errore.`;
        this.codeGenerationError = true; // Imposta un flag per disabilitare il form
        this.defect.code = ''; // Assicurati che il campo codice sia vuoto
        this.showErrorModal = true; // Mostra la modale
        return; // Ferma l'esecuzione qui
      }

      // Se il limite non è stato raggiunto, trova il primo codice disponibile da F01 a F13
      const existingCodes = new Set(this.existingDefects.map((d) => d.code));
      let foundCode = false;

      for (let i = 1; i <= maxCodeIndex; i++) { // Cicla da F01 a F13
        const code = `F${String(i).padStart(2, '0')}`;
        if (!existingCodes.has(code)) {
          this.defect.code = code;
          foundCode = true;
          break;
        }
      }

      if (!foundCode) {
        // Questo caso dovrebbe verificarsi solo se maxTotalDefects è maggiore di maxCodeIndex,
        // o se la logica di existingDefects è errata.
        this.errorMessageForModal = `Errore interno: impossibile trovare un codice disponibile nonostante ci siano slot liberi.`;
        this.codeGenerationError = true;
        this.defect.code = '';
        this.showErrorModal = true;
      } else {
        this.codeGenerationError = null; // Pulisci qualsiasi errore precedente
        this.errorMessageForModal = '';
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
     * Salva il nuovo difetto tramite chiamata API.
     */
    async saveDefect() {
      if (!this.isFormValid) {
        alert('Per favor, compila tutti i campi obbligatori correttamente.');
        return;
      }

      // Controllo del token prima di ogni chiamata API
      if (
        !this.authStore.isAuthenticated ||
        !this.authStore.token ||
        this.isTokenExpired(this.authStore.token)
      ) {
        this.error = 'Sessione scaduta o non autenticata. Impossibile salvare il difetto.';
        await this.authStore.logout();
        this.router.push('/');
        return;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const apiUrl = 'http://localhost:8000/api/item_issue'; // Assumendo che l'endpoint POST sia lo stesso
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authStore.token}`,
          'Language': this.selectedLanguage,
          'Customer': this.companyName,
        };

        const payload = {
          code: this.defect.code,
          title: this.defect.title,
          description: this.defect.description,
          tag_language: this.selectedLanguage, // Aggiunto tag_language al payload
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
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
        console.log('Defetto salvato con successo:', result);
        this.$emit('defect-added'); // Notifica il componente padre che un difetto è stato aggiunto
        this.$emit('close'); // Chiudi la vista dopo il salvataggio

      } catch (e) {
        console.error('Errore durante il salvataggio del difetto:', e);
        this.error = `Impossibile salvare il difetto: ${e.message}.`;
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Annulla l'operazione e chiude la vista.
     */
    cancel() {
      console.log('Operazione annullata. Chiusura vista Inserimento Difetto.');
      this.$emit('close');
    },
    /**
     * Chiude la modale di errore e la vista AddDefectView.
     */
    closeErrorModal() {
      this.showErrorModal = false;
      this.errorMessageForModal = '';
      this.cancel(); // Chiude anche la vista AddDefectView
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
  max-width: 1200px; /* Larghezza massima aumentata per i 3 input su una riga */
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

/* Stili per la sezione del form */
.form-section {
  display: flex;
  flex-direction: row; /* Modificato: ora i campi sono in riga */
  flex-wrap: wrap; /* Permette il wrap su schermi piccoli */
  gap: 15px; /* Spazio tra i campi */
  margin-bottom: 20px;
}

.input-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1; /* Ogni campo occupa uno spazio uguale */
  min-width: 250px; /* Larghezza minima per evitare che si comprimano troppo */
}

/* Stili specifici per i campi all'interno del form-section */
.code-field {
  flex-basis: 15%; /* Codice più piccolo */
  min-width: 120px;
}
.title-field {
  flex-basis: 40%; /* Titolo più grande */
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

.error-message-inline {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 5px;
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

/* Classi per la validazione (copiate da CustomerView o stili comuni) */
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
  border-color: #FF9800 !important; /* Arancione per i campi readonly */
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.25) !important; /* Ombra arancione */
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