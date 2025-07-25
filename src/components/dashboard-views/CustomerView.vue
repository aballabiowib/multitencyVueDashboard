<!-- src/components/dashboard-views/CustomerView.vue -->
<template>
  <div class="customer-view-container">
    <!-- Sidebar Filtro/Ordinamento per Clienti -->
    <FilterableSidebar
      :items="customerList"
      item-key="customer_id"
      display-key="company_name"
      machine-count-key="total_machines"
      logo-key="logo_base64"
      logo-content-type-key="logo_content_type"
      :can-delete="true"
      label-singular="macchina"
      label-plural="macchine"
      @item-selected="handleCustomerSelected"
      @item-deleted="handleCustomerDeleted"
    />

    <!-- Contenuto Principale della Vista Clienti -->
    <div class="customer-main-content">
      <div class="customer-main-header">
        <h2>Dettagli Cliente</h2>
        <div class="header-actions">
          <!-- Pulsante "Aggiungi Nuovo Cliente" (visibile quando nessun cliente è selezionato) -->
          <button v-if="!selectedCustomer" @click="addNewCustomer" class="header-action-button add-new-button">
            Aggiungi Nuovo Cliente
          </button>
          <!-- Pulsante "Esci" (visibile quando un cliente è selezionato) -->
          <button v-else @click="exitCustomerDetails" class="header-action-button exit-button">
            Esci
          </button>
        </div>
      </div>

      <!-- Messaggio quando nessun cliente è selezionato -->
      <div v-if="!selectedCustomer && !isLoading && !error && customerList.length > 0" class="no-customer-selected">
        <p>Seleziona un cliente dalla barra laterale per visualizzarne i dettagli.</p>
      </div>

      <!-- Spinner di caricamento iniziale (solo se la lista è vuota) -->
      <div v-else-if="isLoading && customerList.length === 0" class="initial-loading-message">
        <p>Caricamento clienti...</p>
      </div>

      <!-- Messaggio di errore -->
      <div v-else-if="error" class="error-message">
        <p>Errore: {{ error }}</p>
      </div>

      <!-- Nessun cliente trovato dopo il caricamento -->
      <div v-else-if="customerList.length === 0 && !isLoading" class="no-results-message">
        <p>Nessun cliente trovato.</p>
      </div>
      
      <!-- Contenuto quando un cliente è selezionato -->
      <div v-else-if="selectedCustomer" class="selected-customer-details-layout">
        <!-- Sezione Sinistra: Dati del Cliente (input modificabili) -->
        <div class="customer-data-section">
          <h3>Dati Anagrafici e Contatto</h3>
          <div class="input-field-group">
            <label for="companyName">Azienda:</label>
            <input type="text" id="companyName" v-model="selectedCustomer.company_name">
          </div>
          <div class="input-field-group">
            <label for="userCustomName">Nome Personalizzato:</label>
            <input type="text" id="userCustomName" v-model="selectedCustomer.user_custom_name">
          </div>
          <div class="input-field-group">
            <label for="address">Indirizzo:</label>
            <input type="text" id="address" v-model="selectedCustomer.address">
          </div>
          <div class="input-field-group">
            <label for="fiscalData">Dati Fiscali:</label>
            <input type="text" id="fiscalData" v-model="selectedCustomer.fiscal_data">
          </div>
          <div class="input-field-group coordinates-group">
            <label>Coordinate:</label>
            <input type="text" id="latitude" v-model="selectedCustomer.latitude" placeholder="Latitudine">
            <input type="text" id="longitude" v-model="selectedCustomer.longitude" placeholder="Longitudine">
          </div>
          <div class="input-field-group">
            <label for="expiryDate">Scadenza Contratto:</label>
            <input type="date" id="expiryDate" v-model="selectedCustomer.expiry_date">
          </div>
          
          <button @click="saveCustomerChanges" class="save-button">Salva Modifiche</button>
        </div>

        <!-- Sezione Destra: Pulsanti Funzione -->
        <div class="customer-buttons-section">
          <h3>Funzioni Disponibili</h3>
          <div class="button-grid">
            <button class="action-button">Funzione 1</button>
            <button class="action-button">Funzione 2</button>
            <button class="action-button">Funzione 3</button>
            <button class="action-button">Funzione 4</button>
            <button class="action-button">Funzione 5</button>
            <button class="action-button">Funzione 6</button>
            <button class="action-button">Funzione 7</button>
            <button class="action-button">Funzione 8</button>
            <button class="action-button">Funzione 9</button>
            <button class="action-button">Funzione 10</button>
          </div>
        </div>
      </div>

      <!-- Pulsante "Carica Altri" -->
      <div v-if="hasMorePages && !isLoading" class="load-more-container">
        <button @click="loadMoreCustomers" class="load-more-button">Carica Altri</button>
      </div>
      <div v-if="isLoading && customerList.length > 0" class="loading-indicator">
        Caricamento aggiuntivo...
      </div>
    </div>

    <!-- Spinner di caricamento in overlay (solo se la lista è vuota) -->
    <div v-if="isLoading && customerList.length === 0" class="loading-overlay">
      <div class="spinner-container">
        <h3 class="loading-title">Attendere!</h3>
        <div class="spinner"></div>
        <p>Caricamento in corso...</p>
      </div>
    </div>
  </div>
</template>

<script>
import FilterableSidebar from '@/components/FilterableSidebar.vue';
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

export default {
  name: 'CustomerView',
  components: {
    FilterableSidebar
  },
  setup() {
    const customerList = ref([]);
    const selectedCustomer = ref(null);
    const isLoading = ref(true); // Indica il caricamento dalla rete
    const error = ref(null);

    const currentPage = ref(1);
    const initialPageSize = 40;
    const subsequentPageSize = 20;
    const totalItems = ref(0);

    const authStore = useAuthStore();
    const router = useRouter();

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
        const leewayMs = 5 * 60 * 1000;

        console.log('--- Verifica Scadenza Token ---');
        console.log('Token Expiration Date (stringa):', expirationDateString);
        console.log('Token Expiration Time (ms):', expirationTime.getTime(), `(${expirationTime.toISOString()})`);
        console.log('Current Time (ms):', currentTimeMs, `(${new Date(currentTimeMs).toISOString()})`);
        console.log('Leeway (ms):', leewayMs);
        console.log('Token scaduto (senza leeway)?', expirationTime.getTime() < currentTimeMs);
        console.log('Token scaduto (con leeway)?', expirationTime.getTime() < (currentTimeMs - leewayMs));
        console.log('-----------------------------');

        if (expirationTime.getTime() < (currentTimeMs - leewayMs)) {
          console.warn('Il token JWT è scaduto (o sta per scadere, con tolleranza).');
          return true;
        }
        console.log('Il token JWT è valido.');
        return false;
      } catch (e) {
        console.error('isTokenExpired: Errore durante la decodifica o la verifica del token JWT:', e);
        return true;
      }
    };

    const hasMorePages = computed(() => {
      if (totalItems.value === 0 && customerList.value.length === 0) return false;
      return customerList.value.length < totalItems.value;
    });

    // Funzione per recuperare i dati dei clienti dall'API
    // `backgroundFetch` indica se la chiamata è per un aggiornamento in background
    const fetchCustomers = async (pageToLoad = 1, sizeToLoad = initialPageSize, append = false, backgroundFetch = false) => {
      // Imposta isLoading a true solo se non è un fetch in background E la lista è vuota (mostra overlay)
      // O se è un append (mostra indicatore "Caricamento aggiuntivo...")
      if (!backgroundFetch && customerList.value.length === 0) {
        isLoading.value = true;
      } else if (append) {
        isLoading.value = true; // Per mostrare l'indicatore di caricamento aggiuntivo
      }
      error.value = null;

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        error.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        isLoading.value = false;
        console.error('Errore: Tentativo di recuperare clienti con token mancante o scaduto.');
        
        await authStore.logout();
        router.push('/');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        'Sidebar': '1',
        "Customerid": "0",
        "Language": authStore.selectedLanguage || 'en-EN',
      };

      if (authStore.user && authStore.user.is_superuser === true) {
        headers['Customer'] = '';
      } else if (authStore.user && authStore.user.company_name) {
        headers['Customer'] = authStore.user.company_name;
      } else {
        console.warn('user.is_superuser o user.company_name non disponibili per l\'header Customer.');
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('order_by', 'company_name');
      queryParams.append('order_dir', 'asc');
      queryParams.append('page', pageToLoad.toString());
      queryParams.append('page_size', sizeToLoad.toString());

      let apiUrl = 'http://localhost:8000/api/customer';

      if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
      }

      console.log('Headers inviati alla API /api/customer:', headers);
      console.log('URL finale della richiesta:', apiUrl);

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
        });

        if (response.ok) {
          const rawData = await response.json();
          console.log('Dati API clienti ricevuti:', rawData);
          if (rawData.data && rawData.data.items && rawData.data.items.length > 0) {
            console.log('Primo item API (per ispezionare logo):', rawData.data.items[0]);
          }

          const itemsToMap = rawData.data && rawData.data.items ? rawData.data.items : [];
          totalItems.value = rawData.data && rawData.data.total_items ? rawData.data.total_items : itemsToMap.length;

          const mappedCustomers = itemsToMap.map(item => {
            const logoBase64 = item.logo_base64 || null;
            let logoContentType = item.logo_content || null;
            
            if (logoContentType === 'logo/png') {
              logoContentType = 'image/png';
              console.warn('MIME type "logo/png" corretto in "image/png".');
            } else if (logoContentType === 'logo/jpeg' || logoContentType === 'logo/jpg') {
              logoContentType = 'image/jpeg';
              console.warn('MIME type "logo/jpeg" corretto in "image/jpeg".');
            }

            console.log(`Mappatura Logo per ${item.company_name}:`);
            console.log(`  logo_base64 (diretto da item):`, logoBase64 ? logoBase64.substring(0, 30) + '...' : 'null/undefined');
            console.log(`  logo_content_type (diretto da item, dopo correzione):`, logoContentType);

            return {
              customer_id: item.customer_id,
              company_name: item.company_name,
              total_machines: item.total_machines || 0,
              logo_base64: logoBase64,
              logo_content_type: logoContentType,
              user_custom_name: item.user_custom_name || 'N/A',
              expiry_date: item.expiry_date || 'N/A',
              address: item.address || 'N/A',
              fiscal_data: item.fiscal_data || 'N/A',
              latitude: item.latitude || 'N/A',
              longitude: item.longitude || 'N/A',
            };
          });
          
          if (append) {
            customerList.value = [...customerList.value, ...mappedCustomers];
          } else {
            customerList.value = mappedCustomers;
          }

          // Salva la lista clienti nella cache dello store dopo un fetch riuscito
          authStore.saveCustomerListToCache(customerList.value);

        } else {
          const errorText = await response.text();
          console.error('Errore nel recupero clienti (risposta non ok):', response.status, errorText);
          error.value = `Errore nel caricamento dei clienti: ${response.status} - ${errorText}`;
          if (response.status === 401 || response.status === 403) {
            await authStore.logout();
            router.push('/');
          }
        }
      } catch (err) {
        console.error('Errore di rete o del server (catch):', err);
        error.value = 'Impossibile connettersi al server per i dati dei clienti. Controlla che il backend sia attivo e le configurazioni CORS.';
      } finally {
        // Imposta isLoading a false solo dopo che la richiesta è completata
        isLoading.value = false;
      }
    };

    const loadMoreCustomers = () => {
      if (!isLoading.value && hasMorePages.value) {
        // isLoading viene impostato a true all'inizio di fetchCustomers quando append è true
        currentPage.value++;
        fetchCustomers(currentPage.value, subsequentPageSize, true); 
      }
    };

    onMounted(() => {
      // Determina l'ID utente corrente per la logica della cache
      const currentUserId = authStore.user ? (authStore.user.user_id || authStore.user.username || authStore.user.customer_id) : null;

      // Se l'utente è autenticato E la cache esiste per questo utente
      if (authStore.isAuthenticated && authStore.cachedCustomerListUserId === currentUserId && authStore.cachedCustomerList.length > 0) {
        customerList.value = authStore.cachedCustomerList; // Carica IMMEDIATAMENTE dalla cache
        console.log('Clienti caricati dalla cache (istantaneo):', customerList.value.length);
        isLoading.value = false; // Lo spinner dell'overlay scompare subito
        
        // Avvia il fetch in background per aggiornare i dati
        // Imposta isLoading a true per mostrare l'indicatore "Caricamento aggiuntivo..."
        // ma non l'overlay principale
        fetchCustomers(1, initialPageSize, false, true); // `true` per `backgroundFetch`
      } else if (authStore.isAuthenticated) {
        // Se non c'è cache o utente cambiato, carica normalmente dall'API (mostra overlay)
        fetchCustomers(currentPage.value, initialPageSize, false); 
      } else {
        // Se non autenticato, attendi l'autenticazione
        const unwatch = authStore.$subscribe((mutation, state) => {
          if (state.isAuthenticated) {
            const authenticatedUserId = state.user ? (state.user.user_id || state.user.username || state.user.customer_id) : null;
            if (state.cachedCustomerListUserId === authenticatedUserId && state.cachedCustomerList.length > 0) {
              customerList.value = state.cachedCustomerList;
              console.log('Clienti caricati dalla cache dopo autenticazione (istantaneo):', customerList.value.length);
              isLoading.value = false; // Lo spinner dell'overlay scompare subito
              fetchCustomers(1, initialPageSize, false, true); // Fetch in background
            } else {
              fetchCustomers(currentPage.value, initialPageSize, false);
            }
            unwatch();
          }
        });
      }
    });

    // Gestisce la selezione di un cliente dalla sidebar
    const handleCustomerSelected = (item) => {
      selectedCustomer.value = JSON.parse(JSON.stringify(item));
      console.log('Cliente selezionato per modifica:', selectedCustomer.value);
    };

    // Salva le modifiche al cliente (chiamata API PUT/PATCH)
    const saveCustomerChanges = async () => {
      if (!selectedCustomer.value) return;

      console.log('Salvataggio modifiche per cliente:', selectedCustomer.value);
      alert('Logica di salvataggio non implementata. Modifiche simulate salvate!');
      const index = customerList.value.findIndex(c => c.customer_id === selectedCustomer.value.customer_id);
      if (index !== -1) {
        customerList.value[index] = { ...selectedCustomer.value };
        // Aggiorna la cache anche dopo il salvataggio di un singolo elemento
        authStore.saveCustomerListToCache(customerList.value);
      }
    };

    // Aggiunge un nuovo cliente (per ora, simula l'apertura di un form vuoto)
    const addNewCustomer = () => {
      console.log('Aggiungi nuovo cliente cliccato.');
      selectedCustomer.value = { // Oggetto vuoto per un nuovo cliente
        customer_id: null, // O un ID temporaneo
        company_name: '',
        user_custom_name: '',
        address: '',
        fiscal_data: '',
        latitude: '',
        longitude: '',
        expiry_date: '',
        total_machines: 0,
        logo_base64: null,
        logo_content_type: null,
      };
      alert('Logica per aggiungere un nuovo cliente non implementata. Form vuoto caricato.');
    };

    // Esci dalla visualizzazione dettagliata del cliente
    const exitCustomerDetails = () => {
      selectedCustomer.value = null;
      console.log('Uscito dalla visualizzazione dettagliata del cliente.');
    };

    const handleCustomerDeleted = (itemId) => {
      console.log('Richiesta di eliminazione cliente con ID:', itemId);
      customerList.value = customerList.value.filter(cust => cust.customer_id !== itemId);
      if (selectedCustomer.value && selectedCustomer.value.customer_id === itemId) {
        selectedCustomer.value = null;
      }
      totalItems.value--;
      // Aggiorna la cache anche dopo l'eliminazione
      authStore.saveCustomerListToCache(customerList.value);
    };

    return {
      customerList,
      selectedCustomer,
      isLoading,
      error,
      hasMorePages,
      handleCustomerSelected,
      handleCustomerDeleted,
      loadMoreCustomers,
      saveCustomerChanges,
      addNewCustomer,
      exitCustomerDetails
    };
  }
};
</script>

<style scoped>
.customer-view-container {
  display: flex;
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.filterable-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.customer-main-content {
  flex-grow: 1;
  padding: 30px;
  overflow-y: auto;
  background-color: #f8f9fa;
}

.customer-main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.customer-main-header h2 {
  margin: 0;
  color: #007bff;
  font-size: 2em;
}

.header-action-button {
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
  white-space: nowrap;
}

.add-new-button {
  background-color: #28a745;
  color: white;
  border: 1px solid #28a745;
}

.add-new-button:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

.exit-button {
  background-color: #6c757d;
  color: white;
  border: 1px solid #6c757d;
}

.exit-button:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
}

.no-customer-selected {
  text-align: center;
  padding: 50px;
  background-color: #e0f0ff;
  border-radius: 8px;
  border: 2px dashed #007bff;
  color: #0056b3;
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 50px;
}

.initial-loading-message,
.no-results-message {
  text-align: center;
  padding: 50px;
  color: #666;
  font-size: 1.1em;
}

.error-message {
  color: #dc3545;
  font-weight: bold;
  text-align: center;
  padding: 50px;
  background-color: #ffe0e0;
  border-radius: 8px;
  border: 1px solid #dc3545;
}

.selected-customer-details-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.customer-data-section,
.customer-buttons-section {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.customer-data-section h3,
.customer-buttons-section h3 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5em;
}

.input-field-group {
  margin-bottom: 15px;
}

.input-field-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #555;
}

.input-field-group input[type="text"],
.input-field-group input[type="date"] {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-field-group input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.2);
}

.coordinates-group input {
  width: calc(50% - 16px);
  display: inline-block;
  margin-right: 10px;
}
.coordinates-group input:last-child {
  margin-right: 0;
}

.save-button {
  background-color: #007bff;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  width: 100%;
  margin-top: 20px;
  font-weight: bold;
}

.save-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.customer-data-section p {
  margin-bottom: 10px;
  line-height: 1.5;
}

.customer-data-section strong {
  color: #333;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.action-button {
  background-color: #28a745;
  color: white;
  padding: 12px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
  white-space: nowrap;
}

.action-button:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

.load-more-container {
  text-align: center;
  margin-top: 20px;
}

.load-more-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.load-more-button:hover {
  background-color: #0056b3;
}

.loading-indicator {
  text-align: center;
  margin-top: 10px;
  color: #888;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner-container {
  background-color: #fff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.loading-title {
  font-size: 1.8em;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .selected-customer-details-layout {
    grid-template-columns: 1fr;
  }
}
</style>