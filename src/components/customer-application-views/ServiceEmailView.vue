<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="$emit('close')" class="close-button">X</button>
      <h3>Email di servizio</h3>
      <div class="input-section">
        <!-- Titolo mail di servizio (singola colonna) -->
        <div class="input-field-group">
          <label for="mailTitle">Titolo mail di servizio:</label>
          <div class="input-with-icon">
            <input 
              type="text" 
              id="mailTitle" 
              v-model="mailTitle"
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
              :class="getValidationClass(isBccEmailValid, bccEmail, true)"
            >
            <button class="help-button" title="Informazioni sull'indirizzo email di copia per conoscenza nascosta" @click.stop="showHelp('bccEmail')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>
      </div>

      <ValidationLegend />
      
      <div class="action-buttons">
        <button class="save-button">Salva</button>
        <button @click="$emit('close')" class="cancel-button">Annulla</button>
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
import { ref, computed } from 'vue';
import ValidationLegend from '../ValidationLegend.vue';
import QuestionOctagonIcon from '@/assets/icons/question-octagon.svg';
import { titleRegex, emailRegex, multipleEmailsRegex } from '@/utils/regex';
import HelpModal from '@/components/common/HelpModal.vue'; // Importa il nuovo componente modale

export default {
  name: 'ServiceEmailView',
  components: {
    ValidationLegend,
    HelpModal // Registra il componente modale
  },
  emits: ['close'],
  setup() {
    const mailTitle = ref('');
    const monitoringDirectorEmail = ref('');
    const resourceControlDirectorEmail = ref('');
    const resourceManagerEmail = ref('');
    const warehouseManagerEmail = ref('');
    const ccEmail = ref('');
    const bccEmail = ref('');

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

    // Computed properties per la validazione di ogni campo
    const isMailTitleValid = computed(() => {
      const isValid = titleRegex.test(mailTitle.value);
      console.log(`Validation: mailTitle="${mailTitle.value}" -> isValid: ${isValid}`);
      return isValid;
    });
    const isMonitoringDirectorEmailValid = computed(() => {
      const isValid = emailRegex.test(monitoringDirectorEmail.value);
      console.log(`Validation: monitoringDirectorEmail="${monitoringDirectorEmail.value}" -> isValid: ${isValid}`);
      return isValid;
    });
    const isResourceControlDirectorEmailValid = computed(() => {
      const isValid = emailRegex.test(resourceControlDirectorEmail.value);
      console.log(`Validation: resourceControlDirectorEmail="${resourceControlDirectorEmail.value}" -> isValid: ${isValid}`);
      return isValid;
    });
    const isResourceManagerEmailValid = computed(() => {
      const isValid = emailRegex.test(resourceManagerEmail.value);
      console.log(`Validation: resourceManagerEmail="${resourceManagerEmail.value}" -> isValid: ${isValid}`);
      return isValid;
    });
    const isWarehouseManagerEmailValid = computed(() => {
      const isValid = emailRegex.test(warehouseManagerEmail.value);
      console.log(`Validation: warehouseManagerEmail="${warehouseManagerEmail.value}" -> isValid: ${isValid}`);
      return isValid;
    });
    const isCcEmailValid = computed(() => {
      if (ccEmail.value.trim() === '') {
        console.log(`Validation: ccEmail="${ccEmail.value}" -> isValid: true (optional and empty)`);
        return true; // Opzionale, valido se vuoto
      }
      const isValid = multipleEmailsRegex.test(ccEmail.value);
      console.log(`Validation: ccEmail="${ccEmail.value}" -> isValid: ${isValid}`);
      return isValid;
    });
    const isBccEmailValid = computed(() => {
      if (bccEmail.value.trim() === '') {
        console.log(`Validation: bccEmail="${bccEmail.value}" -> isValid: true (optional and empty)`);
        return true; // Opzionale, valido se vuoto
      }
      const isValid = multipleEmailsRegex.test(bccEmail.value);
      console.log(`Validation: bccEmail="${bccEmail.value}" -> isValid: ${isValid}`);
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

    return {
      mailTitle,
      monitoringDirectorEmail,
      resourceControlDirectorEmail,
      resourceManagerEmail,
      warehouseManagerEmail,
      ccEmail,
      bccEmail,
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
      showHelpModal, // Esporre al template
      helpMessage,   // Esporre al template
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