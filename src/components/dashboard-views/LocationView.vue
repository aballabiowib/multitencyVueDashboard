<!-- src/components/dashboard-views/LocationView.vue -->
<template>
  <div class="dashboard-view">
    <h2>Gestione Località</h2>
    <p>Qui potrai visualizzare e gestire le diverse località o sedi.</p>
    <!-- Contenuto specifico per la gestione delle località -->
  </div>
</template>

<script>
export default {
  name: 'LocationView'
};
</script>

<style scoped>
.dashboard-view {
  padding: 30px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: 100%; /* Occupa l'altezza disponibile */
  overflow-y: auto; /* Permette lo scroll se il contenuto è troppo lungo */
}
h2 {
  color: #007bff;
  margin-bottom: 20px;
}
p {
  margin-bottom: 10px;
  color: #555;
}
</style>