<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="cancel" class="close-button">X</button>
      <h3>Crea Nuovo Messaggio Email Template per {{ companyName }} (Lingua: {{ selectedLanguageName }})</h3>

      <div class="main-layout-container">
        <!-- Sezione sinistra (30%): Controlli e Form -->
        <div class="left-form-section">
          <div class="input-field-group">
            <label for="templateName">Nome Template:</label>
            <div class="template-info" @click="openTemplateSelection">
              <button class="info-button" @click.stop="showInfoModal = true">
                <img :src="QuestionOctagonIcon" class="icon-svg info-icon" alt="Informazioni" />
              </button>
              <input
                type="text"
                class="input-box"
                :class="getValidationClass(isTemplateNameValid, templateName, false)"
                placeholder="Seleziona un template o creane uno nuovo"
                readonly
                v-model="templateName"
              />
            </div>
          </div>
          <div class="input-field-group">
            <label for="templateDescription">Descrizione funzionalità:</label>
            <textarea
              id="templateDescription"
              class="textarea-box"
              placeholder="Descrivi la funzionalità di questo template"
              rows="15"
              v-model="templateDescription"
              :class="getValidationClass(isTemplateDescriptionValid, templateDescription, false)"
            ></textarea>
          </div>
        </div>

        <!-- Sezione destra (70%): Campi di Testo -->
        <div class="right-fields-section">
          <div class="input-field-group">
            <label for="subject">Oggetto della Mail:</label>
            <input 
              type="text" 
              id="subject" 
              v-model="emailSubject" 
              placeholder="Oggetto dell'email"
              class="input-box"
              :class="getValidationClass(isSubjectValid, emailSubject, false)"
            />
          </div>
          <div class="input-field-group aligned-input-group">
            <label for="messageBody">Corpo del Messaggio (HTML):</label>
            <textarea 
              id="messageBody" 
              v-model="emailBody" 
              rows="15"
              placeholder="Inserisci il testo della mail in formato HTML con variabili come $nome_parametro"
              class="textarea-box"
              :class="getValidationClass(isBodyValid, emailBody, false)"
            ></textarea>
          </div>
        </div>
      </div>
      
      <ValidationLegend />

      <div v-if="saveError" class="error-message save-error">
        <p>Errore durante il salvataggio: {{ saveError }}</p>
      </div>

      <div class="action-buttons">
        <button @click="save" class="save-button" :disabled="isSaving || !isFormValid">
          {{ isSaving ? 'Creazione...' : 'Salva' }}
        </button>
        <button @click="cancel" class="cancel-button" :disabled="isSaving">Annulla</button>
      </div>

      <div v-if="showInfoModal" class="info-modal-overlay">
        <div class="info-modal-content">
          <h4 class="info-title">Informazione</h4>
          <p class="info-message">
            Questo form serve per creare un nuovo template. Compila tutti i campi obbligatori.
          </p>
          <button @click="showInfoModal = false" class="alert-button">Ho letto</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Componente per la selezione dei template -->
  <CentralTemplateView
    v-if="showCentralTemplateView"
    :company-name="companyName"
    :customer-id="customerId"
    @close="showCentralTemplateView = false"
    @template-selected="handleTemplateSelected"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import QuestionOctagonIcon from '@/assets/icons/question-octagon.svg';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import ValidationLegend from '@/components/ValidationLegend.vue';
import CentralTemplateView from '@/components/customer-application-views/EmailMessageTemplate/CentralTemplateView.vue';
import { titleObjectEmail } from '@/utils/regex';
import { languagesData } from '@/utils/language'; // Importa languagesData

const props = defineProps({
  companyName: {
    type: String,
    required: true,
  },
  customerId: {
    type: Number,
    required: true,
  },
  languageSelected: {
    type: String,
    default: 'en-EN', 
  },
});

const emit = defineEmits(['close', 'template-saved']);

const authStore = useAuthStore();
const router = useRouter();

const showInfoModal = ref(false);
const templateName = ref('');
const templateDescription = ref('');
const emailSubject = ref('');
const emailBody = ref('');
const isSaving = ref(false);
const saveError = ref(null);
const showCentralTemplateView = ref(false);

const selectedCentralTemplateId = ref(null);

// Computed property per ottenere il nome della lingua
const selectedLanguageName = computed(() => {
  const lang = languagesData.find(l => l.code === props.languageSelected);
  return lang ? lang.name : props.languageSelected;
});

const isTemplateNameValid = computed(() => templateName.value.trim() !== '' && selectedCentralTemplateId.value !== null);
const isTemplateDescriptionValid = computed(() => templateDescription.value.trim() !== '');

const isSubjectValid = computed(() => emailSubject.value.trim() !== '' && titleObjectEmail.test(emailSubject.value));
const isBodyValid = computed(() => emailBody.value.trim() !== '');

const isFormValid = computed(() => 
  isTemplateNameValid.value && 
  isSubjectValid.value && 
  isBodyValid.value
);

const getValidationClass = (isValid, value, isOptional = false) => {
  const trimmedValue = value.trim();
  if (trimmedValue === '') {
    return isOptional ? 'border-blue' : 'border-red';
  }
  return isValid ? 'border-green' : 'border-red';
};

const save = async () => {
  isSaving.value = true;
  saveError.value = null;

  if (!isFormValid.value) {
    saveError.value = 'Per favore, compila tutti i campi obbligatori correttamente e seleziona un template centrale.';
    isSaving.value = false;
    return;
  }

  if (!authStore.isAuthenticated || !authStore.token) {
    saveError.value = 'Sessione non autenticata. Effettua nuovamente il login.';
    isSaving.value = false;
    await authStore.logout();
    router.push('/');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authStore.token}`,
    'Language': props.languageSelected, 
    'Customer': props.companyName,
  };

  const formattedSubject = `<${props.languageSelected}>${emailSubject.value}</${props.languageSelected}>`;
  const formattedMessage = `<${props.languageSelected}>${emailBody.value}</${props.languageSelected}>`;

  const payload = {
    template_name: templateName.value, 
    central_template: selectedCentralTemplateId.value, 
    subject: formattedSubject, 
    message: formattedMessage,   
    language_selected: props.languageSelected, 
    customer_id: props.customerId, 
  };

  try {
    const apiUrl = `http://localhost:8000/api/email_message_template`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
    }

    console.log('Template creato con successo!');
    emit('template-saved');
    emit('close');
  } catch (e) {
    console.error('Errore durante la creazione del template:', e);
    saveError.value = `Impossibile creare il template: ${e.message}.`;
  } finally {
    isSaving.value = false;
  }
};

const cancel = () => {
  emit('close');
};

const openTemplateSelection = () => {
  showCentralTemplateView.value = true;
};

const handleTemplateSelected = (selectedTemplate) => {
  templateName.value = selectedTemplate.name;
  templateDescription.value = selectedTemplate.description;
  selectedCentralTemplateId.value = selectedTemplate.id; 
  showCentralTemplateView.value = false;
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
  max-width: 1800px;
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

.main-layout-container {
  display: grid;
  grid-template-columns: 30% 70%;
  gap: 15px;
  flex-grow: 1;
}

.left-form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer; /* Aggiunto cursore per indicare la cliccabilità */
}
.template-info:hover {
  background-color: #f0f0f0; /* Feedback visivo al hover */
  border-radius: 5px;
  padding: 5px;
  margin: -5px; /* Compensazione per il padding */
}

.info-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

.info-icon {
  width: 30px;
  height: 30px;
  color: #007bff;
}

.input-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-field-group label {
  font-weight: bold;
  color: #333;
}

.input-box, .textarea-box {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
}

.input-box[readonly] {
  background-color: #e9ecef;
}

.input-box:focus, .textarea-box:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  border-color: #007bff;
}

.textarea-box {
  resize: none;
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

/* Modale di Informazione */
.info-modal-overlay {
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

.info-modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.info-title {
  color: #007bff;
  font-size: 2em;
  font-weight: bold;
  margin: 0;
}

.info-message {
  font-size: 1.1em;
  color: #555;
  margin: 15px 0 20px;
}

.alert-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.alert-button:hover {
  background-color: #0056b3;
}

.aligned-input-group {
  margin-top: 10px;
}


@media (max-width: 768px) {
  .main-layout-container {
    grid-template-columns: 1fr;
  }
}
</style>