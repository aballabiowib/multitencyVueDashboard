<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="$emit('close')" class="close-button">X</button>
      <h3>Elenco Difetti</h3>

      <div class="header-controls">
        <!-- Dropdown per la selezione della lingua -->
        <div class="language-selector">
          <label for="languageSelect">Lingua Messaggi:</label>
          <select id="languageSelect" v-model="selectedLanguage" class="language-dropdown">
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>

        <!-- Pulsante "Aggiungi Nuovo Difetto" -->
        <button @click="openAddDefectView" class="add-defect-button">
          Aggiungi Nuovo Difetto
        </button>
      </div>

      <!-- Sezione Tabella dei difetti -->
      <div class="defects-table-section">
        <div v-if="isLoading" class="loading-indicator">Caricamento difetti...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="paginatedDefects.length === 0 && !isLoading" class="no-data-message">Nessun difetto trovato.</div>
        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Codice</th>
                <th>Titolo</th>
                <th>Descrizione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="defect in paginatedDefects" :key="defect.id">
                <td>{{ defect.id }}</td>
                <td>{{ defect.code }}</td>
                <td>{{ defect.title }}</td>
                <td>{{ defect.description }}</td>
                <td class="actions-cell">
                  <button @click="editDefect(defect)" class="action-icon-button edit-button" title="Modifica">
                    <img :src="EditingIcon" class="icon-svg" alt="Modifica" />
                  </button>
                  <button @click="deleteDefect(defect.id)" class="action-icon-button delete-button" title="Elimina">
                    <img :src="TrashIcon" class="icon-svg" alt="Elimina" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginator -->
        <div v-if="totalPages > 1" class="pagination-controls">
          <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1 || isLoading" class="pagination-button">Precedente</button>
          <span>Pagina {{ currentPage }} di {{ totalPages }}</span>
          <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages || isLoading" class="pagination-button">Successiva</button>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="cancel" class="cancel-button">Annulla</button>
      </div>
    </div>

    <!-- Overlay per la vista di aggiunta/modifica difetto -->
    <component 
      :is="currentDefectFormView" 
      v-if="showDefectFormOverlay" 
      v-bind="currentDefectFormProps"
      @close="closeDefectFormView" 
      @defect-added="handleDefectAdded"
      @defect-updated="handleDefectUpdated"
    />
  </div>
</template>

<script>
import EditingIcon from '@/assets/icons/editing.svg'; // Importa l'icona di modifica
import TrashIcon from '@/assets/icons/trash.svg';     // Importa l'icona del cestino
import { useAuthStore } from '@/stores/auth';         // Importa lo store di autenticazione
import { useRouter } from 'vue-router';               // Importa il router di Vue
import { languagesData } from '@/utils/language';     // Importa i dati delle lingue dal nuovo file
import { shallowRef } from 'vue';                     // Importa shallowRef per i componenti dinamici

// Importa i nuovi componenti per l'inserimento e la modifica dei difetti
import AddDefectView from '@/components/AddDefectiveView.vue';
import EditDefectView from '@/components/EditDefectiveView.vue'; // Importa EditDefectView

export default {
  name: 'DefectListView',
  emits: ['close'], // Emette solo l'evento 'close' per chiudere la vista
  components: {
    AddDefectView, // Registra il componente AddDefectView
    EditDefectView, // Registra il componente EditDefectView
  },
  props: {
    // Manteniamo companyName per coerenza con le altre viste, anche se non usato direttamente qui.
    companyName: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      authStore: useAuthStore(), // Inizializza lo store di autenticazione
      router: useRouter(),       // Inizializza il router

      // Espone le icone SVG al template
      EditingIcon: EditingIcon,
      TrashIcon: TrashIcon,

      // Dati per la selezione della lingua, ora importati da un file esterno
      languages: languagesData, // Usa i dati importati
      selectedLanguage: 'it-IT', // Lingua predefinita (assicurati che sia presente in languagesData)

      // Dati per la tabella dei difetti
      defectList: [],
      currentPage: 1,
      itemsPerPage: 12,
      totalItems: 0,
      totalPages: 1,
      isLoading: false,
      error: null,

      // Stato per la gestione della vista di aggiunta/modifica difetto
      currentDefectFormView: shallowRef(null), // Componente da visualizzare (AddDefectView o EditDefectView)
      showDefectFormOverlay: false,            // Controlla la visibilità dell'overlay
      currentDefectFormProps: {},              // Props da passare al componente del form
    };
  },

  computed: {
    /**
     * Restituisce i difetti da visualizzare nella pagina corrente (paginazione lato client).
     * Nota: con l'API, questa computed property potrebbe non essere strettamente necessaria
     * se l'API restituisce già solo gli elementi della pagina corrente.
     */
    paginatedDefects() {
      // Se l'API restituisce già i dati paginati, basta ritornare defectList
      return this.defectList;
    },
  },

  watch: {
    // Osserva i cambiamenti nella lingua selezionata
    selectedLanguage(newLang, oldLang) {
      if (newLang !== oldLang) {
        console.log(`Lingua cambiata da ${oldLang} a ${newLang}. Ricarico i difetti.`);
        this.currentPage = 1; // Resetta la paginazione alla prima pagina
        this.fetchDefects(); // Richiama i difetti con la nuova lingua
      }
    }
  },

  mounted() {
    this.fetchDefects(); // Carica i difetti all'avvio del componente
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

        if (expirationTime.getTime() < (currentTimeMs - leewayMs)) {
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
     * Recupera i difetti dall'API.
     */
    async fetchDefects() {
      this.isLoading = true;
      this.error = null;

      // Controllo del token prima di ogni chiamata API
      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.error = 'Sessione scaduta o non autenticata. Impossibile caricare i difetti.';
        this.isLoading = false;
        console.error('Errore: Tentativo di recuperare difetti con token mancante o scaduto.');
        await this.authStore.logout(); // Esegue il logout tramite lo store
        this.router.push('/'); // Reindirizza al login
        return;
      }

      try {
        const apiUrl = 'http://localhost:8000/api/item_issue';
        const queryParams = new URLSearchParams({
          // Aggiungi qui i parametri di ordinamento e paginazione se l'API li supporta
          page: this.currentPage,
          limit: this.itemsPerPage,
          order_by: 'code', // Esempio
          order_dir: 'asc', // Esempio
          page_size: this.itemsPerPage,
        }).toString();

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authStore.token}`,
          'Language': this.selectedLanguage, // Passa la lingua selezionata nell'header
          'Customer': this.companyName, // L'API dei difetti potrebbe richiedere l'header Customer
          'Datatable': '1', // Aggiunto l'header Datatable come richiesto
        };

        const response = await fetch(`${apiUrl}?${queryParams}`, {
          method: 'GET',
          mode: 'cors',
          headers: headers
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const response_query = await response.json();
        console.log('API Response (Item Issue):', response_query); // Per debug

        // Assicurati che la struttura della risposta sia quella attesa
        if (response_query.data && response_query.data.items && response_query.data.pagination) {
          // Mappa i campi della risposta API ai nomi delle colonne della tabella
          this.defectList = response_query.data.items.map(item => ({
            id: item.id,
            code: item.code,
            title: item.title,
            description: item.description,
            // Aggiungi qui altri campi se necessario
          }));
          this.totalItems = response_query.data.pagination.count;
          this.totalPages = response_query.data.pagination.total_pages;
        } else {
          throw new Error("Formato della risposta API non valido.");
        }

      } catch (e) {
        console.error("Errore nel recupero dei difetti:", e);
        this.error = `Impossibile caricare l'elenco dei difetti: ${e.message}.
                      Assicurati che l'API item_issue sia attiva e accessibile.`;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Gestisce il cambio di pagina nella tabella.
     * @param {number} newPage - Il numero della nuova pagina.
     */
    changePage(newPage) {
      if (newPage >= 1 && newPage <= this.totalPages && !this.isLoading) {
        this.currentPage = newPage;
        this.fetchDefects(); // Richiama l'API per la nuova pagina
      }
    },

    /**
     * Gestisce il click sul pulsante "Aggiungi Nuovo Difetto".
     * Questa funzione aprirà una nuova vista per l'inserimento dei difetti.
     */
    async openAddDefectView() {
      // Controllo del token prima di aprire la vista di aggiunta
      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.error = 'Sessione scaduta o non autenticata. Impossibile aggiungere un nuovo difetto.';
        console.error('Errore: Tentativo di aprire vista aggiunta difetto con token mancante o scaduto.');
        await this.authStore.logout();
        this.router.push('/');
        return;
      }
      console.log('Apertura pagina per l\'inserimento di un nuovo difetto.');
      
      this.currentDefectFormView = AddDefectView; // Imposta il componente da visualizzare
      this.currentDefectFormProps = {
        companyName: this.companyName,
        selectedLanguage: this.selectedLanguage,
        existingDefects: this.defectList.map(d => ({ code: d.code })) // Passa solo i codici esistenti
      };
      this.showDefectFormOverlay = true; // Mostra l'overlay
    },

    /**
     * Chiude la vista di aggiunta/modifica difetto.
     */
    closeDefectFormView() {
      this.showDefectFormOverlay = false;
      this.currentDefectFormView = null;
      this.currentDefectFormProps = {};
      console.log('Chiusura vista Inserimento Difetto.');
    },

    /**
     * Gestisce l'evento 'defect-added' emesso da AddDefectView.
     * Ricarica la lista dei difetti per mostrare il nuovo elemento.
     */
    handleDefectAdded() {
      console.log('Nuovo difetto aggiunto. Ricarico la lista.');
      this.currentPage = 1; // Torna alla prima pagina per vedere il nuovo difetto
      this.fetchDefects();
    },

    /**
     * Gestisce l'evento 'defect-updated' emesso da EditDefectView.
     * Ricarica la lista dei difetti per mostrare l'elemento aggiornato.
     */
    handleDefectUpdated() {
      console.log('Difetto aggiornato. Ricarico la lista.');
      this.fetchDefects(); // Ricarica la lista per riflettere le modifiche
    },

    /**
     * Gestisce la modifica di un difetto.
     * @param {Object} defect - L'oggetto difetto da modificare.
     */
    async editDefect(defect) {
      // Controllo del token prima di modificare
      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.error = 'Sessione scaduta o non autenticata. Impossibile modificare il difetto.';
        console.error('Errore: Tentativo di modificare difetto con token mancante o scaduto.');
        await this.authStore.logout();
        this.router.push('/');
        return;
      }
      console.log('Apertura pagina per la modifica del difetto:', defect.id);
      
      this.currentDefectFormView = EditDefectView; // Imposta il componente di modifica
      this.currentDefectFormProps = {
        defectId: defect.id, // Passa l'ID del difetto da modificare
        companyName: this.companyName,
        selectedLanguage: this.selectedLanguage,
      };
      this.showDefectFormOverlay = true; // Mostra l'overlay
    },

    /**
     * Gestisce l'eliminazione di un difetto.
     * @param {string|number} id - L'ID del difetto da eliminare.
     */
    async deleteDefect(id) {
      // Controllo del token prima di eliminare
      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.error = 'Sessione scaduta o non autenticata. Impossibile eliminare il difetto.';
        console.error('Errore: Tentativo di eliminare difetto con token mancante o scaduto.');
        await this.authStore.logout();
        this.router.push('/');
        return;
      }

      console.log('Elimina difetto con ID:', id);
      if (confirm(`Sei sicuro di voler eliminare il difetto con ID: ${id}?`)) {
        this.isLoading = true;
        this.error = null;
        try {
          const apiUrl = `http://localhost:8000/api/item_issue/${id}`; // URL API per DELETE
          const headers = {
            'Authorization': `Bearer ${this.authStore.token}`,
            'Customer': this.companyName, // Se l'API dei difetti richiede l'header Customer
            'Language': this.selectedLanguage,
          };
          const response = await fetch(apiUrl, {
            method: 'DELETE',
            mode: 'cors',
            headers: headers
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
          }

          console.log('Difetto eliminato con successo.');
          // Dopo l'eliminazione, ricarica i dati per aggiornare la tabella
          this.fetchDefects();

        } catch (e) {
          console.error('Errore durante l\'eliminazione:', e);
          this.error = `Errore durante l\'eliminazione: ${e.message}`;
        } finally {
          this.isLoading = false;
        }
      }
    },

    /**
     * Metodo chiamato quando l'utente clicca su "Annulla".
     * Emette semplicemente l'evento 'close' per chiudere la vista.
     */
    cancel() {
      console.log('Operazione annullata. Chiusura vista DefectList.');
      this.$emit('close');
    }
  }
}
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
  width: 95%; /* Leggermente più largo per la tabella */
  max-width: 1500px; /* Larghezza massima aumentata per la legenda su una riga */
  max-height: 95%; /* Altezza massima aumentata */
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
  margin-bottom: 10px;
  font-size: 1.8em;
  text-align: center;
}

/* Stili per la sezione header con dropdown e pulsante */
.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap; /* Permette il wrap su schermi piccoli */
  gap: 15px; /* Spazio tra gli elementi */
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.language-selector label {
  font-weight: bold;
  color: #333;
  white-space: nowrap; /* Evita che la label vada a capo */
}

.language-dropdown {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 1em;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
}

.language-dropdown:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  border-color: #007bff;
}

.add-defect-button {
  padding: 10px 20px;
  background-color: #28a745; /* Verde per l'aggiunta */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
  white-space: nowrap; /* Evita che il testo del pulsante vada a capo */
}

.add-defect-button:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

/* Stili per la tabella */
.defects-table-section {
  flex-grow: 1; /* Permette alla tabella di occupare lo spazio rimanente */
  display: flex;
  flex-direction: column;
}

.loading-indicator, .error-message, .no-data-message {
  text-align: center;
  padding: 20px;
  color: #555;
  font-style: italic;
}

.error-message {
  color: #dc3545;
  font-weight: bold;
}

.table-container {
  overflow-x: auto; /* Permette lo scroll orizzontale su schermi piccoli */
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 15px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px; /* Larghezza minima per la tabella */
}

table th, table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

table th {
  background-color: #f2f2f2;
  color: #333;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.9em;
}

table tbody tr:hover {
  background-color: #f5f5f5;
}

/* Stili per le celle delle azioni e i pulsanti icona */
.actions-cell {
  white-space: nowrap; /* Impedisce ai pulsanti di andare a capo */
  text-align: center; /* Centra le icone */
}

.action-icon-button {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  margin: 0 5px; /* Spazio tra le icone */
  transition: transform 0.2s ease;
}

.action-icon-button:hover {
  transform: scale(1.1);
}

.icon-svg {
  width: 20px; /* Dimensione delle icone */
  height: 20px;
  vertical-align: middle; /* Allinea l'icona al centro del testo */
}

.edit-button .icon-svg {
  color: #007bff; /* Colore blu per l'icona di modifica */
}

.delete-button .icon-svg {
  color: #dc3545; /* Colore rosso per l'icona di eliminazione */
}

/* Stili per il paginator */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.pagination-button {
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.pagination-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.pagination-controls span {
  font-weight: bold;
  color: #555;
}

/* Stili per i pulsanti di azione (Annulla) */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.cancel-button {
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
  background-color: #6c757d;
  color: white;
  border: 1px solid #6c757d;
}

.cancel-button:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
}

/* Media query per la responsività */
@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .language-selector {
    width: 100%;
    justify-content: space-between;
  }
  .add-defect-button {
    width: 100%;
  }
  .table-container {
    min-width: unset; /* Rimuove la larghezza minima per la tabella */
  }
}
</style>