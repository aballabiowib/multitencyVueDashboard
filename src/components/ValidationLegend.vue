<!-- src/components/ValidationLegend.vue -->
<template>
  <div class="validation-legend-container">
    <h3>Legenda Campi</h3>
    <div class="legend-items-grid">
      <div class="legend-item">
        <span class="legend-color-box valid-color"></span>
        <span>Campo valido</span>
      </div>
      <div class="legend-item">
        <span class="legend-color-box invalid-color"></span>
        <span>Campo non valido</span>
      </div>
      <div class="legend-item">
        <span class="legend-color-box optional-color"></span>
        <span>Campo opzionale</span>
      </div>
      <div class="legend-item">
        <span class="legend-color-box readonly-color"></span>
        <span>Campo sola lettura</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ValidationLegend'
}
</script>

<style scoped>
.validation-legend-container {
  margin-top: 10px; /* Spazio sopra la legenda */
  padding: 30px;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.validation-legend-container h3 {
  color: #007bff;
  font-size: 1.6em;
  margin-top: 0;
  margin-bottom: 25px;
  border-bottom: 1px dashed #e0e0e0;
  padding-bottom: 10px;
}

.legend-items-grid {
  display: flex; /* Utilizza flexbox per distribuire gli elementi */
  justify-content: space-around; /* Distribuisce lo spazio equamente tra gli elementi */
  align-items: center;
  flex-wrap: wrap; /* Permette agli elementi di andare a capo su schermi piccoli */
  gap: 20px; /* Spazio tra gli elementi della legenda */
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.95em;
  color: #555;
  flex-basis: auto; /* Permette all'elemento di prendere solo lo spazio necessario */
}

.legend-color-box {
  width: 16px;
  height: 16px;
  border: 1px solid #ccc;
  border-radius: 3px;
  margin-right: 10px;
  flex-shrink: 0; /* Impedisce che si restringa */
}

.valid-color {
  background-color: #28a745; /* Verde */
  border-color: #28a745;
}

.invalid-color {
  background-color: #dc3545; /* Rosso */
  border-color: #dc3545;
}

.optional-color {
  background-color: #0e6cf0; /* Giallo/Arancione chiaro */
  border-color: #0e6cf0;
}

.readonly-color {
  background-color: #f38c06; /* Grigio */
  border-color: #f38c06;
}

/* Media Query per schermi piccoli */
@media (max-width: 768px) {
  .legend-items-grid {
    justify-content: flex-start; /* Allinea a sinistra su mobile */
    gap: 15px; /* Riduci il gap su mobile */
  }
}
</style>
