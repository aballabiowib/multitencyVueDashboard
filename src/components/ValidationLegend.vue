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
  /* Ulteriormente ridotto il padding per rendere più compatto */
  padding: 10px 20px;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.validation-legend-container h3 {
  color: #007bff;
  font-size: 1.1em; /* Ridotto ulteriormente il font size */
  margin-top: 0;
  margin-bottom: 5px; /* Ridotto il margine inferiore del titolo */
  border-bottom: 1px dashed #e0e0e0;
  padding-bottom: 5px;
}

.legend-items-grid {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.9em;
  color: #555;
  flex-basis: auto;
}

.legend-color-box {
  width: 14px;
  height: 14px;
  border: 1px solid #ccc;
  border-radius: 3px;
  margin-right: 8px;
  flex-shrink: 0;
}

.valid-color {
  background-color: #28a745;
  border-color: #28a745;
}

.invalid-color {
  background-color: #dc3545;
  border-color: #dc3545;
}

.optional-color {
  background-color: #0e6cf0;
  border-color: #0e6cf0;
}

.readonly-color {
  background-color: #f38c06;
  border-color: #f38c06;
}

/* Media Query per schermi piccoli */
@media (max-width: 768px) {
  .legend-items-grid {
    justify-content: flex-start;
    gap: 10px;
  }
}
</style>
