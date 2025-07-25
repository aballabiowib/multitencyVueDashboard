import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia' // Importa Pinia
import router from './router'

// Importa i moduli Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUserTie, faSortAlphaDown, faSortAlphaUp } from '@fortawesome/free-solid-svg-icons' // Icone solide
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons' // Icone regolari (per far fa-trash-alt)
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Aggiungi le icone che intendi usare alla libreria
library.add(faUserTie, faTrashAlt, faSortAlphaDown, faSortAlphaUp) // Aggiungi le icone che vuoi usare

const app = createApp(App)
const pinia = createPinia() // Crea l'istanza di Pinia

app.use(pinia) // Usa Pinia nell'applicazione Vue
app.use(router)

// Registra il componente Font Awesome globalmente
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')