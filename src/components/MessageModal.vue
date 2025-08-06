<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
      </div>
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button @click="$emit('close')" class="modal-button ok-button">OK, capito</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessageModal',
  props: {
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    }
  },
  emits: ['close']
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); /* Sfondo semi-trasparente */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* Assicurati che sia sopra DeletedCustomerView */
}

.modal-container {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
  width: 90%;
  max-width: 400px; /* Larghezza fissa per il modale */
  padding: 25px;
  display: flex;
  flex-direction: column;
  text-align: center;
  animation: fadeInScale 0.3s ease-out;
}

.modal-header {
  margin-bottom: 15px;
}

.modal-title {
  font-size: 1.8em;
  color: #007bff; /* Colore blu per il titolo */
  margin: 0;
  font-weight: bold;
}

.modal-body {
  margin-bottom: 25px;
}

.modal-body p {
  font-size: 1.1em;
  color: #333;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: center;
}

.modal-button {
  padding: 10px 25px;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.ok-button {
  background-color: #007bff;
  color: white;
}

.ok-button:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>