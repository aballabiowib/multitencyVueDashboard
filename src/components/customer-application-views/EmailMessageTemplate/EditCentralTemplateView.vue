<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="cancelEdit" class="close-button">X</button>
      <h3>Modifica Template Centrale (ID: {{ templateToEdit.id }})</h3>

      <div class="form-section">
        <div class="input-field-group">
          <label for="editedTemplateName">Nome del template:</label>
          <input
            type="text"
            id="editedTemplateName"
            v-model="editedTemplateName"
            placeholder="Nome del template"
            class="input-box"
            :class="getValidationClass(isNameValid, editedTemplateName)"
          />
        </div>
        <div class="input-field-group">
          <label for="editedTemplateDescription">Descrizione del template:</label>
          <textarea
            id="editedTemplateDescription"
            v-model="editedTemplateDescription"
            rows="5"
            placeholder="Descrivi la funzionalità del template"
            class="textarea-box"
            :class="getValidationClass(isDescriptionValid, editedTemplateDescription)"
          ></textarea>
        </div>
      </div>

      <div v-if="saveError" class="error-message save-error">
        <p>Errore durante il salvataggio: {{ saveError }}</p>
      </div>

      <div class="action-buttons">
        <button @click="saveEdit" class="save-button" :disabled="isSaving || !isFormValid">
          {{ isSaving ? 'Salvataggio...' : 'Salva Modifiche' }}
        </button>
        <button @click="cancelEdit" class="cancel-button" :disabled="isSaving">Annulla</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

export default {
  name: 'EditCentralTemplateView',
  emits: ['close', 'template-edited'], // Emette eventi per chiudere e notificare la modifica
  props: {
    companyName: {
      type: String,
      required: true,
    },
    customerId: {
      type: Number,
      required: true,
    },
    templateToEdit: { // L'oggetto template passato da CentralTemplateView
      type: Object,
      required: true,
      validator: (value) => {
        return value.id && value.name && value.description !== undefined;
      },
    },
  },
  data() {
    return {
      authStore: useAuthStore(),
      router: useRouter(),
      editedTemplateName: this.templateToEdit.name,
      editedTemplateDescription: this.templateToEdit.description,
      isSaving: false,
      saveError: null,
    };
  },
  computed: {
    isNameValid() {
      return this.editedTemplateName.trim() !== '';
    },
    isDescriptionValid() {
      return this.editedTemplateDescription.trim() !== '';
    },
    isFormValid() {
      return this.isNameValid && this.isDescriptionValid;
    },
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
    async saveEdit() {
      this.isSaving = true;
      this.saveError = null;

      if (!this.isFormValid) {
        this.saveError = 'Il nome e la descrizione del template non possono essere vuoti.';
        this.isSaving = false;
        return;
      }

      if (!this.authStore.isAuthenticated || !this.authStore.token || this.isTokenExpired(this.authStore.token)) {
        this.saveError = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        this.isSaving = false;
        await this.authStore.logout();
        this.router.push('/');
        return;
      }

      const apiUrl = `http://localhost:8000/api/central_template/${this.templateToEdit.id}`;
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
        template_name: this.editedTemplateName.trim(),
        description_function: this.editedTemplateDescription.trim(),
      };

      try {
        const response = await fetch(apiUrl, {
          method: 'PUT', // Metodo HTTP PUT per l'aggiornamento
          mode: 'cors',
          headers: headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
          throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
        }

        //alert('Template centrale modificato con successo!');
        this.$emit('template-edited'); // Notifica il componente padre della modifica
      } catch (e) {
        console.error('Errore durante la modifica del template centrale:', e);
        this.saveError = `Impossibile salvare le modifiche: ${e.message}.`;
      } finally {
        this.isSaving = false;
      }
    },
    cancelEdit() {
      this.$emit('close'); // Emette l'evento per chiudere la modale
    },
    getValidationClass(isValid, value) {
      const trimmedValue = value.trim();
      if (trimmedValue === '') {
        return 'border-red';
      }
      return isValid ? 'border-green' : 'border-red';
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
  max-width: 800px; /* Dimensione adatta per un form di modifica */
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
  margin-bottom: 15px;
  font-size: 1.8em;
  text-align: center;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex-grow: 1;
}

.input-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-field-group label {
  font-weight: bold;
  color: #333;
  font-size: 0.9em;
}

.input-box, .textarea-box {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
  width: 100%;
}

.textarea-box {
  resize: vertical;
}

.input-box:focus, .textarea-box:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  border-color: #007bff;
}

/* Classi per i bordi di validazione */
.input-box.border-red, 
.textarea-box.border-red {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25) !important;
}

.input-box.border-green,
.textarea-box.border-green {
  border-color: #28a745 !important;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25) !important;
}

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

.cancel-button:hover:not(:disabled) {
  background-color: #5a6268;
  transform: translateY(-2px);
}

.error-message {
  color: #dc3545;
  font-weight: bold;
  text-align: center;
  padding: 10px;
  background-color: #ffe0e0;
  border-radius: 5px;
  border: 1px solid #dc3545;
}
</style>