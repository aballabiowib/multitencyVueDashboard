<!-- src/components/dashboard-views/DbMaintenanceView.vue -->
<template>
  <div class="dashboard-view">
    <h2>Gestione Database</h2>
    <p>Qui potrai visualizzare e gestire le informazioni relative ai tuoi database.</p>
    <!-- Contenuto specifico per la gestione clienti -->
  </div>
</template>

<script>
export default {
  name: 'DbMaintenanceView'
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