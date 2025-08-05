<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="$emit('close')" class="close-button">X</button>
      <h3>Email di servizio per {{ companyName || 'Cliente' }}</h3>

      <div v-if="isLoading" class="loading-message">
        <p>Caricamento impostazioni email...</p>
        <div class="spinner"></div>
      </div>
      <div v-else-if="error" class="error-message">
        <p>Errore durante il caricamento: {{ error }}</p>
        <button @click="fetchServiceEmailSettings" class="retry-button">Riprova</button>
      </div>
      <div v-else class="input-section">
        <!-- Titolo mail di servizio (singola colonna) -->
        <div class="input-field-group">
          <label for="mailTitle">Titolo mail di servizio:</label>
          <div class="input-with-icon">
            <input 
              type="text" 
              id="mailTitle" 
              v-model="mailTitle"
              :placeholder="mailTitlePlaceholder"
              :class="getValidationClass(isMailTitleValid, mailTitle, false)"
            >
            <button class="help-button" title="Informazioni sul titolo dell'email" @click.stop="showHelp('mailTitle')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Campi email affiancati (due colonne) -->
        <div class="grid-columns">
          <!-- Direttore sistema di monitoraggio -->
          <div class="input-field-group">
            <label for="monitoringDirector">Direttore sistema di monitoraggio:</label>
            <div class="input-with-icon">
              <input 
                type="email" 
                id="monitoringDirector" 
                v-model="monitoringDirectorEmail"
                :placeholder="monitoringDirectorEmailPlaceholder"
                :class="getValidationClass(isMonitoringDirectorEmailValid, monitoringDirectorEmail, false)"
              >
              <button class="help-button" title="Informazioni sul direttore del sistema di monitoraggio" @click.stop="showHelp('monitoringDirector')">
                <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
              </button>
            </div>
          </div>

          <!-- Direttore controllo risorse -->
          <div class="input-field-group">
            <label for="resourceControlDirector">Direttore controllo risorse:</label>
            <div class="input-with-icon">
              <input 
                type="email" 
                id="resourceControlDirector" 
                v-model="resourceControlDirectorEmail"
                :placeholder="resourceControlDirectorEmailPlaceholder"
                :class="getValidationClass(isResourceControlDirectorEmailValid, resourceControlDirectorEmail, false)"
              >
              <button class="help-button" title="Informazioni sul direttore del controllo risorse" @click.stop="showHelp('resourceControlDirector')">
                <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
              </button>
            </div>
          </div>

          <!-- Gestore risorse -->
          <div class="input-field-group">
            <label for="resourceManager">Gestore risorse:</label>
            <div class="input-with-icon">
              <input 
                type="email" 
                id="resourceManager" 
                v-model="resourceManagerEmail"
                :placeholder="resourceManagerEmailPlaceholder"
                :class="getValidationClass(isResourceManagerEmailValid, resourceManagerEmail, false)"
              >
              <button class="help-button" title="Informazioni sul gestore risorse" @click.stop="showHelp('resourceManager')">
                <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
              </button>
            </div>
          </div>

          <!-- Responsabile di magazzino -->
          <div class="input-field-group">
            <label for="warehouseManager">Responsabile di magazzino:</label>
            <div class="input-with-icon">
              <input 
                type="email" 
                id="warehouseManager" 
                v-model="warehouseManagerEmail"
                :placeholder="warehouseManagerEmailPlaceholder"
                :class="getValidationClass(isWarehouseManagerEmailValid, warehouseManagerEmail, false)"
              >
              <button class="help-button" title="Informazioni sul responsabile di magazzino" @click.stop="showHelp('warehouseManager')">
                <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
              </button>
            </div>
          </div>
        </div>

        <!-- Indirizzo email di copia per conoscenza (CC) (singola colonna) -->
        <div class="input-field-group">
          <label for="ccEmail">Indirizzo email di copia per conoscenza (CC):</label>
          <div class="input-with-icon">
            <input 
              type="text" 
              id="ccEmail" 
              v-model="ccEmail"
              :placeholder="ccEmailPlaceholder"
              :class="getValidationClass(isCcEmailValid, ccEmail, true)"
            >
            <button class="help-button" title="Informazioni sull'indirizzo email di copia per conoscenza" @click.stop="showHelp('ccEmail')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Indirizzo email di copia per conoscenza nascosta (BCC) (singola colonna) -->
        <div class="input-field-group">
          <label for="bccEmail">Indirizzo email di copia per conoscenza nascosta (BCC):</label>
          <div class="input-with-icon">
            <input 
              type="text" 
              id="bccEmail" 
              v-model="bccEmail"
              :placeholder="bccEmailPlaceholder"
              :class="getValidationClass(isBccEmailValid, bccEmail, true)"
            >
            <button class="help-button" title="Informazioni sull'indirizzo email di copia per conoscenza nascosta" @click.stop="showHelp('bccEmail')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>
      </div>

      <ValidationLegend v-if="!isLoading && !error" />
      
      <div class="action-buttons">
        <button class="save-button" @click="saveServiceEmailSettings" :disabled="isSaving">
          {{ isSaving ? 'Salvataggio...' : 'Salva' }}
        </button>
        <button @click="$emit('close')" class="cancel-button" :disabled="isSaving">Annulla</button>
      </div>
      <div v-if="saveError" class="error-message save-error">
        <p>Errore durante il salvataggio: {{ saveError }}</p>
      </div>
    </div>

    <!-- Modale di Aiuto -->
    <HelpModal 
      v-if="showHelpModal" 
      :message="helpMessage" 
      @close="showHelpModal = false" 
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import ValidationLegend from '../ValidationLegend.vue';
import QuestionOctagonIcon from '@/assets/icons/question-octagon.svg';
import { titleRegex, emailRegex, multipleEmailsRegex } from '@/utils/regex';
import HelpModal from '@/components/common/HelpModal.vue';
import { useAuthStore } from '@/stores/auth'; // Importa lo store di autenticazione
import { useRouter } from 'vue-router'; // Importa useRouter per la navigazione

export default {
  name: 'ServiceEmailView',
  components: {
    ValidationLegend,
    HelpModal
  },
  emits: ['close'],
  props: {
    customerId: {
      type: Number,
      required: true
    },
    companyName: {
      type: String,
      default: 'Cliente'
    }
  },
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const router = useRouter();

    const mailTitle = ref('');
    const monitoringDirectorEmail = ref('');
    const resourceControlDirectorEmail = ref('');
    const resourceManagerEmail = ref('');
    const warehouseManagerEmail = ref('');
    const ccEmail = ref('');
    const bccEmail = ref('');

    // Nuovi ref per i placeholder
    const mailTitlePlaceholder = ref('');
    const monitoringDirectorEmailPlaceholder = ref('');
    const resourceControlDirectorEmailPlaceholder = ref('');
    const resourceManagerEmailPlaceholder = ref('');
    const warehouseManagerEmailPlaceholder = ref('');
    const ccEmailPlaceholder = ref('');
    const bccEmailPlaceholder = ref('');

    const isLoading = ref(true); // Stato di caricamento iniziale
    const error = ref(null);     // Stato di errore per il caricamento
    const isSaving = ref(false); // Stato di caricamento per il salvataggio
    const saveError = ref(null); // Stato di errore per il salvataggio

    // Mappa per memorizzare le impostazioni originali con i loro ID
    // Usiamo una Map per una ricerca efficiente per nome
    const originalSettingsMap = ref(new Map()); 

    // Stato per la modale di aiuto
    const showHelpModal = ref(false);
    const helpMessage = ref('');

    // Mappa i nomi dei campi ai loro messaggi di aiuto
    const helpMessagesMap = {
      mailTitle: "Questo campo stabilisce chi ti sta inviando la mail in genere appare in alto a sinistra nella mail in caratteri grandi. Il titolo dell'email di servizio deve contenere solo lettere (maiuscole/minuscole), numeri, spazi, trattini, underscore e punti.",
      monitoringDirector: "Questo è l'indirizzo mail del responsabile della gestione attraverso il pannello di controllo degli articoli che verranno utilizzati nel il locker. Una sola email è ammessa. Inserisci l'indirizzo email del direttore del sistema di monitoraggio. Deve essere un indirizzo email valido (es. nome@dominio.com).",
      resourceControlDirector: "Questa è la mail del responsabile degli oggetti che vengono gestiti dal loker, organizza il deposito di quelli nuovi, ed il ritiro di quelli guasti, o scaduti, oppure resi. Una sola email è ammessa. Inserisci l'indirizzo email del direttore del controllo risorse. Deve essere un indirizzo email valido.",
      resourceManager: "Questa è la mail del responsabile degli oggetti che vengono gestiti dal loker, organizza il deposito di quelli nuovi, ed il ritiro di quelli guasti, o scaduti, oppure resi. Una sola email è ammessa. Inserisci l'indirizzo email del gestore risorse. Deve essere un indirizzo email valido.",
      warehouseManager: "Questa è la mail di chi si occupa degli oggetti, inserendoli nel ciclo di produzione del locker, ei ritirare quelli difettosi o resi, di riparare le portelle guaste, di effettuare la pulizia dei cassetti. Una sola email è ammessa. Inserisci l'indirizzo email del responsabile di magazzino. Deve essere un indirizzo email valido.",
      ccEmail: "Qui sono elencati separati da virgola tutte le mail di coloro che devono ricevere una copia per conoscenza delle mail e che non si trovano elencati nei campi precedenti. Inserisci uno o più indirizzi email per la copia conoscenza (CC), separati da virgola. Questo campo è opzionale.",
      bccEmail: "Qui sono elencati separati da virgola tutte le mail di coloro che devono ricevere una copia per conoscenza nascosta delle mail e che non si trovano elencati nei campi precedenti. Inserisci uno o più indirizzi email per la copia conoscenza nascosta (BCC), separati da virgola. Questo campo è opzionale."
    };

    // Funzione per verificare la scadenza del token (riutilizzata da CustomerView)
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
        const leewayMs = 5 * 60 * 1000; // 5 minuti di tolleranza
        return expirationTime.getTime() < (currentTimeMs - leewayMs);
      } catch (e) {
        console.error('isTokenExpired: Errore durante la decodifica o la verifica del token JWT:', e);
        return true;
      }
    };

    // Funzione helper per gestire l'assegnazione di valori e placeholder
    const assignValue = (settingName, valueRef) => {
      const setting = originalSettingsMap.value.get(settingName);
      const fetchedValue = setting?.value;

      if (fetchedValue === 'define this value') {
        valueRef.value = ''; // Set v-model to empty string
      } else {
        valueRef.value = fetchedValue || '';
      }
    };

    // Funzione per recuperare i dati delle impostazioni email
    const fetchServiceEmailSettings = async () => {
      isLoading.value = true;
      error.value = null;

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        error.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        isLoading.value = false;
        await authStore.logout();
        router.push('/');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        'Language': authStore.selectedLanguage || 'en-EN',
        'Servicemail': '1', // Header richiesto per il filtro lato backend
      };
      
      if (props.companyName) {
        headers['Customer'] = props.companyName; // Nome dell'azienda per utenti normali
      } else {
        console.warn('Company name not available for Customer header in ServiceEmailView.');
      }

      const apiUrl = `http://localhost:8000/api/customer_setting`;
      let filter_data = {"name__in": ['sender_name', 'management_system_email', 'asset_manager', 'asset_service', 'warehouse_manager', 'agents_cc', 'email_bcc_addr']};
      const queryParams = new URLSearchParams({
          filter: JSON.stringify(filter_data) 
      }).toString();

      try {
        const response = await fetch(`${apiUrl}?${queryParams}`, {
          method: 'GET',
          headers: headers
        });

        if (response.ok) {
          const rawData = await response.json();
          console.log('Service Email Settings raw data received:', rawData);

          const settingsArray = rawData.data && rawData.data.items ? rawData.data.items : [];

          // Pulisci la mappa prima di riempirla
          originalSettingsMap.value.clear(); 

          // Popola la mappa
          settingsArray.forEach(setting => {
            originalSettingsMap.value.set(setting.name, {
              value: setting.value,
              id: setting.customer_setting_id
            });
          });

          // Mappa i valori ai ref del form usando la settingsMap e la nuova logica
          assignValue('sender_name', mailTitle);
          assignValue('management_system_email', monitoringDirectorEmail);
          assignValue('asset_manager', resourceControlDirectorEmail);
          assignValue('asset_service', resourceManagerEmail);
          assignValue('warehouse_manager', warehouseManagerEmail);
          assignValue('agents_cc', ccEmail);
          assignValue('email_bcc_addr', bccEmail);

        } else {
          const errorText = await response.text();
          console.error('Error fetching service email settings (response not ok):', response.status, errorText);
          error.value = `Impossibile caricare le impostazioni email: ${response.status} - ${errorText}`;
          if (response.status === 401 || response.status === 403) {
            await authStore.logout();
            router.push('/');
          }
        }
      } catch (err) {
        console.error('Network or server error fetching service email settings:', err);
        error.value = 'Impossibile connettersi al server per le impostazioni email.';
      } finally {
        isLoading.value = false;
      }
    };

    // Funzione per salvare i dati delle impostazioni email
    const saveServiceEmailSettings = async () => {
      isSaving.value = true;
      saveError.value = null;

      // Esegui la validazione prima di salvare
      if (!isMailTitleValid.value || !isMonitoringDirectorEmailValid.value ||
          !isResourceControlDirectorEmailValid.value || !isResourceManagerEmailValid.value ||
          !isWarehouseManagerEmailValid.value || !isCcEmailValid.value || !isBccEmailValid.value) {
        saveError.value = 'Per favor, correggi i campi evidenziati prima di salvare.';
        isSaving.value = false;
        return;
      }

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        saveError.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        isSaving.value = false;
        await authStore.logout();
        router.push('/');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        'Language': authStore.selectedLanguage || 'en-EN',
        'Servicemail': '1', // <-- AGGIUNTO: Invia l'header Servicemail per il PUT
      };

      // devo inserire il customer selezionato nella sidebar altrimenti non funziona
      if (props.companyName) {
        headers['Customer'] = props.companyName;
      } else {
        console.warn('Company name not available for Customer header in ServiceEmailView for saving.');
      }

      const apiUrl = `http://localhost:8000/api/customer_setting`; 

      const payload = {
          customer_id: props.customerId, // customer di cui si vuole i dati
          Customer: props.companyName, // customer di chi sta agendo (dal frontend)
          sender_name: mailTitle.value,
          management_system_email: monitoringDirectorEmail.value,
          asset_manager: resourceControlDirectorEmail.value,
          asset_service: resourceManagerEmail.value,
          warehouse_manager: warehouseManagerEmail.value,
          email_cc_addr: ccEmail.value, 
          email_bcc_addr: bccEmail.value,
      };

      console.log('Saving Service Email Settings to:', apiUrl);
      console.log('Payload:', payload);
      console.log('Headers:', headers);

      try {
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: headers,
          mode: 'cors', // Necessario per richieste cross-origin
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Service Email Settings saved successfully:', data);
          // Dopo il salvataggio, ricarica i dati per assicurarti che gli ID siano aggiornati
          // e che eventuali modifiche dal backend siano riflesse
          await fetchServiceEmailSettings(); 
          saveError.value = null; // Pulisci eventuali errori precedenti
          // alert('Impostazioni email salvate con successo!'); // Usa un alert temporaneo per feedback
          emit('close'); // Chiudi la modale dopo il salvataggio
        } else {
          const errorText = await response.text();
          console.error('Error saving service email settings (response not ok):', response.status, errorText);
          saveError.value = `Impossibile salvare le impostazioni email: ${response.status} - ${errorText}`;
          if (response.status === 401 || response.status === 403) {
            await authStore.logout();
            router.push('/');
          }
        }
      } catch (err) {
        console.error('Network or server error saving service email settings:', err);
        saveError.value = 'Impossibile connettersi al server per salvare le impostazioni email.';
      } finally {
        isSaving.value = false;
      }
    };

    // Computed properties per la validazione di ogni campo
    const isMailTitleValid = computed(() => {
      const isValid = titleRegex.test(mailTitle.value);
      return isValid;
    });
    const isMonitoringDirectorEmailValid = computed(() => {
      const isValid = emailRegex.test(monitoringDirectorEmail.value);
      return isValid;
    });
    const isResourceControlDirectorEmailValid = computed(() => {
      const isValid = emailRegex.test(resourceControlDirectorEmail.value);
      return isValid;
    });
    const isResourceManagerEmailValid = computed(() => {
      const isValid = emailRegex.test(resourceManagerEmail.value);
      return isValid;
    });
    const isWarehouseManagerEmailValid = computed(() => {
      const isValid = emailRegex.test(warehouseManagerEmail.value);
      return isValid;
    });
    const isCcEmailValid = computed(() => {
      if (ccEmail.value.trim() === '') {
        return true; // Opzionale, valido se vuoto
      }
      const isValid = multipleEmailsRegex.test(ccEmail.value);
      return isValid;
    });
    const isBccEmailValid = computed(() => {
      if (bccEmail.value.trim() === '') {
        return true; // Opzionale, valido se vuoto
      }
      const isValid = multipleEmailsRegex.test(bccEmail.value);
      return isValid;
    });

    // Funzione per determinare la classe di validazione del bordo
    const getValidationClass = (isValid, value, isOptional) => {
      const stringValue = String(value || '');
      const trimmedValue = stringValue.trim();

      if (trimmedValue === '') {
        return isOptional ? 'border-blue' : 'border-red'; // Blu se opzionale, rosso se obbligatorio
      }
      
      return isValid ? 'border-green' : 'border-red';
    };

    // Funzione per mostrare l'aiuto (ora apre la modale)
    const showHelp = (fieldName) => {
      helpMessage.value = helpMessagesMap[fieldName] || "Nessuna informazione di aiuto disponibile per questo campo.";
      showHelpModal.value = true;
    };

    // Chiamata API all'inizializzazione del componente
    onMounted(() => {
      if (props.customerId) {
        fetchServiceEmailSettings();
      } else {
        error.value = 'Nessun ID cliente fornito per caricare le impostazioni email.';
        isLoading.value = false;
      }
    });

    // Watcher per ricaricare i dati se il customerId cambia
    watch(() => props.customerId, (newId, oldId) => {
      if (newId && newId !== oldId) {
        fetchServiceEmailSettings();
      }
    });

    return {
      mailTitle,
      monitoringDirectorEmail,
      resourceControlDirectorEmail,
      resourceManagerEmail,
      warehouseManagerEmail,
      ccEmail,
      bccEmail,
      // Computed properties per i placeholder
      mailTitlePlaceholder: computed(() => {
        if (mailTitle.value.trim() === '' || !isMailTitleValid.value) {
          return 'define this value';
        }
        return '';
      }),
      monitoringDirectorEmailPlaceholder: computed(() => {
        if (monitoringDirectorEmail.value.trim() === '' || !isMonitoringDirectorEmailValid.value) {
          return 'define this value';
        }
        return '';
      }),
      resourceControlDirectorEmailPlaceholder: computed(() => {
        if (resourceControlDirectorEmail.value.trim() === '' || !isResourceControlDirectorEmailValid.value) {
          return 'define this value';
        }
        return '';
      }),
      resourceManagerEmailPlaceholder: computed(() => {
        if (resourceManagerEmail.value.trim() === '' || !isResourceManagerEmailValid.value) {
          return 'define this value';
        }
        return '';
      }),
      warehouseManagerEmailPlaceholder: computed(() => {
        if (warehouseManagerEmail.value.trim() === '' || !isWarehouseManagerEmailValid.value) {
          return 'define this value';
        }
        return '';
      }),
      ccEmailPlaceholder: computed(() => {
        if (ccEmail.value.trim() === '' || !isCcEmailValid.value) {
          return 'define this value';
        }
        return '';
      }),
      bccEmailPlaceholder: computed(() => {
        if (bccEmail.value.trim() === '' || !isBccEmailValid.value) {
          return 'define this value';
        }
        return '';
      }),
      isMailTitleValid,
      isMonitoringDirectorEmailValid,
      isResourceControlDirectorEmailValid,
      isResourceManagerEmailValid,
      isWarehouseManagerEmailValid,
      isCcEmailValid,
      isBccEmailValid,
      getValidationClass,
      QuestionOctagonIcon,
      showHelp,
      showHelpModal,
      helpMessage,
      isLoading,
      error,
      isSaving,
      saveError,
      fetchServiceEmailSettings,
      saveServiceEmailSettings,
      companyName
    };
  }
}
</script>

<style scoped>
.app-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Sfondo semi-trasparente */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Assicura che sia sopra gli altri elementi */
}

.app-view-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 85%; /* Larghezza della "finestra" */
  max-width: 1000px; /* Larghezza massima ridotta */
  max-height: 90%; /* Altezza massima */
  overflow-y: auto; /* Scorri se il contenuto è troppo lungo */
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
}

p {
  color: #555;
  margin-bottom: 20px;
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


.input-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Nuovo stile per la griglia a due colonne */
.grid-columns {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Due colonne di uguale larghezza */
  gap: 15px; /* Spazio tra le colonne e le righe */
}

/* Assicurati che i campi input all'interno della griglia mantengano il loro layout */
.grid-columns .input-field-group {
  display: flex;
  flex-direction: column; /* Ogni campo nella griglia è ancora una colonna verticale */
}

.input-field-group label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.input-with-icon {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-with-icon input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #d1d5db; /* Bordo predefinito leggero */
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none; /* Rimuove l'outline predefinito del browser */
}

/* Stile per l'input in focus: aggiunge solo l'ombra */
.input-with-icon input:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25); /* Ombra blu su focus */
}


/* Classi per i bordi di validazione (con !important per priorità) */
.input-with-icon input.border-red {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25) !important;
}

.input-with-icon input.border-green {
  border-color: #28a745 !important;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25) !important;
}

.input-with-icon input.border-blue {
  border-color: #007bff !important;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
}

/* Stili per il pulsante di aiuto */
.help-button {
  background: none;
  border: none; /* Nessun bordo */
  border-radius: 0; /* Nessun bordo rotondo */
  width: 30px; /* Dimensione del pulsante */
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0; /* Rimuovi padding predefinito del button */
  transition: background-color 0.2s ease;
}

.help-button:hover {
  background-color: #e9f5ff; /* Sfondo leggero al hover */
}

.help-icon-svg {
  width: 22px; /* Dimensione dell'SVG aumentata */
  height: 22px; /* Dimensione dell'SVG aumentata */
  color: #000; /* Colore dell'icona impostato a nero */
  filter: none; /* Rimosso il filtro che lo rendeva blu */
}


.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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

/* Media query per schermi più piccoli per mantenere la singola colonna */
@media (max-width: 768px) {
  .grid-columns {
    grid-template-columns: 1fr; /* Torna a singola colonna su schermi più piccoli */
  }
}
</style>