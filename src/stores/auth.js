// src/stores/auth.js
import { defineStore } from 'pinia';

// Chiavi per localStorage
const AUTH_STATE_KEY = 'auth_state';
const CUSTOMER_LIST_CACHE_KEY = 'cached_customer_list';
const CACHED_USER_ID_KEY = 'cached_user_id_for_customers';

export const useAuthStore = defineStore('auth', {
  state: () => {
    let savedAuthState = null;
    let savedCustomerList = null;
    let savedCachedUserId = null;

    try {
      const storedAuth = localStorage.getItem(AUTH_STATE_KEY);
      if (storedAuth) {
        savedAuthState = JSON.parse(storedAuth);
      }
      const storedCustomerList = localStorage.getItem(CUSTOMER_LIST_CACHE_KEY);
      if (storedCustomerList) {
        savedCustomerList = JSON.parse(storedCustomerList);
      }
      savedCachedUserId = localStorage.getItem(CACHED_USER_ID_KEY);

    } catch (e) {
      console.error("Errore nel caricamento dello stato di autenticazione o cache da localStorage:", e);
      localStorage.removeItem(AUTH_STATE_KEY);
      localStorage.removeItem(CUSTOMER_LIST_CACHE_KEY);
      localStorage.removeItem(CACHED_USER_ID_KEY);
    }

    return {
      isAuthenticated: savedAuthState ? savedAuthState.isAuthenticated : false,
      user: savedAuthState ? savedAuthState.user : null,
      token: savedAuthState ? savedAuthState.token : null, // Questo sarà il token JWT
      userCustomName: savedAuthState ? savedAuthState.userCustomName : null,
      nome: savedAuthState ? savedAuthState.nome : null,
      cognome: savedAuthState ? savedAuthState.cognome : null,
      dataScadenza: savedAuthState ? savedAuthState.dataScadenza : null,
      language: savedAuthState ? savedAuthState.language : null,
      //usename: savedAuthState ? savedAuthState.username : null,
      
      cachedCustomerList: savedCustomerList || [],
      cachedCustomerListUserId: savedCachedUserId || null,
    };
  },
  actions: {
    async login(apiResponseData) {
      // Determina l'ID utente dalla risposta API per la cache
      // Assumiamo che apiResponseData abbia un campo 'user_id' o 'username'
      const newLoggedInUserId = apiResponseData.user_id || apiResponseData.username || apiResponseData.customer_id; 

      // Se l'utente è cambiato, pulisci la cache dei clienti precedente
      if (this.cachedCustomerListUserId && this.cachedCustomerListUserId !== newLoggedInUserId) {
        console.log('Utente cambiato. Pulizia della cache clienti precedente.');
        this.clearCachedCustomerList();
      }

      this.isAuthenticated = true;
      this.user = apiResponseData; // Salva l'intero oggetto risposta API

      // --- MODIFICATO: Assegna il token dalla chiave corretta della risposta API ---
      // SOSTITUISCI 'apiResponseData.access_token' con la chiave reale del tuo token!
      this.token = apiResponseData.access_token || null; 
      // Esempio: se la chiave è 'jwt_token', usa apiResponseData.jwt_token
      // Esempio: se la chiave è 'token_string', usa apiResponseData.token_string
      // Se la chiave è 'token' (come avevi prima), allora il problema è altrove.
      // -------------------------------------------------------------------------

      this.userCustomName = apiResponseData.userCustomName || null;
      this.nome = apiResponseData.nome || null;
      this.cognome = apiResponseData.cognome || null;
      this.dataScadenza = apiResponseData.dataScadenza || null;
      this.cachedCustomerListUserId = newLoggedInUserId;
      this.language = apiResponseData.default_locale

      this.saveAuthStateToLocalStorage();
    },

    async logout() { 
      this.isAuthenticated = false;
      this.user = null;
      this.token = null;
      this.userCustomName = null;
      this.nome = null;
      this.cognome = null;
      this.dataScadenza = null;
      this.language = null;
      
      this.saveAuthStateToLocalStorage();
      this.clearCachedCustomerList();
    },

    saveAuthStateToLocalStorage() {
      try {
        const stateToSave = {
          isAuthenticated: this.isAuthenticated,
          user: this.user,
          token: this.token,
          userCustomName: this.userCustomName,
          nome: this.nome,
          cognome: this.cognome,
          dataScadenza: this.dataScadenza,
          language: this.language
        };
        localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(stateToSave));
      } catch (e) {
        console.error("Errore nel salvare lo stato di autenticazione in localStorage:", e);
      }
    },

    saveCustomerListToCache(customerList) {
      this.cachedCustomerList = customerList;
      try {
        localStorage.setItem(CUSTOMER_LIST_CACHE_KEY, JSON.stringify(customerList));
        localStorage.setItem(CACHED_USER_ID_KEY, this.cachedCustomerListUserId);
      } catch (e) {
        console.error("Errore nel salvare la lista clienti in cache:", e);
      }
    },

    loadCustomerListFromCache() {
      try {
        const stored = localStorage.getItem(CUSTOMER_LIST_CACHE_KEY);
        const storedUserId = localStorage.getItem(CACHED_USER_ID_KEY);
        if (stored && storedUserId === this.cachedCustomerListUserId) {
          this.cachedCustomerList = JSON.parse(stored);
          return this.cachedCustomerList;
        }
        return [];
      } catch (e) {
        console.error("Errore nel caricamento della lista clienti dalla cache:", e);
        this.clearCachedCustomerList();
        return [];
      }
    },

    clearCachedCustomerList() {
      this.cachedCustomerList = [];
      this.cachedCustomerListUserId = null;
      localStorage.removeItem(CUSTOMER_LIST_CACHE_KEY);
      localStorage.removeItem(CACHED_USER_ID_KEY);
    }
  }
});
// // src/stores/auth.js
// import { defineStore } from 'pinia';

// // Chiave per localStorage
// const AUTH_STATE_KEY = 'auth_state';

// export const useAuthStore = defineStore('auth', {
//   state: () => {
//     // Prova a caricare lo stato salvato da localStorage all'avvio
//     let savedState = null;
//     try {
//       const stored = localStorage.getItem(AUTH_STATE_KEY);
//       if (stored) {
//         savedState = JSON.parse(stored);
//       }
//     } catch (e) {
//       console.error("Errore nel caricamento dello stato di autenticazione da localStorage:", e);
//       localStorage.removeItem(AUTH_STATE_KEY); // Pulisci se corrotto
//     }

//     return {
//       isAuthenticated: savedState ? savedState.isAuthenticated : false,
//       user: savedState ? savedState.user : null, // Tutti i dati dell'utente dall'API
//       // Aggiungi qui le singole variabili che vuoi salvare
//       token: savedState ? savedState.user.access_token : null, // es. il token
//       userCustomName: savedState ? savedState.user.company_name : null, // es. nome cliente
//       nome: savedState ? savedState.user.nome : null,
//       cognome: savedState ? savedState.user.surname : null,
//       user_type_id: savedState ? savedState.user.user_type_id : null,
//       user_type_name: savedState ? savedState.user.user_type_name : null,
//       is_superuser: savedState ? savedState.user.is_superuser : null
//       // ... e così via per tutte le informazioni che ti servono
//     };
//   },
//   actions: {
//     // Azione per salvare i dati dopo il login riuscito
//     async login(apiResponseData) {
//       this.isAuthenticated = true;
//       this.user = apiResponseData; // Salva l'intero oggetto risposta API
//         console.log("risposta api:", apiResponseData);
//       // Salva le singole variabili dallo stato per comodità
//       this.token = apiResponseData.access_token || null;
//       this.userCustomName = apiResponseData.company_name || null;
//       this.nome = apiResponseData.name || null;
//       this.cognome = apiResponseData.surname || null;
//       this.user_type_id = apiResponseData.user_type_id || null;
//       this.user_type_name = apiResponseData.user_type_name || null;
//       this.is_superuser = apiResponseData.is_superuser || null;
//       // ... assegna qui tutte le altre variabili dall'apiResponseData

//       // Salva lo stato corrente in localStorage
//       this.saveStateToLocalStorage();
//     },

//     // Azione per effettuare il logout
//     async logout() {
//       this.isAuthenticated = false;
//       this.user = null;
//       this.token = null;
//       this.userCustomName = null;
//       this.nome = null;
//       this.cognome = null;
//       this.user_type_id = null;
//       this.user_type_name = null;
//       this.is_superuser = null;
//       // ... resetta qui tutte le altre variabili

//       // Rimuovi lo stato da localStorage
//       localStorage.removeItem(AUTH_STATE_KEY);
//     },

//     // Metodo interno per salvare lo stato in localStorage
//     saveStateToLocalStorage() {
//       try {
//         const stateToSave = {
//           isAuthenticated: this.isAuthenticated,
//           user: this.user,
//           token: this.token,
//           userCustomName: this.userCustomName,
//           nome: this.nome,
//           cognome: this.cognome,
//           user_type_id: this.user_type_id,
//           user_type_name: this.user_type_name,
//           is_superuser: this.is_superuser,
//           // ... includi qui tutte le variabili che vuoi persistere
//         };
//         localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(stateToSave));
//       } catch (e) {
//         console.error("Errore nel salvare lo stato di autenticazione in localStorage:", e);
//       }
//     }
//   }
// });