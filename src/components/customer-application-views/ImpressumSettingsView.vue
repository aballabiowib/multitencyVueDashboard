<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <button @click="$emit('close')" class="close-button">X</button>
      <h3>Impressum</h3>

      <div class="input-section">
        <div class="input-field-group">
          <label for="impressumHtml">Testo dell'Impressum:</label>
          <div class="input-with-icon">
            <textarea
              id="impressumHtml"
              v-model="impressumHtml"
              rows="15"
              placeholder="Inserisci qui il codice HTML per la tua pagina Impressum. Questo contenuto verrà mostrato solo ai clienti con lingua de-DE o at-AT."
            ></textarea>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="saveImpressum" class="save-button">Salva</button>
        <button @click="cancel" class="cancel-button">Annulla</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImpressumView', // Nome del componente
  emits: ['close', 'save'], // Dichiara gli eventi 'close' e 'save'

  data() {
    return {
      impressumHtml: '' // Dati per la textarea dell'HTML dell'impressum
    };
  },

  methods: {
    /**
     * Metodo chiamato quando l'utente clicca su "Salva".
     * Emette l'evento 'save' passando il contenuto HTML della textarea.
     */
    saveImpressum() {
      console.log('Salvataggio Impressum:', this.impressumHtml);
      this.$emit('save', this.impressumHtml);
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
/* Stili per l'overlay e il contenuto, copiati e adattati da ServiceEmailView */
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
  text-align: center; /* Centrato come nell'esempio di ServiceEmailView */
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex-grow: 1; /* Permette alla sezione input di espandersi */
}

.input-field-group label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
  display: block; /* Assicura che la label sia su una riga separata */
}

.input-with-icon {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-with-icon textarea { /* Stili applicati direttamente alla textarea */
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #d1d5db; /* Bordo predefinito leggero */
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none; /* Rimuove l'outline predefinito del browser */
  min-height: 250px; /* Altezza minima aumentata per la textarea */
  width: 100%; /* La textarea occupa tutta la larghezza disponibile */
}

/* Stile per la textarea in focus */
.input-with-icon textarea:focus {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25); /* Ombra blu su focus */
  border-color: #007bff; /* Bordo blu su focus */
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px; /* Aggiunto padding superiore per separazione */
  border-top: 1px solid #e0e0e0; /* Aggiunto bordo superiore per separazione */
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
