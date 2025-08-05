<template>
  <div class="customer-view-container">
    <!-- Sidebar Filtro/Ordinamento per Clienti -->
    <FilterableSidebar
      :key="customerList.length > 0 ? 'sidebar-loaded' : 'sidebar-empty'" 
      :items="customerList"
      item-key="customer_id"
      display-key="company_name"
      machine-count-key="total_machines"
      logo-key="logo_url" 
      :can-delete="false"
      label-singular="cliente"
      label-plural="clienti"
      @item-selected="handleCustomerSelectedForMachine"
      @item-deleted="handleCustomerDeletedForMachine"
    />

    <!-- Contenuto Principale della Vista Macchine -->
    <div class="customer-main-content">
      <div class="customer-main-header">
        <h2>Dettaglio Macchine</h2>
        <div class="header-actions">
          <!-- Pulsante "Esci" (visibile quando un cliente è selezionato) -->
          <button v-if="selectedCustomerForMachineView" @click="exitCustomerDetailsForMachine" class="header-action-button exit-button">
            Esci
          </button>
        </div>
      </div>

      <!-- Messaggio quando nessun cliente è selezionato E non è superuser -->
      <div v-if="!selectedCustomerForMachineView && !authStore.user?.is_superuser && !isLoadingCustomers && !errorCustomers && customerList.length > 0" class="no-customer-selected">
        <p>Seleziona un cliente dalla barra laterale per visualizzare le sue macchine.</p>
      </div>
      <!-- Messaggio quando superuser e nessun cliente selezionato, ma non ci sono macchine -->
      <div v-else-if="authStore.user?.is_superuser && !selectedCustomerForMachineView && !isLoadingMachines && machineList.length === 0 && !errorMachines" class="no-results-message">
        <p>Nessuna macchina trovata per tutti i clienti.</p>
      </div>
      <!-- Spinner di caricamento iniziale clienti -->
      <div v-else-if="isLoadingCustomers && customerList.length === 0" class="initial-loading-message">
        <p>Caricamento clienti...</p>
      </div>
      <!-- Messaggio di errore clienti -->
      <div v-else-if="errorCustomers" class="error-message">
        <p>Errore: {{ errorCustomers }}</p>
      </div>
      <!-- Nessun cliente trovato dopo il caricamento (solo se non superuser) -->
      <div v-else-if="customerList.length === 0 && !isLoadingCustomers && !authStore.user?.is_superuser" class="no-results-message">
        <p>Nessun cliente trovato.</p>
      </div>
      
      <!-- Contenuto quando un cliente è selezionato O quando superuser e si visualizzano tutte le macchine -->
      <div v-else-if="selectedCustomerForMachineView || (authStore.user?.is_superuser && !selectedCustomerForMachineView)" class="selected-customer-details-layout">
        <!-- Sezione Sinistra: Dettagli del Cliente Selezionato (se presente) -->
        <div v-if="selectedCustomerForMachineView" class="customer-data-section">
          <h3>Macchine per {{ selectedCustomerForMachineView.company_name }}</h3>
          <p>ID Cliente: {{ selectedCustomerForMachineView.customer_id }}</p>
          <p>Macchine totali: {{ selectedCustomerForMachineView.total_machines }}</p>
        </div>
        <!-- La sezione per il messaggio Superuser è stata rimossa qui -->

        <!-- Sezione Destra: Elenco Macchine -->
        <div class="machine-list-section" :key="'machine-list-' + currentPageMachines"> <!-- Aggiunta chiave dinamica qui -->
          <h3>Elenco Macchine</h3>
          <div v-if="isLoadingMachines" class="loading-machines-indicator">
            Caricamento macchine...
          </div>
          <div v-else-if="errorMachines" class="error-message">
            Errore caricamento macchine: {{ errorMachines }}
          </div>
          <div v-else-if="machineList.length === 0" class="no-results-message">
            Nessuna macchina trovata.
          </div>
          <div v-else class="machine-table-wrapper">
            <table class="machine-table">
              <thead>
                <tr>
                  <th>ID Macchina</th>
                  <th>Matricola</th>
                  <th>Nome</th>
                  <th>Descrizione</th>
                  <th>Attiva</th>
                  <th>Online</th>
                  <th>Allarmi</th>
                  <th>SW</th>
                  <th>HW</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="machine in machineList" :key="machine.machine_id">
                  <td>{{ machine.machine_id }}</td>
                  <td>{{ machine.serial_number }}</td>
                  <td>{{ machine.machine_name }}</td>
                  <td>{{ machine.description }}</td>
                  <td>
                    <span :class="{'status-active': machine.is_active, 'status-inactive': !machine.is_active}">
                      {{ machine.is_active ? 'Sì' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span :class="{'status-active': machine.is_online, 'status-inactive': !machine.is_online}">
                      {{ machine.is_online ? 'Sì' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span :class="{'status-active': machine.has_alarms, 'status-inactive': !machine.has_alarms}">
                      {{ machine.has_alarms ? 'Sì' : 'No' }}
                    </span>
                  </td>
                  <td>{{ machine.sw_type ? machine.sw_type : '' }}</td>
                  <td>{{ machine.hw_type ? machine.hw_type : '' }}</td>
                  <td>
                    <!-- Pulsante "Visualizza" sostituito con icona Gear -->
                    <button @click="goToMachineSection(machine.machine_id)" class="action-button icon-button" title="Visualizza">
                      <img :src="GearIcon" alt="Visualizza" class="icon-svg" />
                    </button>
                    <!-- Pulsante "Modifica" sostituito con icona Editing -->
                    <button @click="editMachine(machine.machine_id)" class="action-button icon-button" title="Modifica">
                      <img :src="EditingIcon" alt="Modifica" class="icon-svg" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Controlli di Paginazione Macchine -->
          <div v-if="totalPagesMachines > 1 && !isLoadingMachines" class="pagination-controls">
            <button @click="goToPreviousPage" :disabled="currentPageMachines === 1" class="pagination-button">Precedente</button>
            
            <template v-for="(item, index) in visiblePageNumbers">
              <button
                v-if="item.type === 'page'"
                @click="console.log('Clicked page:', item.value); fetchMachines(selectedCustomerForMachineView ? selectedCustomerForMachineView.customer_id : null, item.value)"
                :class="['pagination-button', { 'active-page': item.value === currentPageMachines }]"
                :disabled="item.value === currentPageMachines"
                :key="item.id"
              >
                {{ item.value }}
              </button>
              <span v-else-if="item.type === 'ellipsis'" class="pagination-ellipsis" :key="'ellipsis-unique-' + index">...</span>
            </template>

            <button @click="goToNextPage" :disabled="currentPageMachines === totalPagesMachines" class="pagination-button">Successiva</button>
          </div>
          <div v-if="isLoadingMachines && machineList.length > 0" class="loading-indicator">
            Caricamento macchine...
          </div>
        </div>
      </div>

      <!-- Pulsante "Carica Altri" per clienti (visibile solo se non si sta visualizzando le macchine) -->
      <div v-if="hasMoreCustomersPages && !isLoadingCustomers && !selectedCustomerForMachineView && (!authStore.user?.is_superuser || (authStore.user?.is_superuser && machineList.length === 0))" class="load-more-container">
        <button @click="loadMoreCustomers" class="load-more-button">Carica Altri Clienti</button>
      </div>
      <div v-if="isLoadingCustomers && customerList.length > 0 && !selectedCustomerForMachineView" class="loading-indicator">
        Caricamento aggiuntivo clienti...
      </div>
    </div>

    <!-- Spinner di caricamento in overlay (solo per caricamento iniziale clienti) -->
    <div v-if="isLoadingCustomers && customerList.length === 0" class="loading-overlay">
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
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import GearIcon from '@/assets/icons/gear.svg'; // Import the SVG icon for 'Visualizza'
import EditingIcon from '@/assets/icons/editing.svg'; // Import the SVG icon for 'Modifica'

export default {
  name: 'MachineView',
  components: {
    FilterableSidebar
  },
  setup() {
    // Stati per la sidebar dei clienti
    const customerList = ref([]);
    const selectedCustomerForMachineView = ref(null); // Il cliente selezionato dalla sidebar
    const isLoadingCustomers = ref(true); // Indica il caricamento della lista clienti
    const errorCustomers = ref(null);

    // Stati per la lista delle macchine del cliente selezionato
    const machineList = ref([]);
    const isLoadingMachines = ref(false); // Indica il caricamento delle macchine
    const errorMachines = ref(null);
    const currentPageMachines = ref(1); // Pagina corrente per le macchine
    const totalMachinesItems = ref(0); // Totale macchine disponibili
    const totalPagesMachines = ref(1); // Totale pagine macchine, inizializzato a 1
    const MACHINES_PER_PAGE = 10; // Numero di macchine per pagina (usato per il parametro page_size dell'API)

    // Paginazione per i clienti (sidebar)
    const currentPageCustomers = ref(1);
    const initialPageSizeCustomers = 40;
    const subsequentPageSizeCustomers = 20;
    const totalCustomersItems = ref(0);

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

    // Computed per la paginazione dei clienti
    const hasMoreCustomersPages = computed(() => {
      if (totalCustomersItems.value === 0 && customerList.value.length === 0) return false;
      return customerList.value.length < totalCustomersItems.value;
    });

    // Computed property per generare i numeri di pagina visibili
    const visiblePageNumbers = computed(() => {
      const pages = [];
      const total = totalPagesMachines.value;
      const current = currentPageMachines.value;
      const pageRange = 2; // Numero di pagine da mostrare su ogni lato della pagina corrente (totale 5 pagine nel blocco centrale)

      if (total <= 1) {
        return [];
      }

      // Aggiungi la prima pagina
      pages.push({ type: 'page', value: 1, id: 'page-1' });

      // Aggiungi le pagine attorno alla pagina corrente
      for (let i = current - pageRange; i <= current + pageRange; i++) {
        if (i > 1 && i < total) { // Assicurati che le pagine non siano 1 o total
          pages.push({ type: 'page', value: i, id: `page-${i}` });
        }
      }

      // Aggiungi l'ultima pagina
      if (total > 1) { // Assicurati di aggiungere l'ultima pagina solo se ce n'è più di una
        pages.push({ type: 'page', value: total, id: `page-${total}` });
      }

      // Rimuovi duplicati e ordina
      const uniquePages = [...new Map(pages.map(item => [item.value, item])).values()].sort((a, b) => a.value - b.value);

      // Inserisci i puntini di sospensione
      const finalPages = [];
      let lastPageAdded = 0; // Traccia l'ultimo numero di pagina aggiunto

      for (let i = 0; i < uniquePages.length; i++) {
        const pageItem = uniquePages[i];
        
        if (pageItem.value > lastPageAdded + 1) {
          finalPages.push({ type: 'ellipsis', id: `ellipsis-${lastPageAdded + 1}` }); // Usa un ID unico per i puntini
        }
        finalPages.push(pageItem);
        lastPageAdded = pageItem.value;
      }
      return finalPages;
    });

    // --- Funzione per recuperare la lista dei CLIENTI (per la sidebar) ---
    const fetchCustomers = async (pageToLoad = 1, sizeToLoad = initialPageSizeCustomers, append = false, backgroundFetch = false) => {
      if (!backgroundFetch && customerList.value.length === 0) { isLoadingCustomers.value = true; } else if (append) { isLoadingCustomers.value = true; }
      errorCustomers.value = null;

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        errorCustomers.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        isLoadingCustomers.value = false;
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

      let apiUrl = 'http://localhost:8000/api/customer'; // API per i CLIENTI

      if (queryParams.toString()) { apiUrl += `?${queryParams.toString()}`; }

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

    // --- Funzione per recuperare la lista delle MACCHINE ---
    // customerId: ID del cliente specifico, o null per tutti (superuser)
    const fetchMachines = async (customerId = null, pageToLoad = 1, pageSize = MACHINES_PER_PAGE, orderBy = 'machine_id', orderDir = 'asc') => {
      isLoadingMachines.value = true;
      errorMachines.value = null;
      machineList.value = []; // Pulisci sempre la lista per la nuova pagina

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        errorMachines.value = 'Sessione scaduta o non autenticata. Impossibile caricare le macchine.';
        isLoadingMachines.value = false;
        await authStore.logout();
        router.push('/');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        "Language": authStore.selectedLanguage || 'en-EN',
        "Datatable": "1"
      };

      if (authStore.user && authStore.user.is_superuser === true) {
        headers['Customer'] = '';
      } else if (authStore.user && authStore.user.company_name) {
        headers['Customer'] = authStore.user.company_name;
      } else {
        console.warn('user.is_superuser o user.company_name non disponibili per l\'header Customer.');
      }

      // Rimuovi l'header Customerid se il filtro è gestito via query param 'filter'
      // if (customerId !== null) {
      //   headers['Customerid'] = customerId.toString();
      // } else if (authStore.user && authStore.user.is_superuser === true) {
      //   headers['Customerid'] = '0';
      // } else {
      //   isLoadingMachines.value = false;
      //   errorMachines.value = 'Seleziona un cliente per visualizzare le macchine.';
      //   return;
      // }
      
      const queryParams = new URLSearchParams();
      queryParams.append('sort_by', orderBy);
      queryParams.append('order_dir', orderDir);
      queryParams.append('page', pageToLoad.toString());
      queryParams.append('page_size', pageSize.toString());

      // *** MODIFICA: Aggiungi il filtro per customer_id ***
      const filters = {};
      if (customerId !== null) {
        filters.customer_id = customerId;
      }
      // Se ci sono filtri, aggiungili come stringa JSON al parametro 'filter'
      if (Object.keys(filters).length > 0) {
        queryParams.append('filter', JSON.stringify(filters));
      }
      // *** FINE MODIFICA ***

      let apiUrl = 'http://localhost:8000/api/machine';

      if (queryParams.toString()) { apiUrl += `?${queryParams.toString()}`; }

      console.log('Headers inviati alla API /api/machine:', headers);
      console.log('URL finale della richiesta /api/machine:', apiUrl);

      try {
        const response = await fetch(apiUrl, { method: 'GET', headers: headers });

        if (response.ok) {
          const rawData = await response.json();
          const itemsToMap = rawData.data && rawData.data.items ? rawData.data.items : [];
          
          // Estrai i dati di paginazione dalla nuova struttura
          totalMachinesItems.value = rawData.data?.pagination?.count || itemsToMap.length;
          totalPagesMachines.value = rawData.data?.pagination?.total_pages || 1;

          const mappedItems = itemsToMap.map(item => ({
            machine_id: item.machine_id,
            serial_number: item.serial_number || 'N/A',
            machine_name: item.name || 'N/A',
            description: item.notes || 'N/A',
            is_active: !item.is_deleted || false,
            is_online: item.is_online || false,
            has_alarms: item.alarm || false,
            sw_type: item.sw_type || '',
            hw_type: item.hw_type || '',
          }));
          
          machineList.value = mappedItems;
          currentPageMachines.value = pageToLoad; // Assicurati che la pagina corrente sia aggiornata
          console.log(`Fetch Machines Completato: totalMachinesItems=${totalMachinesItems.value}, currentPageMachines=${currentPageMachines.value}, totalPagesMachines=${totalPagesMachines.value}`);
        } else {
          const errorText = await response.text(); errorMachines.value = `Errore caricamento macchine: ${response.status} - ${errorText}`;
          if (response.status === 401 || response.status === 403) { await authStore.logout(); router.push('/'); }
        }
      } catch (err) { errorMachines.value = 'Impossibile connettersi al server per i dati delle macchine.'; } finally { isLoadingMachines.value = false; }
    };

    // --- Watcher per la selezione del cliente ---
    watch(selectedCustomerForMachineView, (newCustomer) => {
      currentPageMachines.value = 1; // Sempre resetta la paginazione delle macchine
      if (newCustomer && newCustomer.customer_id) {
        fetchMachines(newCustomer.customer_id, currentPageMachines.value);
      } else if (authStore.user && authStore.user.is_superuser === true) {
        fetchMachines(null, currentPageMachines.value);
      } else {
        machineList.value = [];
        isLoadingMachines.value = false;
        errorMachines.value = null;
      }
    });

    onMounted(() => {
      const currentUserId = authStore.user ? (authStore.user.user_id || authStore.user.username || authStore.user.customer_id) : null;
      if (authStore.isAuthenticated && authStore.cachedCustomerListUserId === currentUserId && authStore.cachedCustomerList.length > 0) {
        customerList.value = authStore.cachedCustomerList; isLoadingCustomers.value = false; fetchCustomers(1, initialPageSizeCustomers, false, true);
      } else if (authStore.isAuthenticated) { fetchCustomers(currentPageCustomers.value, initialPageSizeCustomers, false); } 
      else {
        const unwatch = authStore.$subscribe((mutation, state) => {
          if (state.isAuthenticated) {
            const authenticatedUserId = state.user ? (state.user.user_id || state.user.username || state.user.customer_id) : null;
            if (state.cachedCustomerListUserId === authenticatedUserId && state.cachedCustomerList.length > 0) {
              customerList.value = state.cachedCustomerList; isLoadingCustomers.value = false; fetchCustomers(1, initialPageSizeCustomers, false, true);
            } else { fetchCustomers(currentPageCustomers.value, initialPageSizeCustomers, false); }
            unwatch();
          }
        });
      }
      // Caricamento iniziale delle macchine al mount per superuser senza cliente selezionato
      if (authStore.isAuthenticated && authStore.user?.is_superuser && !selectedCustomerForMachineView.value) {
        fetchMachines(null, currentPageMachines.value);
      }
    });

    const loadMoreCustomers = () => {
      if (!isLoadingCustomers.value && hasMoreCustomersPages.value) {
        isLoadingCustomers.value = true; 
        currentPageCustomers.value++;
        fetchCustomers(currentPageCustomers.value, subsequentPageSizeCustomers, true); 
      }
    };

    const goToPreviousPage = () => {
      if (currentPageMachines.value > 1) {
        const customerIdToLoad = selectedCustomerForMachineView.value ? selectedCustomerForMachineView.value.customer_id : null;
        fetchMachines(customerIdToLoad, currentPageMachines.value - 1);
      }
    };

    const goToNextPage = () => {
      if (currentPageMachines.value < totalPagesMachines.value) {
        const customerIdToLoad = selectedCustomerForMachineView.value ? selectedCustomerForMachineView.value.customer_id : null;
        fetchMachines(customerIdToLoad, currentPageMachines.value + 1);
      }
    };

    const handleCustomerSelectedForMachine = (item) => {
      selectedCustomerForMachineView.value = JSON.parse(JSON.stringify(item));
      console.log('Cliente selezionato per visualizzare macchine:', selectedCustomerForMachineView.value);
    };

    const exitCustomerDetailsForMachine = () => {
      selectedCustomerForMachineView.value = null;
      if (authStore.user?.is_superuser) {
        currentPageMachines.value = 1;
        fetchMachines(null, currentPageMachines.value);
      } else {
        machineList.value = [];
        isLoadingMachines.value = false;
        errorMachines.value = null;
      }
      console.log('Uscito dalla visualizzazione dettagliata del cliente per le macchine.');
    };

    const goToMachineSection = (machineId) => {
      console.log(`Vai alla sezione dettagli macchina per ID: ${machineId}`);
      // Esempio di navigazione con router:
      // router.push({ name: 'MachineDetails', params: { id: machineId } });
    };

    const editMachine = (machineId) => {
      console.log(`Modifica macchina per ID: ${machineId}`);
      // Esempio di navigazione con router:
      // router.push({ name: 'MachineEdit', params: { id: machineId } });
    };

    const handleCustomerDeletedForMachine = (itemId) => {
      console.log('Richiesta di eliminazione cliente (non macchina) con ID:', itemId);
      customerList.value = customerList.value.filter(cust => cust.customer_id !== itemId);
      if (selectedCustomerForMachineView.value && selectedCustomerForMachineView.value.customer_id === itemId) {
        selectedCustomerForMachineView.value = null;
      }
      totalCustomersItems.value--;
      authStore.saveCustomerListToCache(customerList.value);
    };

    return {
      authStore,
      customerList,
      selectedCustomerForMachineView,
      isLoadingCustomers,
      errorCustomers,
      hasMoreCustomersPages,
      machineList,
      isLoadingMachines,
      errorMachines,
      totalPagesMachines, // Reso disponibile nel template
      currentPageMachines, // Reso disponibile nel template
      visiblePageNumbers, // Nuova computed property per la paginazione avanzata
      handleCustomerSelectedForMachine,
      handleCustomerDeletedForMachine,
      loadMoreCustomers,
      goToPreviousPage, // Nuovo metodo per paginazione
      goToNextPage,     // Nuovo metodo per paginazione
      exitCustomerDetailsForMachine,
      goToMachineSection,
      editMachine,
      fetchMachines, // <--- Assicurati che fetchMachines sia qui!
      GearIcon, // Rende l'icona importata disponibile nel template
      EditingIcon, // Rende l'icona di modifica importata disponibile nel template
    };
  }
};
</script>
<style scoped>
/* Copia e incolla qui TUTTI gli stili da CustomerView.vue */
/* Sono gli stessi stili per .customer-view-container, .filterable-sidebar,
   .customer-main-content, .customer-main-header, .header-action-button,
   .add-new-button, .exit-button, .no-customer-selected, .initial-loading-message,
   .error-message, .no-results-message, .selected-customer-details-layout,
   .customer-data-section, .customer-buttons-section, .input-field-group,
   .coordinates-group, .save-button, .button-grid, .action-button,
   .load-more-container, .load-more-button, .loading-indicator,
   .loading-overlay, .spinner-container, .loading-title, .spinner,
   @keyframes spin, @media (max-width: 900px) */

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
.customer-buttons-section h3,
.machine-list-section h3 {
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
.input-field-group input[type="datetime-local"],
.input-field-group input[type="number"] {
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

.machine-list-section {
  grid-column: span 2;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
  margin-top: 20px;
}

.loading-machines-indicator {
  text-align: center;
  padding: 20px;
  color: #888;
}

.machine-table-wrapper {
  overflow-x: auto;
}

.machine-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.machine-table th,
.machine-table td {
  border: 1px solid #e0e0e0;
  padding: 10px 12px;
  text-align: left;
  font-size: 0.9em;
}

.machine-table th {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.machine-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.machine-table tbody tr:hover {
  background-color: #eaf6ff;
}

/* Stili per il pulsante con icona */
.machine-table .action-button.icon-button {
  background-color: transparent; /* Rende lo sfondo trasparente */
  border: none; /* Rimuove il bordo */
  padding: 5px; /* Regola il padding come necessario */
  display: inline-flex; /* Usa flexbox per centrare il contenuto */
  justify-content: center;
  align-items: center;
  width: 35px; /* Imposta una larghezza fissa per il pulsante */
  height: 35px; /* Imposta un'altezza fissa per il pulsante */
}

.machine-table .action-button.icon-button:hover {
  background-color: #e0e0e0; /* Sfondo chiaro al passaggio del mouse */
  transform: translateY(-1px); /* Leggero sollevamento al passaggio del mouse */
}

.icon-svg {
  width: 20px; /* Regola la dimensione dell'icona SVG */
  height: 20px;
  /* Esempio di filtro per colorare un'icona SVG nera in blu */
  filter: invert(30%) sepia(80%) saturate(1500%) hue-rotate(200deg) brightness(90%) contrast(90%);
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

/* Nuovi stili per la paginazione */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}

.pagination-button {
  background-color: #007bff;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.pagination-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.pagination-controls span {
  font-weight: bold;
  color: #555;
}

.pagination-button.active-page {
  background-color: #0056b3; /* Colore diverso per la pagina corrente */
  cursor: default;
}

.pagination-ellipsis {
  font-weight: bold;
  color: #555;
  padding: 0 5px;
}

.status-active {
  background-color: #a0fba0; /* Verde chiaro */
  color: black; /*#28a745;*/ /* Verde scuro */
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block; /* Per applicare padding e background correttamente */
}


.status-inactive {
  background-color: #fcbebe; /* Rosso chiaro */
  color: black; /*#dc3545;*/ /* Rosso scuro */
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block; /* Per applicare padding e background correttamente */
}


@media (max-width: 900px) {
  .selected-customer-details-layout {
    grid-template-columns: 1fr;
  }
  .machine-list-section {
    grid-column: span 1;
  }
}
</style>