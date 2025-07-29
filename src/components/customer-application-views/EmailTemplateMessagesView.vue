<template>
  <div class="app-view-overlay">
    <div class="app-view-content">
      <h3>Messaggi email template</h3>
      <p>Questa è la vista per i messaggi dei template email.</p>
      <button @click="$emit('close')" class="close-button">Chiudi</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServiceEmailView',
  emits: ['close'] // Dichiara l'evento 'close' che il componente emetterà
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
  width: 80%; /* Larghezza della "finestra" */
  max-width: 800px; /* Larghezza massima */
  max-height: 80%; /* Altezza massima */
  overflow-y: auto; /* Scorri se il contenuto è troppo lungo */
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #333;
}
</style>