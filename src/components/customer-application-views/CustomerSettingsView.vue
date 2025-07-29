<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="$emit('close')" class="close-button">X</button>
      <h3>Impostazioni Clienti</h3>

      <!-- Sezione Aggiungi nuova impostazione -->
      <div class="add-setting-box">
        <h4>Aggiungi una nuova impostazione</h4>
        <div class="input-row">
          <div class="input-field-group param-name-field">
            <label for="paramName">Nome parametro:</label>
            <input type="text" id="paramName" v-model="newSetting.parameterName" placeholder="Es. timeout_sessione">
          </div>
          <div class="input-field-group param-value-field">
            <label for="paramValue">Valore parametro:</label>
            <input type="text" id="paramValue" v-model="newSetting.parameterValue" placeholder="Es. 3600">
          </div>
          <div class="input-field-group id-field">
            <label for="machineId">ID Macchina:</label>
            <input type="text" id="machineId" v-model="newSetting.machineId" placeholder="Es. MCH001">
          </div>
          <div class="input-field-group id-field">
            <label for="locationId">ID Località:</label>
            <input type="text" id="locationId" v-model="newSetting.locationId" placeholder="Es. LOC001">
          </div>
          <button @click="addSetting" class="add-button">Aggiungi</button>
        </div>
      </div>

      <!-- Legenda di Validazione -->
      <ValidationLegend />

      <!-- Sezione Tabella delle impostazioni -->
      <div class="settings-table-section">
        <div v-if="isLoading" class="loading-indicator">Caricamento impostazioni...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="paginatedSettings.length === 0 && !isLoading" class="no-data-message">Nessuna impostazione trovata.</div>
        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Valore</th>
                <th>ID Macchina</th>
                <th>ID Località</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="setting in paginatedSettings" :key="setting.customer_settings_id">
                <td>{{ setting.customer_settings_id }}</td>
                <td>{{ setting.name }}</td>
                <td>{{ setting.value }}</td>
                <td>{{ setting.machine_id }}</td>
                <td>{{ setting.location_id }}</td>
                <td class="actions-cell">
                  <button @click="editSetting(setting)" class="action-icon-button edit-button" title="Modifica">
                    <img :src="EditingIcon" class="icon-svg" alt="Modifica" />
                  </button>
                  <button @click="deleteSetting(setting.customer_settings_id)" class="action-icon-button delete-button" title="Elimina">
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
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'; // Importa lo store di autenticazione
import EditingIcon from '@/assets/icons/editing.svg'; // Importa l'icona di modifica
import TrashIcon from '@/assets/icons/trash.svg';     // Importa l'icona del cestino
import ValidationLegend from '@/components/ValidationLegend.vue'; // Importa il componente leggenda

export default {
  name: 'CustomerSettingsView',
  emits: ['close', 'save'],
  components: {
    ValidationLegend // Registra il componente leggenda
  },
  props: {
    // La prop companyName è definita qui per ricevere il nome dell'azienda selezionata
    companyName: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      authStore: useAuthStore(), // Inizializza lo store di autenticazione
      EditingIcon: EditingIcon,   // Espone l'icona di modifica al template
      TrashIcon: TrashIcon,       // Espone l'icona del cestino al template
      newSetting: {
        parameterName: '',
        parameterValue: '',
        machineId: '',
        locationId: '',
      },
      allCustomerSettings: [], // Contiene i dati della pagina corrente dall'API
      currentPage: 1,
      itemsPerPage: 10, // Questo potrebbe essere dinamico dalla tua API se supportato
      totalItems: 0,
      totalPages: 1, // Inizializzato a 1, sarà aggiornato dall'API
      isLoading: false,
      error: null,
    };
  },

  computed: {
    /**
     * Restituisce le impostazioni da visualizzare nella pagina corrente.
     * I dati sono già paginati dall'API.
     */
    paginatedSettings() {
      return this.allCustomerSettings;
    },
  },

  watch: {
    // Osserva la prop companyName
    companyName(newVal, oldVal) {
      // Se companyName cambia da vuoto a un valore non vuoto, o se cambia proprio valore
      if (newVal && newVal !== oldVal) {
        console.log('companyName changed, re-fetching settings:', newVal);
        this.currentPage = 1; // Resetta la pagina a 1 quando cambia il cliente
        this.fetchCustomerSettings();
      } else if (!newVal && oldVal) {
        // Se companyName diventa vuoto (es. cliente deselezionato), pulisci i dati
        this.allCustomerSettings = [];
        this.totalItems = 0;
        this.totalPages = 1;
        this.error = "Nessun cliente selezionato. Seleziona un cliente per visualizzare le impostazioni.";
        this.isLoading = false;
      }
    }
  },

  mounted() {
    // Viene loggato il companyName ricevuto per debug
    console.log('CustomerSettingsView mounted. companyName received:', this.companyName);
    // Effettua la chiamata API solo se companyName è già disponibile al mount
    if (this.companyName) {
      this.fetchCustomerSettings();
    } else {
      this.error = `Errore: Il nome del cliente (companyName) non è stato fornito al caricamento.
                    Seleziona un cliente dalla FilteredSidebar.`;
      this.isLoading = false;
    }
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
     * Recupera le impostazioni del cliente dall'API.
     */
    async fetchCustomerSettings() {
      this.isLoading = true;
      this.error = null;

      // Controllo del token prima di ogni chiamata API
      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.error = 'Sessione scaduta o non autenticata. Impossibile caricare le impostazioni.';
        this.isLoading = false;
        console.error('Errore: Tentativo di recuperare impostazioni con token mancante o scaduto.');
        await this.authStore.logout(); // Esegue il logout tramite lo store
        this.$router.push('/'); // Reindirizza al login
        return;
      }

      // Controllo se companyName è stato fornito prima di fare la chiamata API
      if (!this.companyName) {
        this.error = `Errore: Il nome del cliente (companyName) non è stato fornito.
                      Assicurati che il componente genitore passi la prop 'companyName'
                      con il nome dell'azienda selezionata dalla FilteredSidebar.`;
        this.isLoading = false;
        console.error(this.error);
        return; // Interrompi l'esecuzione se companyName è vuoto
      }

      try {
        const apiUrl = 'http://localhost:8000/api/customer_setting';
        const queryParams = new URLSearchParams({
          sort_by: 'customer_settings_id',
          order_dir: 'asc',
          page: this.currentPage,
          limit: this.itemsPerPage, // Invia il limite per pagina all'API
          // filter: JSON.stringify({}) // Se il filtro è un oggetto vuoto, potresti non inviarlo o inviarlo come stringa vuota
        }).toString();

        const headers = {
          'Datatable': '1',
          'Content-Type': 'application/json',
          'Customer': this.companyName, // L'header 'Customer' viene impostato con il valore della prop
          'Authorization': `Bearer ${this.authStore.token}`, // Aggiunto l'header di autorizzazione
          'Language': this.authStore.selectedLanguage || 'en-EN', // Aggiunto l'header Language
        };

        const response = await fetch(`${apiUrl}?${queryParams}`, {
          method: 'GET', // Specificato il metodo GET
          mode: 'cors',  // Aggiunto mode: 'cors' per gestire le richieste cross-origin
          headers: headers
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const response_query = await response.json();
        console.log('API Response:', response_query); // Per debug

        // Assicurati che la struttura della risposta sia quella attesa
        if (response_query.data && response_query.data.items && response_query.data.pagination) {
          // Mappa i campi della risposta API ai nomi delle colonne della tabella
          this.allCustomerSettings = response_query.data.items.map(item => ({
            customer_settings_id: item.customer_settings_id,
            name: item.name,
            value: item.value,
            machine_id: item.machine_id,
            location_id: item.location_id,
            // Aggiungi qui altri campi se necessario
          }));
          this.totalItems = response_query.data.pagination.count;
          this.totalPages = response_query.data.pagination.total_pages;
        } else {
          throw new Error("Formato della risposta API non valido.");
        }

      } catch (e) {
        console.error("Errore nel recupero delle impostazioni:", e);
        // Messaggio più specifico per l'utente
        this.error = `Impossibile caricare le impostazioni: ${e.message}.
                      Il backend ha negato la richiesta. Assicurati che il tuo middleware
                      'TenantDatabaseMiddleware' consenta le richieste OPTIONS senza richiedere l'header 'Customer'
                      e che l'header 'Customer' sia presente e valido per le richieste GET.`;
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
        this.fetchCustomerSettings(); // Richiama l'API per la nuova pagina
      }
    },

    /**
     * Aggiunge una nuova impostazione (simulato).
     * In un'applicazione reale, qui faresti una fetch() o axios.post() per aggiungere il record.
     * Dopo l'aggiunta, dovresti richiamare `fetchCustomerSettings()` per aggiornare la tabella.
     */
    async addSetting() {
      if (this.newSetting.parameterName && this.newSetting.parameterValue) {
        // Controllo del token prima di ogni chiamata API
        if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
          this.error = 'Sessione scaduta o non autenticata. Impossibile aggiungere l\'impostazione.';
          this.isLoading = false;
          console.error('Errore: Tentativo di aggiungere impostazione con token mancante o scaduto.');
          await this.authStore.logout(); // Esegue il logout tramite lo store
          this.$router.push('/'); // Reindirizza al login
          return;
        }

        console.log('Nuova impostazione da aggiungere:', this.newSetting);
        // Simula l'invio all'API
        this.isLoading = true;
        this.error = null;
        try {
          // Esempio di chiamata POST (da adattare alla tua API)
          /*
          const response = await fetch('http://localhost:8000/api/customer_setting', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Datatable': '1',
              'Customer': this.companyName, // Aggiunto l'header 'Customer' anche per la POST
              'Authorization': `Bearer ${this.authStore.token}`, // Aggiunto l'header di autorizzazione
              'Language': this.authStore.selectedLanguage || 'en-EN', // Aggiunto l'header Language
            },
            body: JSON.stringify(this.newSetting)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
          }

          const result = await response.json();
          console.log('Impostazione aggiunta con successo:', result);
          */

          // Per la demo, aggiungiamo direttamente ai dati e ricarichiamo
          await new Promise(resolve => setTimeout(resolve, 500)); // Simula un ritardo
          // Dopo aver aggiunto con successo, ricarica i dati per vedere l'aggiornamento
          this.newSetting = {
            parameterName: '',
            parameterValue: '',
            machineId: '',
            locationId: '',
          };
          this.currentPage = 1; // Torna alla prima pagina per vedere il nuovo record
          this.fetchCustomerSettings();

        } catch (e) {
          console.error('Errore durante l\'aggiunta:', e);
          this.error = `Impossibile aggiungere l'impostazione: ${e.message}.`;
        } finally {
          this.isLoading = false;
        }
      } else {
        alert('Nome parametro e Valore parametro sono obbligatori.');
      }
    },

    /**
     * Gestisce la modifica di un'impostazione.
     * @param {Object} setting - L'oggetto impostazione da modificare.
     */
    editSetting(setting) {
      console.log('Modifica impostazione:', setting);
      // Implementa qui la logica per aprire un form di modifica
      // e pre-popolarlo con i dati di 'setting'.
    },

    /**
     * Gestisce l'eliminazione di un'impostazione.
     * @param {string|number} id - L'ID dell'impostazione da eliminare.
     */
    deleteSetting(id) {
      console.log('Elimina impostazione con ID:', id);
      // Implementa qui la logica per la chiamata API DELETE.
      // Dopo l'eliminazione, ricarica i dati: this.fetchCustomerSettings();
      if (confirm(`Sei sicuro di voler eliminare l'impostazione con ID: ${id}?`)) {
        // Simula l'eliminazione
        this.allCustomerSettings = this.allCustomerSettings.filter(s => s.customer_settings_id !== id);
        this.totalItems--;
        console.log('Impostazione eliminata (simulato).');
        // In una vera app:
        /*
        fetch(`http://localhost:8000/api/customer_setting/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.authStore.token}`,
            'Customer': this.companyName,
            'Language': this.authStore.selectedLanguage || 'en-EN',
          }
        })
        .then(response => {
          if (response.ok) {
            console.log('Impostazione eliminata con successo.');
            this.fetchCustomerSettings(); // Ricarica i dati
          } else {
            return response.json().then(err => { throw new Error(err.message || 'Errore durante l\'eliminazione'); });
          }
        })
        .catch(e => {
          console.error('Errore durante l\'eliminazione:', e);
          this.error = `Errore durante l\'eliminazione: ${e.message}`;
        });
        */
      }
    },

    /**
     * Metodo chiamato quando l'utente clicca su "Annulla".
     * Emette semplicemente l'evento 'close' per chiudere la vista senza salvare.
     */
    cancel() {
      console.log('Operazione annullata.');
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
  max-width: 1400px; /* Larghezza massima aumentata */
  max-height: 95%; /* Aumentata l'altezza massima */
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

/* Stili per la sezione "Aggiungi nuova impostazione" */
.add-setting-box {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.add-setting-box h4 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.3em;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.input-row {
  display: flex;
  flex-wrap: wrap; /* Permette agli elementi di andare a capo su schermi piccoli */
  gap: 15px;
  align-items: flex-end; /* Allinea i pulsanti e gli input in basso */
}

.input-row .input-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* Larghezze specifiche per i campi di input */
.input-row .param-name-field {
  flex-basis: 20%; /* ~20% della larghezza disponibile */
  min-width: 180px;
  flex-grow: 1;
}

.input-row .param-value-field {
  flex-basis: 40%; /* Circa il doppio del nome parametro */
  min-width: 360px;
  flex-grow: 2;
}

.input-row .id-field {
  flex-basis: 10%; /* Circa la metà del nome parametro */
  min-width: 90px;
  flex-grow: 0.5;
}


.input-row label {
  font-weight: bold;
  color: #333;
  font-size: 0.9em;
}

.input-row input[type="text"] {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
  width: 100%; /* Occupa tutta la larghezza disponibile nel suo gruppo */
}

.input-row input[type="text"]:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  border-color: #007bff;
}

.add-button {
  padding: 10px 20px;
  background-color: #28a745; /* Verde per l'aggiunta */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
  align-self: flex-end; /* Allinea il pulsante in basso */
  flex-shrink: 0; /* Impedisce al pulsante di restringersi */
}

.add-button:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

/* Stili per la tabella */
.settings-table-section {
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
  min-width: 600px; /* Larghezza minima per la tabella */
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

/* Stili per i pulsanti di azione (Salva/Annulla) */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.save-button, .cancel-button {
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

/* Il pulsante Salva è stato rimosso dall'HTML, quindi queste regole non saranno applicate */
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

/* Stili per le celle delle azioni e i pulsanti icona */
.actions-cell {
  white-space: nowrap; /* Impedisce ai pulsanti di andare a capo */
}

.action-icon-button {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  margin-right: 5px; /* Spazio tra le icone */
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

/* Media query per la responsività */
@media (max-width: 768px) {
  .input-row {
    flex-direction: column;
    align-items: stretch;
  }

  .input-row .input-field-group {
    min-width: unset; /* Rimuove la larghezza minima */
    width: 100%;
  }

  .add-button {
    width: 100%;
  }
}
</style>