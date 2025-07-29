<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="$emit('close')" class="close-button">X</button>
      <h3>Impostazioni settaggi particolari locker</h3>

      <div class="input-section">
        <!-- Abilita inserimento manuale codice a barre -->
        <div class="input-field-group toggle-group">
          <label for="manualBarcodeInput">Abilita la capacità di abilitare l'inserimento manuale del codice a barre:</label>
          <div class="control-and-help">
            <label class="switch">
              <input type="checkbox" v-model="settings.manualBarcodeInput" id="manualBarcodeInput">
              <span class="slider round"></span>
            </label>
            <button class="help-button" title="Informazioni sull'inserimento manuale del codice a barre" @click.stop="showHelp('manualBarcodeInput')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Abilita login amministratori con mail e password -->
        <div class="input-field-group toggle-group">
          <label for="adminLoginWithEmail">Abilita la possibilità agli amministratori di loggarsi con mail e password sul locker:</label>
          <div class="control-and-help">
            <label class="switch">
              <input type="checkbox" v-model="settings.adminLoginWithEmail" id="adminLoginWithEmail">
              <span class="slider round"></span>
            </label>
            <button class="help-button" title="Informazioni sul login degli amministratori" @click.stop="showHelp('adminLoginWithEmail')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Consenti "Altri" nell'inserimento dei guasti -->
        <div class="input-field-group toggle-group">
          <label for="allowOtherFaults">Consenti "Altri" nell'inserimento dei guasti sul locker:</label>
          <div class="control-and-help">
            <label class="switch">
              <input type="checkbox" v-model="settings.allowOtherFaults" id="allowOtherFaults">
              <span class="slider round"></span>
            </label>
            <button class="help-button" title="Informazioni sull'opzione 'Altri' nei guasti" @click.stop="showHelp('allowOtherFaults')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Ricorda la scadenza di uso degli articoli in uso (h, m) -->
        <div class="input-field-group align-right-group">
          <label>Ricorda la scadenza di uso degli articoli in uso:</label>
          <div class="control-and-help">
            <div class="input-time-group">
              <div class="input-unit-wrapper">
                <span class="unit-label">h</span>
                <input type="number" v-model.number="settings.itemExpirationHours" placeholder="Ore" min="0">
              </div>
              <div class="input-unit-wrapper">
                <span class="unit-label">m</span>
                <input type="number" v-model.number="settings.itemExpirationMinutes" placeholder="Minuti" min="0" max="59">
              </div>
            </div>
            <button class="help-button" title="Informazioni sulla scadenza degli articoli" @click.stop="showHelp('itemExpiration')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Chiedi agli amministratori se vogliono fare un altro deposito -->
        <div class="input-field-group toggle-group">
          <label for="askAnotherDeposit">Chiedi agli amministratori se vogliono fare un altro deposito:</label>
          <div class="control-and-help">
            <label class="switch">
              <input type="checkbox" v-model="settings.askAnotherDeposit" id="askAnotherDeposit">
              <span class="slider round"></span>
            </label>
            <button class="help-button" title="Informazioni sulla richiesta di un altro deposito" @click.stop="showHelp('askAnotherDeposit')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Mostra il pulsante riapri cella -->
        <div class="input-field-group toggle-group">
          <label for="showReopenCellButton">Mostra il pulsante riapri cella:</label>
          <div class="control-and-help">
            <label class="switch">
              <input type="checkbox" v-model="settings.showReopenCellButton" id="showReopenCellButton">
              <span class="slider round"></span>
            </label>
            <button class="help-button" title="Informazioni sul pulsante riapri cella" @click.stop="showHelp('showReopenCellButton')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Mostra il tasto di cambio dimensione cella -->
        <div class="input-field-group toggle-group">
          <label for="showChangeCellSizeButton">Mostra il tasto di cambio dimensione cella:</label>
          <div class="control-and-help">
            <label class="switch">
              <input type="checkbox" v-model="settings.showChangeCellSizeButton" id="showChangeCellSizeButton">
              <span class="slider round"></span>
            </label>
            <button class="help-button" title="Informazioni sul tasto di cambio dimensione cella" @click.stop="showHelp('showChangeCellSizeButton')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Abilita il pulsante difettoso in (gestione dei beni) -->
        <div class="input-field-group toggle-group">
          <label for="enableDefectiveButton">Abilita il pulsante difettoso in (gestione dei beni):</label>
          <div class="control-and-help">
            <label class="switch">
              <input type="checkbox" v-model="settings.enableDefectiveButton" id="enableDefectiveButton">
              <span class="slider round"></span>
            </label>
            <button class="help-button" title="Informazioni sul pulsante difettoso" @click.stop="showHelp('enableDefectiveButton')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Ricordami la scadenza della password giorni prima -->
        <div class="input-field-group align-right-group">
          <label for="passwordExpirationDays">Ricordami la scadenza della password giorni prima:</label>
          <div class="control-and-help">
            <div class="input-with-unit">
              <div class="input-unit-wrapper">
                <span class="unit-label">Giorni</span>
                <input type="number" v-model.number="settings.passwordExpirationDays" id="passwordExpirationDays" placeholder="Giorni" min="0">
              </div>
            </div>
            <button class="help-button" title="Informazioni sulla scadenza della password" @click.stop="showHelp('passwordExpirationDays')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>

        <!-- Abilita la funzione di avviso di scadenza della password -->
        <div class="input-field-group toggle-group">
          <label for="enablePasswordExpirationAlert">Abilita la funzione di avviso di scadenza della password:</label>
          <div class="control-and-help">
            <label class="switch">
              <input type="checkbox" v-model="settings.enablePasswordExpirationAlert" id="enablePasswordExpirationAlert">
              <span class="slider round"></span>
            </label>
            <button class="help-button" title="Informazioni sull'avviso di scadenza della password" @click.stop="showHelp('enablePasswordExpirationAlert')">
              <img :src="QuestionOctagonIcon" class="help-icon-svg" alt="Aiuto" />
            </button>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="saveSettings" class="save-button">Salva</button>
        <button @click="cancel" class="cancel-button">Annulla</button>
      </div>
    </div>

    <!-- Modale di Aiuto (Assumi che questo componente sia già definito altrove nel tuo progetto) -->
    <HelpModal
      v-if="showHelpModal"
      :message="helpMessage"
      @close="showHelpModal = false"
    />
  </div>
</template>

<script>
// Importa l'icona del punto interrogativo
import QuestionOctagonIcon from '@/assets/icons/question-octagon.svg';
// Importa il componente modale di aiuto (assicurati che il percorso sia corretto)
import HelpModal from '@/components/common/HelpModal.vue';

export default {
  name: 'OtherSettingView',
  emits: ['close', 'save'],
  components: {
    HelpModal // Registra il componente modale
  },

  data() {
    return {
      // Espone QuestionOctagonIcon al template
      QuestionOctagonIcon: QuestionOctagonIcon,
      // Mappa i nomi dei campi ai loro messaggi di aiuto.
      helpMessagesMap: {
        manualBarcodeInput: "Abilita questa opzione per consentire agli utenti di inserire manualmente il codice a barre degli articoli, invece di utilizzare solo la scansione.",
        adminLoginWithEmail: "Se abilitato, gli amministratori potranno accedere al locker utilizzando le loro credenziali email e password.",
        allowOtherFaults: "Consenti agli utenti di selezionare l'opzione 'Altri' quando segnalano un guasto sul locker, permettendo una descrizione personalizzata.",
        itemExpiration: "Imposta un promemoria per la scadenza degli articoli in uso, specificando ore e minuti prima della scadenza.",
        askAnotherDeposit: "Dopo un deposito, il sistema chiederà agli amministratori se desiderano effettuare un altro deposito immediatamente.",
        showReopenCellButton: "Mostra un pulsante che consente di riaprire una cella dopo che è stata chiusa, utile per correzioni o dimenticanze.",
        showChangeCellSizeButton: "Mostra un pulsante che permette di cambiare la dimensione della cella selezionata durante il processo di deposito o ritiro.",
        enableDefectiveButton: "Abilita un pulsante nella gestione dei beni che permette di contrassegnare un articolo come 'difettoso'.",
        passwordExpirationDays: "Definisce quanti giorni prima della scadenza della password verrà mostrato un avviso agli amministratori.",
        enablePasswordExpirationAlert: "Abilita la funzione che avvisa gli amministratori quando la loro password è in scadenza, basandosi sul numero di giorni impostato."
      },
      settings: {
        manualBarcodeInput: false,
        adminLoginWithEmail: false,
        allowOtherFaults: false,
        itemExpirationHours: 0,
        itemExpirationMinutes: 0,
        askAnotherDeposit: false,
        showReopenCellButton: false,
        showChangeCellSizeButton: false,
        enableDefectiveButton: false,
        passwordExpirationDays: 0,
        enablePasswordExpirationAlert: false,
      },
      showHelpModal: false, // Controlla la visibilità della modale di aiuto
      helpMessage: '',      // Contiene il messaggio da mostrare nella modale
    };
  },

  mounted() {
    // Logga il valore di QuestionOctagonIcon per debug
    console.log('QuestionOctagonIcon value in mounted:', this.QuestionOctagonIcon);
  },

  methods: {
    /**
     * Mostra la modale di aiuto con il messaggio appropriato per il campo specificato.
     * @param {string} fieldName - Il nome del campo per cui mostrare l'aiuto.
     */
    showHelp(fieldName) {
      this.helpMessage = this.helpMessagesMap[fieldName] || "Nessuna informazione di aiuto disponibile per questo campo.";
      this.showHelpModal = true;
    },

    /**
     * Metodo chiamato quando l'utente clicca su "Salva".
     * Emette l'evento 'save' passando tutti i settaggi.
     */
    saveSettings() {
      console.log('Salvataggio impostazioni:', this.settings);
      this.$emit('save', this.settings);
      this.$emit('close'); // Chiude la vista dopo il salvataggio
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
/* Stili globali per l'overlay e il contenuto */
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
  font-family: 'Inter', sans-serif; /* Utilizzo del font Inter */
}

.app-view-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 85%; /* Larghezza della "finestra" */
  max-width: 1000px; /* Larghezza massima */
  max-height: 90%; /* Altezza massima */
  overflow-y: auto; /* Scorri se il contenuto è troppo lungo */
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px; /* Spazio tra gli elementi interni */
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
  text-align: center; /* Centrato */
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex-grow: 1; /* Permette alla sezione input di espandersi */
}

.input-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-field-group label {
  font-weight: bold;
  color: #333;
  display: block;
}

/* Stili per gli input numerici */
.input-time-group, .input-with-unit {
  display: flex;
  align-items: center;
  gap: 10px; /* Spazio tra i wrapper delle unità */
}

/* Nuovo stile per il wrapper dell'input con unità */
.input-unit-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  overflow: hidden; /* Assicura che gli angoli arrotondati funzionino correttamente */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.input-unit-wrapper:focus-within { /* Stile al focus dell'intero wrapper */
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  border-color: #007bff;
}

.input-unit-wrapper input {
  padding: 8px 12px;
  border: none; /* Rimuovi il bordo dall'input stesso */
  outline: none;
  font-size: 1em;
  width: 80px; /* Larghezza fissa per input numerici brevi */
  text-align: center;
  border-radius: 0 5px 5px 0; /* Arrotonda solo il lato destro dell'input */
}

.unit-label {
  background-color: #f0f0f0; /* Fondo grigio chiaro */
  padding: 8px 10px;
  font-weight: bold;
  color: #555;
  border-radius: 5px 0 0 5px; /* Arrotonda solo il lato sinistro dell'etichetta */
  flex-shrink: 0; /* Impedisce all'etichetta di restringersi */
}


/* Stili per gli interruttori (toggle switch) e i gruppi allineati a destra */
.toggle-group, .align-right-group {
  display: flex; /* Usa flexbox */
  flex-direction: row; /* La label e l'elemento di controllo sono affiancati */
  justify-content: space-between; /* Spazio tra label e il nuovo div .control-and-help */
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.toggle-group:last-of-type, .align-right-group:last-of-type {
  border-bottom: none;
}

/* Nuovo stile per il contenitore del controllo e del pulsante di aiuto */
.control-and-help {
  display: flex;
  align-items: center;
  gap: 10px; /* Spazio tra il controllo (switch/input) e il pulsante di aiuto */
  flex-shrink: 0; /* Impedisce a questo contenitore di restringersi */
}

.switch {
  position: relative;
  display: inline-block;
  width: 45px;
  height: 25px;
  flex-shrink: 0; /* Impedisce allo switch di restringersi */
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 25px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 17px;
  width: 17px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #007bff;
}

input:focus + .slider {
  box-shadow: 0 0 1px #007bff;
}

input:checked + .slider:before {
  -webkit-transform: translateX(20px);
  -ms-transform: translateX(20px);
  transform: translateX(20px);
}

/* Stili per il pulsante di aiuto */
.help-button {
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0; /* Impedisce al pulsante di restringersi */
  padding: 0;
  transition: background-color 0.2s ease;
}

.help-button:hover {
  background-color: #e9f5ff;
}

.help-icon-svg {
  width: 22px;
  height: 22px;
  color: #000; /* Colore dell'icona impostato a nero */
  filter: none;
}

/* Stili per i pulsanti di azione */
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
</style>