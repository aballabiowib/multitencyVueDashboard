<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="cancel" class="close-button">X</button>
      <h3>Messaggi email template per {{ companyName }}</h3>

      <div class="top-controls-container">
        <div class="language-select-group">
          <label for="templateLanguage">Lingua:</label>
          <select id="templateLanguage" v-model="selectedLanguage" class="language-select">
            <option
              v-for="lang in availableLanguages"
              :key="lang.code"
              :value="lang.code"
            >
              {{ lang.name }}
            </option>
          </select>
        </div>
        <button @click="openCreateView" class="add-button">Crea Nuovo Template</button>
      </div>

      <div class="templates-table-section">
        <div v-if="isLoading" class="loading-indicator">Caricamento template...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="paginatedTemplates.length === 0 && !isLoading" class="no-data-message">
          Nessun template trovato per questa lingua.
        </div>
        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome Template</th>
                <th>Oggetto</th>
                <th>Messaggio</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="template in paginatedTemplates" :key="template.id">
                <td>{{ template.id }}</td>
                <td>{{ template.template_name }}</td>
                <td>{{ template.subject }}</td>
                <td>{{ template.message }}</td>
                <td class="actions-cell">
                  <button @click="openEditView(template)" class="action-icon-button edit-button" title="Modifica">
                    <img :src="EditingIcon" class="icon-svg" alt="Modifica" />
                  </button>
                  <!-- Passa anche il nome del template a confirmDeletePrompt -->
                  <button @click="confirmDeletePrompt(template.id, template.template_name)" class="action-icon-button delete-button" title="Elimina">
                    <img :src="TrashIcon" class="icon-svg" alt="Elimina" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="pagination-controls">
          <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1 || isLoading" class="pagination-button">Precedente</button>
          <span>Pagina {{ currentPage }} di {{ totalPages }}</span>
          <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages || isLoading" class="pagination-button">Successiva</button>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="cancel" class="cancel-button">Annulla</button>
      </div>

      <!-- Passa la lingua selezionata al componente CreateTemplateView -->
      <CreateTemplateView
        v-if="isCreating"
        :company-name="companyName"
        :customer-id="customerId"
        :language-selected="selectedLanguage"
        @close="closeViews"
        @template-saved="handleTemplateSaved"
      />
      <EditTemplateView
        v-if="isEditing"
        :company-name="companyName"
        :customer-id="customerId"
        :template-to-edit="templateToEdit"
        :selected-language="selectedLanguage"
        @close="closeViews"
        @template-saved="handleTemplateSaved"
      />

      <!-- Modale di conferma eliminazione personalizzata -->
      <div v-if="showDeleteConfirmModal" class="custom-modal-overlay">
        <div class="custom-modal-content">
          <h4 class="modal-title">Attenzione</h4>
          <p class="modal-message">
            Sei sicuro di voler eliminare il template "{{ templateToDeleteName }}" (ID: {{ templateToDeleteId }})? Questa operazione è irreversibile.
          </p>
          <div class="modal-actions">
            <button @click="deleteTemplateConfirmed" class="modal-button confirm-button">Ok</button>
            <button @click="cancelDelete" class="modal-button cancel-button">Annulla</button>
          </div>
          <div v-if="deleteErrorMessage" class="error-message delete-modal-error">
            <p>{{ deleteErrorMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { languagesData } from '@/utils/language';
import EditingIcon from '@/assets/icons/editing.svg';
import TrashIcon from '@/assets/icons/trash.svg';
import CreateTemplateView from '@/components/customer-application-views/EmailMessageTemplate/CreateTemplateView.vue';
import EditTemplateView from '@/components/customer-application-views/EmailMessageTemplate/EditTemplateView.vue';

export default {
  name: 'EmailTemplateMessagesView',
  emits: ['close'],
  components: {
    CreateTemplateView,
    EditTemplateView,
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
      
      selectedLanguage: navigator.language || 'it-IT',
      availableLanguages: languagesData,
      
      allTemplates: [],
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 1,
      
      isLoading: false,
      error: null,

      isCreating: false,
      isEditing: false,
      templateToEdit: null,

      // Nuove variabili per la modale di conferma eliminazione
      showDeleteConfirmModal: false,
      templateToDeleteId: null,
      templateToDeleteName: null, // <-- Aggiunta questa variabile
      deleteErrorMessage: null,
    };
  },
  computed: {
    paginatedTemplates() {
      return this.allTemplates;
    },
  },
  watch: {
    selectedLanguage(newLang, oldLang) {
      if (newLang && newLang !== oldLang) {
        this.currentPage = 1;
        this.fetchTemplates();
      }
    },
    companyName(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.currentPage = 1;
        this.fetchTemplates();
      }
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

      const apiUrl = `http://localhost:8000/api/email_message_template`;
      const filterValues = {language_selected: this.selectedLanguage}
      const queryParams = new URLSearchParams({
        sort_by: 'id',
        order_dir: 'asc',
        page: this.currentPage,
        limit: this.itemsPerPage,
        filter: JSON.stringify(filterValues),
      }).toString();

      const headers = {
        'Datatable': '1',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authStore.token}`,
        'Language': this.selectedLanguage,
        'Customer': this.companyName,
      };

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
          this.allTemplates = responseData.data.items;
          this.totalItems = responseData.data.pagination.count;
          this.totalPages = responseData.data.pagination.total_pages;
        } else {
          this.allTemplates = [];
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
    changePage(newPage) {
      if (newPage >= 1 && newPage <= this.totalPages && !this.isLoading) {
        this.currentPage = newPage;
        this.fetchTemplates();
      }
    },
    openCreateView() {
      this.isCreating = true;
    },
    openEditView(template) {
      this.templateToEdit = template;
      this.isEditing = true;
    },
    closeViews() {
      this.isCreating = false;
      this.isEditing = false;
      this.templateToEdit = null;
    },
    handleTemplateSaved() {
      this.closeViews();
      this.fetchTemplates();
    },
    
    // Modificato per accettare anche il nome del template
    confirmDeletePrompt(id, name) {
      this.templateToDeleteId = id;
      this.templateToDeleteName = name; // <-- Salva il nome del template
      this.deleteErrorMessage = null; 
      this.showDeleteConfirmModal = true;
    },

    async deleteTemplateConfirmed() {
      const id = this.templateToDeleteId;
      if (!id) {
        this.deleteErrorMessage = 'ID del template da eliminare non valido.';
        return;
      }

      this.isLoading = true; 
      this.deleteErrorMessage = null; 

      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.deleteErrorMessage = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        this.isLoading = false;
        await this.authStore.logout();
        this.router.push('/');
        return;
      }

      const apiUrl = `http://localhost:8000/api/email_message_template/${id}`; 

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authStore.token}`,
        'Language': this.selectedLanguage,
        'Customer': this.companyName,
      };

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

        this.showDeleteConfirmModal = false; 
        this.templateToDeleteId = null; 
        this.templateToDeleteName = null; // <-- Resetta anche il nome
        this.fetchTemplates(); 

      } catch (e) {
        console.error('Errore durante l\'eliminazione del template:', e);
        this.deleteErrorMessage = `Impossibile eliminare il template: ${e.message}.`;
      } finally {
        this.isLoading = false; 
      }
    },

    cancelDelete() {
      this.showDeleteConfirmModal = false;
      this.templateToDeleteId = null;
      this.templateToDeleteName = null; // <-- Resetta anche il nome
      this.deleteErrorMessage = null;
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

.top-controls-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.language-select-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.language-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
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
}

.add-button:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

.templates-table-section {
  flex-grow: 1;
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

/* Stili per la modale di conferma personalizzata */
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
  z-index: 2000; /* Assicurati che sia sopra le altre modali se presenti */
}

.custom-modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 450px; /* Lievemente più grande per il testo */
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-title {
  color: #dc3545; /* Rosso per "Attenzione" */
  font-size: 2.2em; /* Titolo più grande */
  font-weight: bold;
  margin: 0;
}

.modal-message {
  font-size: 1.1em;
  color: #555;
  margin: 0; /* Rimuovi margini predefiniti */
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
  background-color: #dc3545; /* Rosso per conferma eliminazione */
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

.delete-modal-error {
  margin-top: 15px;
  padding: 10px;
  background-color: #ffe0e0;
  border: 1px solid #dc3545;
  border-radius: 5px;
  color: #dc3545;
  font-weight: normal;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .top-controls-container {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
}
</style>