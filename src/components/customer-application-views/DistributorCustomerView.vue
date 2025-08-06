<template>
  <div class="distributor-customer-overlay">
    <div class="distributor-customer-container">
      <div class="header">
        <h2>Clienti dei distributori</h2>
        <button @click="closeView" class="close-button">X</button>
      </div>

      <div v-if="isLoading" class="loading-message">
        <div class="spinner"></div>
        <p>Caricamento dati...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>Errore: {{ error }}</p>
      </div>

      <div v-else class="three-column-layout">
        <!-- Colonna 1: Clienti Distributori (customer_of == 0) -->
        <div class="list-column">
          <h3>Distributori</h3>
          <ul v-if="distributors.length > 0" class="customer-list">
            <li 
              v-for="customer in distributors" 
              :key="customer.customer_id" 
              :class="{ 'selected': selectedDistributor && selectedDistributor.customer_id === customer.customer_id }"
              @click="selectDistributor(customer)"
            >
              {{ customer.company_name }} (ID: {{ customer.customer_id }})
            </li>
          </ul>
          <p v-else class="no-results-text">Nessun distributore trovato.</p>
        </div>

        <!-- Colonna 2: Clienti del Distributore Selezionato (customer_of == selected_distributor_id) -->
        <div class="list-column">
          <h3>Clienti del Distributore</h3>
          <p v-if="!selectedDistributor" class="no-selection-text">Seleziona un distributore per visualizzarne i clienti.</p>
          <ul v-else-if="distributorCustomers.length > 0" class="customer-list">
            <li v-for="customer in distributorCustomers" :key="customer.customer_id">
              {{ customer.company_name }} (ID: {{ customer.customer_id }})
            </li>
          </ul>
          <p v-else class="no-results-text">Nessun cliente trovato per questo distributore.</p>
        </div>

        <!-- Colonna 3: Tutti i Clienti Disponibili nel Sistema (filtrati) -->
        <div class="list-column">
          <h3>Clienti Disponibili</h3>
          <ul v-if="allCustomers.length > 0" class="customer-list"> <!-- MODIFICATO QUI: da filteredAllCustomers a allCustomers -->
            <li v-for="customer in allCustomers" :key="customer.customer_id"> <!-- MODIFICATO QUI: da filteredAllCustomers a allCustomers -->
              {{ customer.company_name }} (ID: {{ customer.customer_id }})
            </li>
          </ul>
          <p v-else class="no-results-text">Nessun cliente disponibile nel sistema.</p>
        </div>
      </div>

      <!-- Pulsante di chiusura in basso a destra -->
      <div class="footer-close-button-container">
        <button @click="closeView" class="action-button footer-close-button">Chiudi</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

export default {
  name: 'DistributorCustomerView',
  emits: ['close'],
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const router = useRouter();

    const distributors = ref([]);
    const selectedDistributor = ref(null);
    const distributorCustomers = ref([]);
    const allCustomers = ref([]); // Questa ref conterrà TUTTI i clienti inizialmente
    
    const isLoading = ref(true);
    const error = ref(null);

    // Proprietà calcolata per filtrare 'allCustomers'
    const filteredAllCustomers = computed(() => {
      if (distributorCustomers.value.length === 0) {
        return allCustomers.value; // Se non ci sono clienti del distributore, mostra tutti
      }
      // Crea un Set di ID dei clienti del distributore per una ricerca efficiente
      const distributorCustomerIds = new Set(distributorCustomers.value.map(c => c.customer_id));
      
      // Filtra l'elenco di tutti i clienti, rimuovendo quelli già assegnati al distributore
      return allCustomers.value.filter(customer => !distributorCustomerIds.has(customer.customer_id));
    });

    // Funzione per verificare la scadenza del token JWT
    const isTokenExpired = (token) => {
      if (!token) {
        console.warn('isTokenExpired: Token non presente.');
        return true;
      }

      try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) {
          console.warn('isTokenExpired: Payload del token mancante o non valido.');
          return true;
        }

        const decodedPayload = JSON.parse(atob(payloadBase64));

        const expirationDateString = decodedPayload.expiration_date;
        if (!expirationDateString) {
          console.warn('isTokenExpired: Campo "expiration_date" non trovato nel payload del token.');
          return true;
        }

        const expirationTime = new Date(expirationDateString);
        
        if (isNaN(expirationTime.getTime())) {
            console.error('isTokenExpired: Impossibile parsare la data di scadenza:', expirationDateString);
            return true;
        }

        const currentTimeMs = Date.now();
        const leewayMs = 5 * 60 * 1000; // 5 minuti di tolleranza

        if (expirationTime.getTime() < (currentTimeMs - leewayMs)) {
          console.warn('Il token JWT è scaduto (o sta per scadere, con tolleranza).');
          return true;
        }
        return false;
      } catch (e) {
        console.error('isTokenExpired: Errore durante la decodifica o la verifica del token JWT:', e);
        return true;
      }
    };

    // Funzione generica per il fetching dei clienti
    const fetchCustomers = async (filterObj = {}, targetListRef) => {
      // DEBUG: Log dell'oggetto filtro ricevuto
      console.log(`DEBUG: fetchCustomers chiamata con filterObj:`, filterObj);

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        error.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        isLoading.value = false;
        await authStore.logout();
        router.push('/');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        'Distributor': '1', // Per ottenere tutti i dati senza paginazione lato server forzata
        'Language': authStore.selectedLanguage || 'en-EN',
      };

      if (authStore.user && authStore.user.is_superuser) {
        headers['Customer'] = ''; 
      } else if (authStore.user && authStore.user.company_name) {
        headers['Customer'] = authStore.user.company_name;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('order_by', 'company_name');
      queryParams.append('order_dir', 'asc');

      if (Object.keys(filterObj).length > 0) {
        queryParams.append('filter', JSON.stringify(filterObj));
      }

      let apiUrl = `http://localhost:8000/api/customer?${queryParams.toString()}`;

      console.log(`DEBUG: Fetching from: ${apiUrl} with filter: ${JSON.stringify(filterObj)}`);

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
        });

        if (response.ok) {
          const rawData = await response.json();
          // DEBUG: Log dei dati grezzi ricevuti
          console.log(`DEBUG: Dati API ricevuti per filter ${JSON.stringify(filterObj)}:`, rawData);

          const items = rawData.data && rawData.data.items ? rawData.data.items : [];
          targetListRef.value = items.map(item => ({
            customer_id: item.customer_id,
            company_name: item.company_name,
            customer_of: item.customer_of,
          }));
          // DEBUG: Log della lista popolata
          console.log(`DEBUG: targetListRef (${targetListRef.value === distributors ? 'distributors' : targetListRef.value === allCustomers ? 'allCustomers' : 'distributorCustomers'}) popolata con:`, targetListRef.value);

        } else {
          const errorText = await response.text();
          console.error(`Errore nel recupero dati (${JSON.stringify(filterObj)}):`, response.status, errorText);
          error.value = `Errore nel caricamento dei dati: ${response.status} - ${errorText}`;
          if (response.status === 401 || response.status === 403) {
            await authStore.logout();
            router.push('/');
          }
        }
      } catch (err) {
        console.error(`Errore di rete o del server (${JSON.stringify(filterObj)}):`, err);
        error.value = `Impossibile connettersi al server per i dati: ${err.message}.`;
      }
    };

    // Funzione per selezionare un distributore
    const selectDistributor = async (customer) => {
      selectedDistributor.value = customer;
      // Quando un distributore è selezionato, carica i suoi clienti
      await fetchCustomers({ customer_of: customer.customer_id }, distributorCustomers);
      // DEBUG: Log di filteredAllCustomers dopo la selezione del distributore
      console.log('DEBUG: filteredAllCustomers dopo selezione distributore:', filteredAllCustomers.value);
    };

    // Funzione per chiudere la vista
    const closeView = () => {
      emit('close');
    };

    onMounted(async () => {
      if (!authStore.isAuthenticated || !authStore.user || !authStore.user.is_superuser) {
        error.value = 'Accesso negato. Questa funzione è disponibile solo per i superuser.';
        isLoading.value = false;
        await authStore.logout();
        router.push('/');
        return;
      }

      isLoading.value = true;
      error.value = null;

      // Carica i distributori (customer_of == 0)
      await fetchCustomers({ customer_of: 0 }, distributors);
      
      // Carica TUTTI i clienti disponibili nel sistema (senza filtro customer_of)
      // allCustomers.value verrà popolato con tutti i clienti
      await fetchCustomers({}, allCustomers);

      // DEBUG: Log di allCustomers e distributors dopo il caricamento iniziale
      console.log('DEBUG: allCustomers dopo caricamento iniziale:', allCustomers.value);
      console.log('DEBUG: distributors dopo caricamento iniziale:', distributors.value);


      isLoading.value = false;
    });

    return {
      distributors,
      selectedDistributor,
      distributorCustomers,
      allCustomers: filteredAllCustomers, // Espone la proprietà calcolata al posto della ref originale
      isLoading,
      error,
      selectDistributor,
      closeView,
    };
  },
};
</script>

<style scoped>
.distributor-customer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: 'Inter', sans-serif;
}

.distributor-customer-container {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 95%; /* Larghezza richiesta */
  height: 90%; /* Altezza richiesta */
  max-width: 1700px; /* Max larghezza richiesta */
  max-height: 95%; /* Max altezza per adattarsi allo schermo */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Nasconde il contenuto extra */
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  flex-shrink: 0; /* Impedisce all'header di restringersi */
}

.header h2 {
  margin: 0;
  color: #007bff;
  font-size: 1.8em;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.8em;
  color: #6c757d;
  cursor: pointer;
  transition: color 0.2s ease;
}
.close-button:hover {
  color: #dc3545;
}

.loading-message,
.error-message {
  text-align: center;
  padding: 50px;
  font-size: 1.1em;
  color: #555;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #dc3545;
  font-weight: bold;
}

.three-column-layout {
  display: flex; /* Usa flexbox per allineare le colonne */
  flex-grow: 1; /* Permette al layout di occupare lo spazio rimanente */
  padding: 20px;
  gap: 15px; /* Spazio tra le colonne */
  overflow: hidden; /* Nasconde lo scrollbar principale del container */
}

.list-column {
  flex: 1; /* Ogni colonna occupa uguale spazio */
  min-width: 0; /* Permette il restringimento del contenuto */
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  overflow: hidden; /* Nasconde lo scrollbar della colonna */
}

.list-column h3 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.4em;
  text-align: center;
  flex-shrink: 0; /* Impedisce al titolo di restringersi */
}

.customer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1; /* Permette alla lista di riempire lo spazio */
  overflow-y: auto; /* Abilita lo scroll per la lista */
}

.customer-list li {
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.95em;
  color: #333;
}

.customer-list li:last-child {
  border-bottom: none;
}

.customer-list li:hover {
  background-color: #e9f5ff;
}

.customer-list li.selected {
  background-color: #007bff;
  color: white;
  font-weight: bold;
}

.no-results-text,
.no-selection-text {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-close-button-container {
  display: flex;
  justify-content: flex-end; /* Allinea a destra */
  padding: 15px 30px;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  border-radius: 0 0 10px 10px;
  flex-shrink: 0; /* Impedisce al footer di restringersi */
}

.footer-close-button {
  background-color: #6c757d;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.footer-close-button:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
}

/* Media Queries per la responsività */
@media (max-width: 1200px) {
  .three-column-layout {
    flex-direction: column; /* Impila le colonne su schermi più piccoli */
    overflow-y: auto; /* Abilita lo scroll per l'intero layout su schermi piccoli */
  }
  .list-column {
    margin-bottom: 15px; /* Spazio tra le colonne impilate */
    flex: none; /* Rimuovi la flessibilità per permettere al contenuto di definire l'altezza */
    height: auto; /* L'altezza si adatta al contenuto */
    max-height: 400px; /* Limita l'altezza per evitare colonne troppo lunghe */
  }
  .list-column:last-child {
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .distributor-customer-container {
    width: 98%;
    height: 95%;
  }
  .header {
    flex-direction: column;
    align-items: flex-start;
    padding: 15px 20px;
  }
  .header h2 {
    font-size: 1.5em;
    margin-bottom: 10px;
  }
  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  .footer-close-button-container {
    justify-content: center;
    padding: 15px 20px;
  }
}
</style>