<!-- src/components/dashboard-views/AdministratorView.vue -->
<template>
  <div class="customer-view-container"> <!-- Riutilizzo dello stesso container per layout a due colonne -->
    <!-- Sidebar Filtro/Ordinamento per Amministratori (o Clienti, se la lista è la stessa) -->
    <FilterableSidebar
      :items="customerList"
      item-key="customer_id"
      display-key="company_name"
      machine-count-key="total_machines"
      logo-key="logo_url" 
      :can-delete="true"
      label-singular="macchina"
      label-plural="macchine"
      @item-selected="handleCustomerSelected"
      @item-deleted="handleCustomerDeleted"
    />

    <!-- Contenuto Principale della Vista Amministratore -->
    <div class="customer-main-content">
      <div class="customer-main-header">
        <h2>Dettagli Amministratore</h2>
        <div class="header-actions">
          <button v-if="!selectedCustomer" @click="addNewCustomer" class="header-action-button add-new-button">
            Aggiungi Nuovo Admin
          </button>
          <button v-else @click="exitCustomerDetails" class="header-action-button exit-button">
            Esci
          </button>
        </div>
      </div>

      <div v-if="!selectedCustomer && !isLoading && !error && customerList.length > 0" class="no-customer-selected">
        <p>Seleziona un amministratore dalla barra laterale per visualizzarne i dettagli.</p>
      </div>
      <div v-else-if="isLoading && customerList.length === 0" class="initial-loading-message">
        <p>Caricamento amministratori...</p>
      </div>
      <div v-else-if="error" class="error-message">
        <p>Errore: {{ error }}</p>
      </div>
      <div v-else-if="customerList.length === 0 && !isLoading" class="no-results-message">
        <p>Nessun amministratore trovato.</p>
      </div>
      
      <div v-else-if="selectedCustomer" class="selected-customer-details-layout">
        <div class="customer-data-section">
          <h3>Dati Amministratore</h3>
          <p><strong>Nome Admin:</strong> {{ selectedCustomer.company_name }}</p>
          <p><strong>Email:</strong> {{ selectedCustomer.user_custom_name }}</p>
          <!-- Qui andranno i dati specifici dell'amministratore -->
        </div>
        <div class="customer-buttons-section">
          <h3>Funzioni Admin</h3>
          <div class="button-grid">
            <button class="action-button">Gestisci Permessi</button>
            <button class="action-button">Reset Password</button>
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
  name: 'AdministratorView',
  components: {
    FilterableSidebar
  },
  setup() {
    const customerList = ref([]); // Useremo la stessa struttura dati dei clienti per semplicità
    const selectedCustomer = ref(null);
    const isLoading = ref(true);
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

    const fetchCustomers = async (pageToLoad = 1, sizeToLoad = initialPageSize, append = false, backgroundFetch = false) => {
      // Questa funzione è quasi identica a quella in CustomerView, ma l'API URL potrebbe cambiare
      if (!backgroundFetch && customerList.value.length === 0) {
        isLoading.value = true;
      } else if (append) {
        isLoading.value = true;
      }
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
        "Customerid": "0", // O un ID specifico per gli admin se l'API lo richiede
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
      queryParams.append('order_by', 'company_name'); // O un campo di ordinamento per gli admin
      queryParams.append('order_dir', 'asc');
      queryParams.append('page', pageToLoad.toString());
      queryParams.append('page_size', sizeToLoad.toString());

      // CAMBIA QUESTO URL API per gli amministratori se è diverso da /api/customer
      let apiUrl = 'http://localhost:8000/api/customer'; // Esempio: '/api/administrators'

      console.log('Headers inviati alla API /api/customer:', headers);
      console.log('URL finale della richiesta:', apiUrl);

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
        customerList.value = authStore.cachedCustomerList;
        isLoading.value = false;
        fetchCustomers(1, initialPageSize, false, true);
      } else if (authStore.isAuthenticated) {
        fetchCustomers(currentPage.value, initialPageSize, false);
      } else {
        const unwatch = authStore.$subscribe((mutation, state) => {
          if (state.isAuthenticated) {
            const authenticatedUserId = state.user ? (state.user.user_id || state.user.username || state.user.customer_id) : null;
            if (state.cachedCustomerListUserId === authenticatedUserId && state.cachedCustomerList.length > 0) {
              customerList.value = state.cachedCustomerList;
              isLoading.value = false;
              fetchCustomers(1, initialPageSize, false, true);
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
    const handleCustomerSelected = (item) => {
      selectedCustomer.value = JSON.parse(JSON.stringify(item));
      console.log('Amministratore selezionato per modifica:', selectedCustomer.value);
    };
    const saveCustomerChanges = async () => {
      if (!selectedCustomer.value) return;
      console.log('Salvataggio modifiche per amministratore:', selectedCustomer.value);
      alert('Logica di salvataggio non implementata per Amministratore.');
      const index = customerList.value.findIndex(c => c.customer_id === selectedCustomer.value.customer_id);
      if (index !== -1) {
        customerList.value[index] = { ...selectedCustomer.value };
        authStore.saveCustomerListToCache(customerList.value);
      }
    };
    const addNewCustomer = () => {
      console.log('Aggiungi nuovo amministratore cliccato.');
      selectedCustomer.value = { 
        customer_id: null, company_name: '', user_custom_name: '', 
        email: '', role: '', // Campi specifici per admin
      };
      alert('Logica per aggiungere un nuovo amministratore non implementata. Form vuoto caricato.');
    };
    const exitCustomerDetails = () => { selectedCustomer.value = null; };
    const handleCustomerDeleted = (itemId) => {
      console.log('Richiesta di eliminazione amministratore con ID:', itemId);
      customerList.value = customerList.value.filter(cust => cust.customer_id !== itemId);
      if (selectedCustomer.value && selectedCustomer.value.customer_id === itemId) {
        selectedCustomer.value = null;
      }
      totalItems.value--;
      authStore.saveCustomerListToCache(customerList.value);
    };

    return {
      customerList, selectedCustomer, isLoading, error, hasMorePages,
      handleCustomerSelected, handleCustomerDeleted, loadMoreCustomers,
      saveCustomerChanges, addNewCustomer, exitCustomerDetails
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