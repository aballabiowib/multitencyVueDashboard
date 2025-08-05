<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="cancel" class="close-button">X</button>
      <h3>Modifica Messaggio Email Template per {{ companyName }}</h3>

      <div class="main-layout-container">
        <!-- Sezione sinistra (30%): Dati Originali -->
        <div class="left-form-section">
          <div class="input-field-group">
            <label for="originalTemplateName">Nome Template (originale):</label>
            <input 
              type="text" 
              id="originalTemplateName" 
              v-model="originalTemplate.template_name"
              readonly
              class="input-box read-only-box"
            />
          </div>
          <div class="input-field-group">
            <label for="originalDescription">Descrizione funzionalità (originale):</label>
            <div class="textarea-container">
              <textarea
                id="originalDescription"
                v-model="originalTemplate.description_function"
                rows="7"
                readonly
                class="textarea-box read-only-box"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Sezione destra (70%): Campi di Testo modificabili -->
        <div class="right-fields-section">
          <div class="input-field-group">
            <label for="originalSubject">Oggetto della Mail (originale):</label>
            <input 
              type="text" 
              id="originalSubject" 
              v-model="originalTemplate.subject" 
              readonly
              class="input-box read-only-box"
            />
          </div>
          <div class="input-field-group">
            <label for="originalMessageBody">Corpo del Messaggio (originale):</label>
            <div class="textarea-container">
              <textarea 
                id="originalMessageBody" 
                v-model="originalTemplate.message" 
                rows="7"
                readonly
                class="textarea-box read-only-box"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
      
      <div class="edit-fields-container">
        <h4 class="edit-fields-title">Modifica nella lingua selezionata: <span class="selected-lang-code">{{ displayedSelectedLanguageName }}</span></h4>
        <div class="input-field-group">
          <label for="newSubject">Nuovo Oggetto della Mail:</label>
          <input 
            type="text" 
            id="newSubject" 
            v-model="newSubject" 
            class="input-box"
            :class="getValidationClass(isNewSubjectValid, newSubject, false)"
          />
        </div>
        <div class="input-field-group">
          <label for="newMessageBody">Nuovo Corpo del Messaggio (HTML):</label>
          <div class="textarea-container">
            <textarea 
              id="newMessageBody" 
              v-model="newMessageBody" 
              rows="10"
              class="textarea-box"
              :class="getValidationClass(isNewBodyValid, newMessageBody, false)"
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
          {{ isSaving ? 'Salvataggio...' : 'Salva modifiche' }}
        </button>
        <button @click="cancel" class="cancel-button" :disabled="isSaving">Annulla</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import ValidationLegend from '@/components/ValidationLegend.vue';
import { languagesData } from '@/utils/language'; // Importa i dati delle lingue
import { titleObjectEmail } from '@/utils/regex';

const props = defineProps({
  companyName: {
    type: String,
    required: true,
  },
  customerId: {
    type: Number,
    required: true,
  },
  templateToEdit: {
    type: Object,
    required: true,
  },
  selectedLanguage: {
    type: String,
    required: true,
  }
});

const emit = defineEmits(['close', 'template-saved']);

const authStore = useAuthStore();
const router = useRouter();

const originalTemplate = ref({
  template_name: '',
  description_function: '',
  subject: '',
  message: '',
});
const newSubject = ref('');
const newMessageBody = ref('');
const isSaving = ref(false);
const saveError = ref(null);

// FIX: La regex per il campo 'Oggetto' è stata corretta
const isNewSubjectValid = computed(() => newSubject.value.trim() !== '' && titleObjectEmail.test(newSubject.value));
const isNewBodyValid = computed(() => newMessageBody.value.trim() !== '');
const isFormValid = computed(() => isNewSubjectValid.value && isNewBodyValid.value);

const displayedSelectedLanguageName = computed(() => {
    const language = languagesData.find(lang => lang.code === props.selectedLanguage);
    return language ? language.name : props.selectedLanguage;
});

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
    saveError.value = 'Per favore, compila tutti i campi obbligatori correttamente.';
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
    'Customer': props.companyName,
    'Editmessage': '1',
  };

  try {
    const apiUrl = `http://localhost:8000/api/email_message_template/${props.templateToEdit.id}`;

    // 1. Fetch the full template content (not language-filtered)
    const currentTemplateResponse = await fetch(apiUrl, { headers: headers });
    if (!currentTemplateResponse.ok) {
        const errorData = await currentTemplateResponse.json().catch(() => ({ message: 'Errore sconosciuto' }));
        throw new Error(`HTTP error! status: ${currentTemplateResponse.status} - ${errorData.message || currentTemplateResponse.statusText}`);
    }
    const currentTemplate = await currentTemplateResponse.json();

    // 2. Prepare the new subject and message with language tags
    const langTagStart = `<${props.selectedLanguage}>`;
    const langTagEnd = `</${props.selectedLanguage}>`;
    const langTagRegex = new RegExp(`${langTagStart}[\\s\\S]*?${langTagEnd}`);

    let updatedSubject = currentTemplate.subject || '';
    let updatedMessage = currentTemplate.message || '';

    // Update subject
    if (updatedSubject.match(langTagRegex)) {
        updatedSubject = updatedSubject.replace(langTagRegex, `${langTagStart}${newSubject.value}${langTagEnd}`);
    } else {
        updatedSubject += `${langTagStart}${newSubject.value}${langTagEnd}`;
    }

    // Update message
    if (updatedMessage.match(langTagRegex)) {
        updatedMessage = updatedMessage.replace(langTagRegex, `${langTagStart}${newMessageBody.value}${langTagEnd}`);
    } else {
        updatedMessage += `${langTagStart}${newMessageBody.value}${langTagEnd}`;
    }

    // 3. Prepare the final payload for the PUT request
    const payload = {
        template_name: currentTemplate.template_name,
        description_function: currentTemplate.description_function,
        subject: updatedSubject,
        message: updatedMessage,
        selected_language: props.selectedLanguage,
    };

    // 4. Send the PUT request with the updated payload
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
    }

    console.log('Template modificato con successo!');
    emit('template-saved');
    emit('close');
  } catch (e) {
    console.error('Errore durante la modifica del template:', e);
    saveError.value = `Impossibile modificare il template: ${e.message}.`;
  } finally {
    isSaving.value = false;
  }
};

const cancel = () => {
  emit('close');
};

const fetchTemplateDetails = async (language) => {
  if (!authStore.isAuthenticated || !authStore.token) return;

  const headers = {
    'Authorization': `Bearer ${authStore.token}`,
    'Customer': props.companyName,
    'Language': language,
  };

  try {
    const response = await fetch(`http://localhost:8000/api/email_message_template/${props.templateToEdit.id}`, {
      headers: headers,
    });
    if (!response.ok) {
      console.error(`Errore nel caricamento del template in lingua ${language}. Status: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error(`Errore di rete nel caricamento del template in lingua ${language}:`, e);
    return null;
  }
};

onMounted(async () => {
  // Carica il contenuto originale nella lingua del browser
  const browserLanguage = navigator.language || 'it-IT';
  const originalData = await fetchTemplateDetails(browserLanguage);
  if (originalData) {
    originalTemplate.value = {
      template_name: originalData.template_name || '',
      description_function: originalData.description_function || '',
      subject: originalData.subject || '',
      message: originalData.message || '',
    };
  } else {
    // Fallback se il caricamento originale fallisce
    originalTemplate.value = {
      template_name: props.templateToEdit.template_name || '',
      description_function: props.templateToEdit.description_function || '',
      subject: 'Contenuto originale non disponibile.',
      message: 'Contenuto originale non disponibile.',
    };
  }
});

watch(() => props.selectedLanguage, async (newLang) => {
    if (newLang) {
        const editableData = await fetchTemplateDetails(newLang);
        if (editableData) {
            newSubject.value = editableData.subject || '';
            newMessageBody.value = editableData.message || '';
        } else {
            newSubject.value = '';
            newMessageBody.value = '';
        }
    }
});
</script>

<style scoped>
/* Stili globali per l'overlay e il contenuto */
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
  padding-bottom: 20px;
  border-bottom: 1px dashed #e0e0e0;
}

.left-form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
}

.info-icon {
  width: 20px;
  height: 20px;
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

.input-box:focus, .textarea-box:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  border-color: #007bff;
}

.textarea-box {
  resize: none;
}

.textarea-container {
  overflow-y: auto;
}

/* Stili per la sezione di sola lettura */
.read-only-box {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.right-fields-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Nuova sezione per i campi modificabili */
.edit-fields-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.edit-fields-title {
  color: #28a745;
  font-size: 1.5em;
  margin-top: 0;
  margin-bottom: 10px;
  border-bottom: 1px dashed #28a745;
  padding-bottom: 10px;
}
.selected-lang-code {
  font-weight: bold;
  font-style: italic;
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

.save-error {
  color: #dc3545;
  font-weight: bold;
  text-align: center;
  margin-top: 10px;
}
</style>
