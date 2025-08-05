<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="cancel" class="close-button">X</button>
      <h3>Scegli un template o creane uno nuovo</h3>

      <!-- Sezione Aggiungi nuovo template -->
      <div class="add-setting-box">
        <h4>Crea un nuovo template</h4>
        <div class="input-row">
          <div class="input-field-group param-name-field">
            <label for="templateName">Nome del template:</label>
            <input type="text" id="templateName" v-model="newTemplate.name" placeholder="Es. avviso_scadenza">
          </div>
          <div class="input-field-group param-value-field">
            <label for="templateDescription">Descrizione del template:</label>
            <textarea id="templateDescription" v-model="newTemplate.description" rows="3" placeholder="Descrivi la funzionalità del template"></textarea>
          </div>
          <button @click="addTemplate" class="add-button" :disabled="isAdding">
            {{ isAdding ? 'Aggiunta...' : 'Aggiungi' }}
          </button>
        </div>
        <div v-if="addError" class="error-message add-error">
          <p>Errore durante l'aggiunta: {{ addError }}</p>
        </div>
      </div>

      <!-- Legenda di Validazione -->
      <ValidationLegend />

      <!-- Sezione Tabella dei template disponibili -->
      <div class="settings-table-section">
        <p class="table-instruction-message">
          Clicca su una riga per selezionare il template e inserirlo nel messaggio.
        </p>
        <div v-if="isLoading" class="loading-indicator">Caricamento template...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="templates.length === 0 && !isLoading" class="no-data-message">Nessun template trovato.</div>
        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome Template</th>
                <th>Descrizione Template</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="template in paginatedTemplates" :key="template.id" @click="selectTemplate(template)">
                <td>{{ template.id }}</td>
                <td>{{ template.name }}</td>
                <td>{{ template.description }}</td>
                <td class="actions-cell" @click.stop>
                  <button @click="openEditCentralTemplateView(template)" class="action-icon-button edit-button" title="Modifica">
                    <img :src="EditingIcon" class="icon-svg" alt="Modifica" />
                  </button>
                  <!-- Modificato: Chiama confirmDeletePrompt -->
                  <button @click="confirmDeletePrompt(template.id, template.name)" class="action-icon-button delete-button" title="Elimina">
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

  <!-- Componente per la modifica del template centrale -->
  <EditCentralTemplateView
    v-if="isEditingCentralTemplate"
    :company-name="companyName"
    :customer-id="customerId"
    :template-to-edit="centralTemplateToEdit"
    @close="closeEditCentralTemplateView"
    @template-edited="handleCentralTemplateEdited"
  />

  <!-- Modale di dialogo generica per conferma/messaggi -->
  <div v-if="showDialog" class="custom-modal-overlay">
    <div class="custom-modal-content">
      <h4 class="modal-title" :class="{ 'error-title': dialogType === 'error', 'success-title': dialogType === 'success' }">
        {{ dialogTitle }}
      </h4>
      <p class="modal-message">{{ dialogMessage }}</p>
      <div class="modal-actions" v-if="dialogType === 'confirm' || dialogType === 'error'">
        <button
          v-for="(action, index) in dialogActions"
          :key="index"
          @click="methods[action.handler]()"
          :class="action.class"
          class="modal-button"
        >
          {{ action.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import ValidationLegend from '@/components/ValidationLegend.vue';
import EditingIcon from '@/assets/icons/editing.svg';
import TrashIcon from '@/assets/icons/trash.svg';
import EditCentralTemplateView from '@/components/customer-application-views/EmailMessageTemplate/EditCentralTemplateView.vue';


export default {
  name: 'CentralTemplateView',
  emits: ['close', 'template-selected'],
  components: {
    ValidationLegend,
    EditCentralTemplateView,
  },
  props: {
    companyName: {
      type: String,
      required: true,
    },
    customerId: {
      type: Number,
      required: true,
    }
  },
  data() {
    return {
      authStore: useAuthStore(),
      router: useRouter(),
      EditingIcon: EditingIcon,
      TrashIcon: TrashIcon,
      
      newTemplate: {
        name: '',
        description: '',
      },
      templates: [],
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 1,
      
      isLoading: false,
      isAdding: false,
      error: null,
      addError: null,

      isEditingCentralTemplate: false,
      centralTemplateToEdit: null,

      // Nuove variabili per la modale di dialogo generica
      showDialog: false,
      dialogTitle: '',
      dialogMessage: '',
      dialogType: '', // 'confirm', 'success', 'error'
      dialogActions: [], // { text: 'Ok', handler: 'methodName', class: 'button-class' }
      currentTemplateId: null, // Per l'ID del template da eliminare
      currentTemplateName: null, // Per il nome del template da eliminare
    };
  },
  computed: {
    paginatedTemplates() {
      return this.templates;
    }
  },
  mounted() {
    this.fetchTemplates();
  },
  methods: {
    isTokenExpired(token) {
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
        const leewayMs = 5 * 60 * 1000;
        return expirationTime.getTime() < currentTimeMs - leewayMs;
      } catch (e) {
        console.error('isTokenExpired:', e);
        return true;
      }
    },
    async fetchTemplates() {
      this.isLoading = true;
      this.error = null;

      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.error = 'Sessione scaduta o non autenticata.';
        await this.authStore.logout();
        this.router.push('/');
        return;
      }

      const apiUrl = `http://localhost:8000/api/central_template`;
      const queryParams = new URLSearchParams({
        sort_by: 'id',
        order_dir: 'asc',
        page: this.currentPage,
        limit: this.itemsPerPage,
      }).toString();

      const headers = {
        'Datatable': '1',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authStore.token}`,
        'Language': 'en-EN',
        'Customer': '',
      };
      
      if (this.authStore.user && this.authStore.user.is_superuser === false) {
        headers['Customer'] = this.companyName;
      }

      try {
        const response = await fetch(`${apiUrl}?${queryParams}`, {
          method: 'GET',
          mode: 'cors',
          headers: headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const responseData = await response.json();
        if (responseData.data && responseData.data.items) {
          this.templates = responseData.data.items.map(item => ({
            id: item.id,
            name: item.template_name,
            description: item.description_function,
          }));
          this.totalItems = responseData.data.pagination.count;
          this.totalPages = responseData.data.pagination.total_pages;
          
        } else {
          this.templates = [];
          this.totalItems = 0;
          this.totalPages = 1;
        }
      } catch (e) {
        console.error('Errore nel recupero dei template:', e);
        this.error = `Impossibile caricare i template: ${e.message}.`;
      } finally {
        this.isLoading = false;
      }
    },
    async addTemplate() {
      this.isAdding = true;
      this.addError = null;

      // Controllo di validazione
      if (!this.newTemplate.name.trim() || !this.newTemplate.description.trim()) {
        this.addError = 'Il nome e la descrizione del template non possono essere vuoti.';
        this.isAdding = false;
        return;
      }
      
      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.addError = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        this.isAdding = false;
        await this.authStore.logout();
        this.router.push('/');
        return;
      }

      const apiUrl = 'http://localhost:8000/api/central_template';

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authStore.token}`,
        'Language': 'en-EN',
        'Customer': '',
      };

      if (this.authStore.user && this.authStore.user.is_superuser === false) {
        headers['Customer'] = this.companyName;
      }

      const requestBody = {
        template_name: this.newTemplate.name.trim(),
        description_function: this.newTemplate.description.trim(),
      };

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
        }

        // Mostra messaggio di successo nella modale generica
        this.dialogTitle = 'Comunicazione';
        this.dialogMessage = `Template centrale "${this.newTemplate.name}" aggiunto con successo!`;
        this.dialogType = 'success';
        this.dialogActions = []; // Nessun pulsante per chiusura automatica
        this.showDialog = true;

        this.newTemplate.name = '';
        this.newTemplate.description = '';

        this.fetchTemplates();

        setTimeout(() => {
          this.closeDialog();
        }, 1500);

      } catch (e) {
        console.error('Errore nell\'aggiunta del template centrale:', e);
        this.addError = `Impossibile aggiungere il template centrale: ${e.message}.`;
        // Mostra errore nella modale generica
        this.dialogTitle = 'Errore';
        this.dialogMessage = `Impossibile aggiungere il template centrale: ${e.message}.`;
        this.dialogType = 'error';
        this.dialogActions = [{ text: 'Chiudi', handler: 'closeDialog', class: 'cancel-button' }];
        this.showDialog = true;
      } finally {
        this.isAdding = false;
      }
    },
    openEditCentralTemplateView(template) {
      this.centralTemplateToEdit = { ...template };
      this.isEditingCentralTemplate = true;
    },
    closeEditCentralTemplateView() {
      this.isEditingCentralTemplate = false;
      this.centralTemplateToEdit = null;
    },
    handleCentralTemplateEdited() {
      this.closeEditCentralTemplateView();
      this.fetchTemplates();
    },
    
    // Nuovo metodo per mostrare la modale di conferma eliminazione
    confirmDeletePrompt(id, name) {
      this.currentTemplateId = id;
      this.currentTemplateName = name;
      this.dialogTitle = 'Attenzione';
      this.dialogMessage = `Sei sicuro di voler eliminare il template "${this.currentTemplateName}" (ID: ${this.currentTemplateId})? Questa operazione è irreversibile.`;
      this.dialogType = 'confirm';
      this.dialogActions = [
        { text: 'Ok', handler: 'deleteTemplateConfirmed', class: 'confirm-button' },
        { text: 'Annulla', handler: 'closeDialog', class: 'cancel-button' }
      ];
      this.showDialog = true;
    },

    // Nuovo metodo per eseguire l'eliminazione
    async deleteTemplateConfirmed() {
      const id = this.currentTemplateId;
      if (!id) {
        this.dialogTitle = 'Errore';
        this.dialogMessage = 'ID del template da eliminare non valido.';
        this.dialogType = 'error';
        this.dialogActions = [{ text: 'Chiudi', handler: 'closeDialog', class: 'cancel-button' }];
        return;
      }

      this.isLoading = true; 
      // Non resettiamo il messaggio della dialog qui, verrà sovrascritto dal successo/errore

      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.dialogTitle = 'Errore';
        this.dialogMessage = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        this.dialogType = 'error';
        this.dialogActions = [{ text: 'Chiudi', handler: 'closeDialog', class: 'cancel-button' }];
        this.isLoading = false;
        await this.authStore.logout();
        this.router.push('/');
        return;
      }

      const apiUrl = `http://localhost:8000/api/central_template/${id}`; 

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authStore.token}`,
        'Language': 'en-EN',
        'Customer': '',
      };

      if (this.authStore.user && this.authStore.user.is_superuser === false) {
        headers['Customer'] = this.companyName;
      }

      try {
        const response = await fetch(apiUrl, {
          method: 'DELETE', 
          mode: 'cors',
          headers: headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
        }

        // Successo: mostra messaggio di comunicazione e chiudi automaticamente
        this.dialogTitle = 'Comunicazione';
        this.dialogMessage = `Template "${this.currentTemplateName}" (ID: ${id}) eliminato con successo.`;
        this.dialogType = 'success';
        this.dialogActions = []; // Nessun pulsante per chiusura automatica
        
        this.fetchTemplates(); // Ricarica la lista dei template
        setTimeout(() => {
          this.closeDialog();
        }, 1500); // Chiudi dopo 1.5 secondi

      } catch (e) {
        // Errore durante l'eliminazione
        console.error('Errore durante l\'eliminazione del template:', e);
        this.dialogTitle = 'Errore';
        this.dialogMessage = `Impossibile eliminare il template: ${e.message}.`;
        this.dialogType = 'error';
        this.dialogActions = [{ text: 'Chiudi', handler: 'closeDialog', class: 'cancel-button' }];
      } finally {
        this.isLoading = false; 
      }
    },

    // Chiude la modale generica e resetta lo stato
    closeDialog() {
      this.showDialog = false;
      this.dialogTitle = '';
      this.dialogMessage = '';
      this.dialogType = '';
      this.dialogActions = [];
      this.currentTemplateId = null;
      this.currentTemplateName = null;
    },

    changePage(newPage) {
      if (newPage >= 1 && newPage <= this.totalPages && !this.isLoading) {
        this.currentPage = newPage;
        this.fetchTemplates();
      }
    },
    cancel() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
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
  width: 95%;
  max-width: 1400px;
  max-height: 95%;
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
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
}

.input-row .input-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-grow: 1;
}

.input-row .param-name-field {
  flex-basis: 30%;
  min-width: 200px;
}

.input-row .param-value-field {
  flex-basis: 60%;
  min-width: 300px;
}

.input-row label {
  font-weight: bold;
  color: #333;
  font-size: 0.9em;
}

.input-row input[type="text"],
.input-row textarea {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
  width: 100%;
}

.input-row textarea {
  resize: vertical;
}

.input-row input:focus,
.input-row textarea:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  border-color: #007bff;
}

.add-button {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
  align-self: flex-end;
  flex-shrink: 0;
}

.add-button:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

.add-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.templates-table-section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.table-instruction-message {
  font-style: italic;
  color: #555;
  text-align: center;
  padding: 10px;
  background-color: #e0f0ff;
  border-radius: 8px;
  border: 1px dashed #007bff;
  margin-bottom: 15px;
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
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 15px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
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
  cursor: pointer;
}

.actions-cell {
  white-space: nowrap;
}

.action-icon-button {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  margin-right: 5px;
  transition: transform 0.2s ease;
}

.action-icon-button:hover {
  transform: scale(1.1);
}

.icon-svg {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}

.edit-button .icon-svg {
  color: #007bff;
}

.delete-button .icon-svg {
  color: #dc3545;
}

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
  background-color: #6c757d;
  color: white;
  border: 1px solid #6c757d;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.cancel-button:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
}

/* Stili per la modale di dialogo generica */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; 
}

.custom-modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 450px; 
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-title {
  font-size: 2.2em; 
  font-weight: bold;
  margin: 0;
  color: #007bff; /* Colore di default per il titolo */
}

.modal-title.error-title {
  color: #dc3545; /* Rosso per "Errore" */
}

.modal-title.success-title {
  color: #28a745; /* Verde per "Comunicazione" */
}

.modal-message {
  font-size: 1.1em;
  color: #555;
  margin: 0; 
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
}

.modal-button {
  padding: 10px 25px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.modal-button.confirm-button {
  background-color: #dc3545; 
  color: white;
  border: 1px solid #dc3545;
}

.modal-button.confirm-button:hover {
  background-color: #c82333;
  transform: translateY(-2px);
}

.modal-button.cancel-button {
  background-color: #6c757d;
  color: white;
  border: 1px solid #6c757d;
}

.modal-button.cancel-button:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
}
</style>