<template>
  <div class="dashboard-view">
    <h2>Report</h2>
    <p>Qui verranno visualizzati i report e le statistiche.</p>
  </div>
</template>

<script>
export default {
  name: 'ReportsView'
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