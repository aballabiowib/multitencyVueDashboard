<!-- src/App.vue -->
<template>
  <div id="StartPage"> 
    <!-- <LoginPage /> -->
    <!-- Rimuovi LoginPage qui sopra e usa <router-view> -->
    <router-view></router-view>
  </div>
</template>

<script>
// Non è più necessario importare LoginPage qui se lo gestisce il router
// import LoginPage from './components/LoginPage.vue'; 

// export default {
//   name: 'StartPage',
//   components: {
//     // Non è più necessario registrare LoginPage qui se lo gestisce il router
//     // LoginPage 
//   }
// }
</script>

<style>
/* Stili globali per assicurare che html, body e #app occupino tutta la pagina */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

#app {
  margin:0;
  padding: 0;
  width: 100%;
  height: 100vh;
  min-width: 100%;
  overflow: hidden;
  position: relative;
}
</style>