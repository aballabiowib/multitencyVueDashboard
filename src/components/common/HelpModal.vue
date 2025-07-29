<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3 class="modal-title">{{ title }}</h3>
      <div class="modal-message">
        <p>{{ message }}</p>
      </div>
      <div class="modal-actions">
        <button @click="$emit('close')" class="modal-button ok-button">Ok, letto</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelpModal',
  props: {
    title: {
      type: String,
      default: 'Informazione sul campo'
    },
    message: {
      type: String,
      required: true
    }
  },
  emits: ['close']
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); /* Sfondo più scuro per l'overlay */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* Assicura che sia sopra tutte le altre modali o overlay */
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px; /* Dimensione compatta */
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

.modal-title {
  color: #007bff;
  margin-top: 0;
  font-size: 1.6em;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.modal-message p {
  margin: 0;
  color: #333;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}

.modal-button {
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.ok-button {
  background-color: #007bff;
  color: white;
  border: 1px solid #007bff;
}

.ok-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}
</style>