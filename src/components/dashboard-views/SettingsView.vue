<template>
  <div class="dashboard-view">
    <h2>Impostazioni</h2>
    <p>Qui l'utente potrà modificare le impostazioni dell'account.</p>
  </div>
</template>

<script>
export default {
  name: 'SettingsView'
};
</script>

<style scoped>
.dashboard-view {
  padding: 30px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow-y: auto;
}
h2 {
  color: #007bff;
  margin-bottom: 20px;
}
</style>