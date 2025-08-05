<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="cancel" class="close-button">X</button>
      <h3>Selezione Lingue</h3>

      <div v-if="isLoading" class="loading-message">
        <p>Caricamento lingue...</p>
        <div class="spinner"></div>
      </div>
      <div v-else-if="error" class="error-message">
        <p>Errore durante il caricamento: {{ error }}</p>
        <button @click="fetchLanguages" class="retry-button">Riprova</button>
      </div>
      <div v-else class="language-selection-container">
        <!-- Selettore lingua predefinita -->
        <div class="language-group">
          <label for="defaultLanguage">Lingua Predefinita:</label>
          <div class="single-select-box">
            <div 
              v-for="lang in allLanguages" 
              :key="lang.code" 
              class="single-select-item"
              :class="{ 'selected': defaultLanguage === lang.code }"
              @click="defaultLanguage = lang.code; updateAvailableLanguages()"
            >
              <span>{{ lang.name }}</span>
              <span v-if="defaultLanguage === lang.code">
                <img :src="CheckIcon" class="icon-svg check-icon" alt="Selezionato" />
              </span>
            </div>
          </div>
        </div>

        <!-- Selettore lingue aggiuntive (multi-selezione) -->
        <div class="language-group">
          <label for="otherLanguages">Altre Lingue Disponibili (max 4):</label>
          <div class="multi-select-box">
            <div 
              v-for="lang in availableOtherLanguages" 
              :key="lang.code" 
              class="multi-select-item"
              :class="{ 'selected': otherLanguages.includes(lang.code) }"
              @click="toggleOtherLanguage(lang.code)"
            >
              <span>{{ lang.name }}</span>
              <span v-if="otherLanguages.includes(lang.code)">
                <img :src="CheckIcon" class="icon-svg check-icon" alt="Selezionato" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="saveLanguages" class="save-button" :disabled="isSaving || !isFormValid">
          {{ isSaving ? 'Salvataggio...' : 'Salva' }}
        </button>
        <button @click="cancel" class="cancel-button" :disabled="isSaving">Annulla</button>
      </div>
      <div v-if="saveError" class="error-message save-error">
        <p>Errore durante il salvataggio: {{ saveError }}</p>
      </div>
    </div>

    <!-- Nuova modale di avviso per il limite di lingue -->
    <div v-if="showMaxLanguagesAlert" class="max-languages-alert-overlay">
      <div class="max-languages-alert-content">
        <h4 class="alert-title">ATTENZIONE!</h4>
        <p class="alert-message">Puoi selezionare massimo {{ maxOtherLanguages }} lingue.</p>
        <div class="alert-actions">
          <button @click="showMaxLanguagesAlert = false" class="alert-button">Ho letto</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { languagesData } from '@/utils/language';
import CheckIcon from '@/assets/icons/check2-circle.svg'; // Icona corretta per la spunta

// Definisci le props
const props = defineProps({
  companyName: {
    type: String,
    default: '',
  },
});

// Definisci gli emits
const emit = defineEmits(['close']);

const authStore = useAuthStore();
const router = useRouter();

const allLanguages = languagesData;
const defaultLanguage = ref('it-IT');
const otherLanguages = ref([]);
const isLoading = ref(false);
const error = ref(null);
const isSaving = ref(false);
const saveError = ref(null);
const maxOtherLanguages = 4;

// Stato per la modale di avviso
const showMaxLanguagesAlert = ref(false);

const availableOtherLanguages = computed(() => {
  return allLanguages.filter(lang => lang.code !== defaultLanguage.value);
});

const isFormValid = computed(() => {
  // La validazione controlla che non ci siano più di 4 lingue secondarie
  return otherLanguages.value.length <= maxOtherLanguages;
});

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
    const leewayMs = 5 * 60 * 1000;
    return expirationTime.getTime() < currentTimeMs - leewayMs;
  } catch (e) {
    console.error('isTokenExpired:', e);
    return true;
  }
};

const fetchLanguages = async () => {
  isLoading.value = true;
  error.value = null;

  if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
    error.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
    await authStore.logout();
    router.push('/');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authStore.token}`,
    'Language': 'en-EN',
    //'Machinelanguage': '1',
  };
  if (props.companyName) {
    headers['Customer'] = props.companyName;
  }

  const apiUrl = `http://localhost:8000/api/customer_setting`;
  const filterNames = ['default_language', 'languages'];
  const queryParams = new URLSearchParams({
    filter: JSON.stringify({"name__in": filterNames})
  }).toString();

  try {
    const response = await fetch(`${apiUrl}?${queryParams}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
    }
    
    const rawData = await response.json();
    const settingsArray = rawData.data?.items || [];
    const settingsMap = settingsArray.reduce((acc, setting) => {
      acc[setting.name] = setting.value;
      return acc;
    }, {});

    defaultLanguage.value = settingsMap.default_language || 'it-IT';
    if (settingsMap.languages) {
        otherLanguages.value = settingsMap.languages.split(',').map(code => code.trim());
    } else {
        otherLanguages.value = [];
    }

  } catch (e) {
    console.error('Errore durante il recupero delle lingue:', e);
    error.value = `Impossibile caricare le lingue: ${e.message}.`;
  } finally {
    isLoading.value = false;
  }
};

const updateAvailableLanguages = () => {
  otherLanguages.value = otherLanguages.value.filter(code => code !== defaultLanguage.value);
};

const toggleOtherLanguage = (code) => {
  const index = otherLanguages.value.indexOf(code);
  if (index > -1) {
    otherLanguages.value.splice(index, 1);
  } else if (otherLanguages.value.length < maxOtherLanguages) {
    otherLanguages.value.push(code);
  } else {
    // Mostra la modale di avviso invece dell'alert() nativo
    showMaxLanguagesAlert.value = true;
  }
};

const saveLanguages = async () => {
  isSaving.value = true;
  saveError.value = null;

  if (!isFormValid.value) {
    saveError.value = `Errore: Puoi selezionare al massimo ${maxOtherLanguages} lingue aggiuntive.`;
    isSaving.value = false;
    return;
  }

  if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
    saveError.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
    await authStore.logout();
    router.push('/');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authStore.token}`,
    'Language': 'en-EN',
    //'Machinelanguage': '1',
  };
  if (props.companyName) {
    headers['Customer'] = props.companyName;
  }

  const apiUrl = `http://localhost:8000/api/customer_setting`;

  const payload = {
    items: [
      {
        name: 'default_language',
        value: defaultLanguage.value,
        customer_id: null
      },
      {
        name: 'languages',
        value: otherLanguages.value.join(','),
        customer_id: null
      }
    ]
  };
  
  console.log('Payload per salvataggio:', payload);

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || response.statusText}`);
    }

    console.log('Lingue salvate con successo:', await response.json());
    emit('close');
  } catch (e) {
    console.error('Errore durante il salvataggio delle lingue:', e);
    saveError.value = `Impossibile salvare le lingue: ${e.message}.`;
  } finally {
    isSaving.value = false;
  }
};

const cancel = () => {
  emit('close');
};

onMounted(() => {
  fetchLanguages();
});

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
  width: 85%;
  max-width: 800px;
  max-height: 100%;
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

.language-selection-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.language-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.language-select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
}

/* Nuovi stili per la lista di selezione singola */
.single-select-box {
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 5px;
  height: 450px; /* Aumentato l'altezza per contenere più elementi */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.single-select-item {
  padding: 7px 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.single-select-item:hover {
  background-color: #e2e6ea;
}

/* Stile per l'elemento selezionato nella lista singola */
.single-select-item.selected {
  background-color: #007bff;
  color: white;
}

.single-select-item.selected:hover {
  background-color: #0056b3;
}


.multi-select-box {
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 5px;
  height: 450px; /* Aumentato l'altezza per contenere più elementi */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.multi-select-item {
  padding: 7px 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.multi-select-item:hover {
  background-color: #e2e6ea;
}

.multi-select-item.selected {
  background-color: #007bff;
  color: white;
}

.multi-select-item.selected:hover {
  background-color: #0056b3;
}

.icon-svg {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
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
  border-radius: 5s;
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
  margin-top: 10px;
  padding: 10px;
}

/* Stili per la modale di avviso */
.max-languages-alert-overlay {
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

.max-languages-alert-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.alert-title {
  color: #dc3545; /* Rosso per l'avviso */
  font-size: 2em;
  font-weight: bold;
  margin: 0;
}

.alert-message {
  font-size: 1.1em;
  color: #555;
  margin: 15px 0 10px;
}

.alert-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
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

@media (max-width: 768px) {
  .language-selection-container {
    grid-template-columns: 1fr;
  }
}
</style>