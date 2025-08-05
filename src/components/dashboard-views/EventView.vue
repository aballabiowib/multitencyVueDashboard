<!-- src/components/dashboard-views/EventView.vue -->
<template>
  <div class="customer-view-container">
    <!-- Sidebar Filtro/Ordinamento per Clienti -->
    <FilterableSidebar
      :items="customerList"
      item-key="customer_id"
      display-key="company_name"
      machine-count-key="total_machines"
      logo-key="logo_url"
      :can-delete="false" 
      label-singular="cliente"
      label-plural="clienti"
      @item-selected="handleCustomerSelectedForEvent" 
      @item-deleted="handleCustomerDeletedForEvent" 
    />

    <!-- Contenuto Principale della Vista Eventi -->
    <div class="customer-main-content">
      <div class="customer-main-header">
        <h2>Gestione Eventi</h2>
        <div class="header-actions">
          <!-- Il pulsante "Nuovo Evento" NON è presente qui come richiesto -->
          <!-- Pulsante "Esci" (visibile quando un cliente è selezionato) -->
          <button v-if="selectedCustomerForEventView" @click="exitCustomerDetailsForEvent" class="header-action-button exit-button">
            Esci
          </button>
        </div>
      </div>

      <!-- Messaggio quando nessun cliente è selezionato -->
      <div v-if="!selectedCustomerForEventView && !isLoading && !error && customerList.length > 0" class="no-customer-selected">
        <p>Seleziona un cliente dalla barra laterale per visualizzare e gestire i suoi eventi.</p>
      </div>
      <!-- Spinner di caricamento iniziale -->
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
      
      <!-- Contenuto quando un cliente è selezionato (per visualizzare i suoi eventi) -->
      <div v-else-if="selectedCustomerForEventView" class="selected-customer-details-layout">
        <!-- Sezione Sinistra: Dettagli del Cliente Selezionato -->
        <div class="customer-data-section">
          <h3>Eventi per {{ selectedCustomerForEventView.company_name }}</h3>
          <p>Qui verranno visualizzati gli eventi specifici per il cliente selezionato.</p>
          <!-- Qui potresti aggiungere un'altra FilterableSidebar per gli eventi di questo cliente -->
          <!-- O una tabella di eventi -->
          <p>ID Cliente: {{ selectedCustomerForEventView.customer_id }}</p>
          <p>Macchine totali: {{ selectedCustomerForEventView.total_machines }}</p>
          <!-- Dati aggiuntivi del cliente selezionato -->
        </div>

        <!-- Sezione Destra: Pulsanti Funzione Evento (generici o specifici per il cliente) -->
        <div class="customer-buttons-section">
          <h3>Azioni Eventi</h3>
          <div class="button-grid">
            <button class="action-button">Visualizza Eventi Attivi</button>
            <button class="action-button">Visualizza Storico Eventi</button>
            <button class="action-button">Esporta Eventi</button>
            <!-- Altri pulsanti specifici per gli eventi -->
          </div>
        </div>
      </div>

      <div v-if="hasMorePages && !isLoading" class="load-more-container">
        <button @click="loadMoreCustomers" class="load-more-button">Carica Altri</button>
      </div>
      <div v-if="isLoading && customerList.length > 0" class="loading-indicator">
        Caricamento aggiuntivo...
      </div>
    </div>

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
  name: 'EventView',
  components: {
    FilterableSidebar
  },
  setup() {
    const customerList = ref([]); // Questa lista conterrà i CLIENTI
    const selectedCustomerForEventView = ref(null); // Rappresenterà il CLIENTE selezionato
    const isLoading = ref(true);
    const error = ref(null);

    const currentPage = ref(1);
    const initialPageSize = 40;
    const subsequentPageSize = 20;
    const totalItems = ref(0);

    const authStore = useAuthStore();
    const router = useRouter();

    const isTokenExpired = (token) => {
      if (!token) { console.warn('isTokenExpired: Token non presente.'); return true; }
      try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) { console.warn('isTokenExpired: Payload del token mancante o non valido.'); return true; }
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const expirationDateString = decodedPayload.expiration_date;
        if (!expirationDateString) { console.warn('isTokenExpired: Campo "expiration_date" non trovato nel payload del token.'); return true; }
        const expirationTime = new Date(expirationDateString);
        if (isNaN(expirationTime.getTime())) { console.error('isTokenExpired: Impossibile parsare la data di scadenza:', expirationDateString); return true; }
        const currentTimeMs = Date.now();
        const leewayMs = 5 * 60 * 1000;
        if (expirationTime.getTime() < (currentTimeMs - leewayMs)) { console.warn('Il token JWT è scaduto (o sta per scadere, con tolleranza).'); return true; }
        return false;
      } catch (e) { console.error('isTokenExpired: Errore durante la decodifica o la verifica del token JWT:', e); return true; }
    };

    const hasMorePages = computed(() => {
      if (totalItems.value === 0 && customerList.value.length === 0) return false;
      return customerList.value.length < totalItems.value;
    });

    const fetchCustomers = async (pageToLoad = 1, sizeToLoad = initialPageSize, append = false, backgroundFetch = false) => {
      if (!backgroundFetch && customerList.value.length === 0) { isLoading.value = true; } else if (append) { isLoading.value = true; }
      error.value = null;

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
        'Sidebar': '1',
        "Customerid": "0", // Potrebbe essere l'ID del cliente per cui si cercano gli allarmi
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
      queryParams.append('order_by', 'company_name'); // Ordina per nome azienda cliente
      queryParams.append('order_dir', 'asc');    
      queryParams.append('page', pageToLoad.toString());
      queryParams.append('page_size', sizeToLoad.toString());

      // CAMBIA QUESTO URL API per i CLIENTI, non per gli allarmi!
      let apiUrl = 'http://localhost:8000/api/customer'; // Deve puntare all'API dei clienti

      if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
      }

      console.log('Headers inviati alla API /api/customer (per EventView sidebar):', headers);
      console.log('URL finale della richiesta (per EventView sidebar):', apiUrl);

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
        });

        if (response.ok) {
          const rawData = await response.json();

          const itemsToMap = rawData.data && rawData.data.items ? rawData.data.items : [];
          totalItems.value = rawData.data && rawData.data.total_items ? rawData.data.total_items : itemsToMap.length;

          const mappedCustomers = itemsToMap.map(item => {
            // Non mappiamo più logo_base64 e logo_content_type qui
            // Mappiamo logo_url che viene dal serializzatore backend
            const logoUrl = item.logo_url || null; 

            return {
              customer_id: item.customer_id,
              company_name: item.company_name,
              total_machines: item.total_machines || 0,
              logo_url: logoUrl, // MODIFICATO QUI: usa logo_url
              address: item.address || 'N/A',
              fiscal_data: item.fiscal_data || 'N/A',
              latitude: item.latitude || 'N/A', 
              longitude: item.longitude || 'N/A', 
              email: item.email || 'N/A',
              vat_number: item.vat_number || 'N/A',
              fiscal_code: item.fiscal_code || 'N/A',
              address_latitude: item.address_latitude || '',
              address_longitude: item.address_longitude || '',
              logo_name: item.logo_name || null, // logo_name potrebbe ancora essere utile per l'upload
            };
          });
          
          if (append) {
            customerList.value = [...customerList.value, ...mappedCustomers];
          } else {
            customerList.value = mappedCustomers;
          }

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
        isLoading.value = false;
      }
    };

    onMounted(() => {
      const currentUserId = authStore.user ? (authStore.user.user_id || authStore.user.username || authStore.user.customer_id) : null;
      if (authStore.isAuthenticated && authStore.cachedCustomerListUserId === currentUserId && authStore.cachedCustomerList.length > 0) {
        customerList.value = authStore.cachedCustomerList; isLoading.value = false; fetchCustomers(1, initialPageSize, false, true);
      } else if (authStore.isAuthenticated) { fetchCustomers(currentPage.value, initialPageSize, false); } else {
        const unwatch = authStore.$subscribe((mutation, state) => {
          if (state.isAuthenticated) {
            const authenticatedUserId = state.user ? (state.user.user_id || state.user.username || state.user.customer_id) : null;
            if (state.cachedCustomerListUserId === authenticatedUserId && state.cachedCustomerList.length > 0) {
              customerList.value = state.cachedCustomerList; isLoading.value = false; fetchCustomers(1, initialPageSize, false, true);
            } else { fetchCustomers(currentPage.value, initialPageSize, false); }
            unwatch();
          }
        });
      }
    });

    const loadMoreCustomers = () => {
      if (!isLoading.value && hasMorePages.value) {
        isLoading.value = true; 
        currentPage.value++;
        fetchCustomers(currentPage.value, subsequentPageSize, true); 
      }
    };
    const handleCustomerSelectedForEvent = (item) => { // Rinominato per chiarezza
      selectedCustomerForEventView.value = JSON.parse(JSON.stringify(item));
      console.log('Cliente selezionato per visualizzare eventi:', selectedCustomerForEventView.value);
      // Qui potresti voler fare una nuova chiamata API per caricare gli eventi specifici di questo cliente
      // Es: fetchEventsForCustomer(selectedCustomerForEventView.value.customer_id);
    };
    const saveEventChanges = async () => { // Rinominato per chiarezza
      if (!selectedCustomerForEventView.value) return;
      console.log('Salvataggio modifiche per evento (simulato):', selectedCustomerForEventView.value);
      alert('Logica di salvataggio evento non implementata.');
      // Qui salveresti un evento specifico, non un cliente
    };
    // Rimozione del metodo addNewEvent come richiesto
    // const addNewEvent = () => { /* ... */ };
    const exitCustomerDetailsForEvent = () => { selectedCustomerForEventView.value = null; }; // Rinominato per chiarezza
    const handleCustomerDeletedForEvent = (itemId) => { // Rinominato per chiarezza
      console.log('Richiesta di eliminazione cliente (non evento) con ID:', itemId);
      // Questa logica elimina il cliente dalla lista, non un evento specifico
      customerList.value = customerList.value.filter(cust => cust.customer_id !== itemId);
      if (selectedCustomerForEventView.value && selectedCustomerForEventView.value.customer_id === itemId) {
        selectedCustomerForEventView.value = null;
      }
      totalItems.value--;
      authStore.saveCustomerListToCache(customerList.value);
    };

    return {
      customerList, selectedCustomerForEventView, isLoading, error, hasMorePages,
      handleCustomerSelectedForEvent, handleCustomerDeletedForEvent, loadMoreCustomers,
      saveEventChanges, exitCustomerDetailsForEvent // addNewEvent rimosso
    };
  }
};
</script>

<style scoped>
/* Copia e incolla qui TUTTI gli stili da CustomerView.vue */
/* Questo include:
   .customer-view-container, .filterable-sidebar, .customer-main-content,
   .customer-main-header, .header-action-button, .add-new-button, .exit-button,
   .no-customer-selected, .initial-loading-message, .error-message,
   .no-results-message, .selected-customer-details-layout, .customer-data-section,
   .customer-buttons-section, .input-field-group, .coordinates-group, .save-button,
   .button-grid, .action-button, .load-more-container, .load-more-button,
   .loading-indicator, .loading-overlay, .spinner-container, .loading-title, .spinner,
   @keyframes spin, @media (max-width: 900px)
*/
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
.input-field-group input[type="date"],
.input-field-group input[type="datetime-local"] { /* Aggiunto datetime-local */
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