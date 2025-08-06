<template>
  <div class="customer-view-container">
    <!-- Sidebar Filtro/Ordinamento per Clienti -->
    <FilterableSidebar
      :items="customerList"
      item-key="customer_id"
      display-key="company_name"
      machine-count-key="total_machines"
      logo-key="logo_url" 
      :can-delete="true"
      label-singular="macchina"
      label-plural="macchine"
      v-model:selectedItem="selectedCustomer"
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
          
          <!-- Pulsante "Ripristina cliente cancellato" -->
          <button v-if="!selectedCustomer" @click="openApplication('DeletedCustomerView')" class="header-action-button add-new-button restore-button">
            Ripristina cliente cancellato
          </button>

          <!-- NUOVO PULSANTE: Visualizza clienti dei distributori -->
          <button v-if="!selectedCustomer" @click="openApplication('DistributorCustomerView')" class="header-action-button add-new-button distributor-view-button">
            Visualizza clienti dei distributori
          </button>

          <!-- Pulsante "Esci" (visibile quando un cliente è selezionato) -->
          <button v-else @click="exitCustomerDetails" class="header-action-button exit-button">
            Esci
          </button>
        </div>
      </div>

      <!-- Spinner di caricamento iniziale (solo se la lista è vuota) -->
      <div v-if="isLoading && customerList.length === 0" class="initial-loading-message">
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
      
      <!-- Contenuto quando un cliente è selezionato o si sta aggiungendo un nuovo cliente -->
      <div v-else-if="selectedCustomer" class="selected-customer-details-layout">
        <!-- Sezione Sinistra: Dati del Cliente (input modificabili) -->
        <div class="customer-data-section">
          <h3>Dati Anagrafici e Contatto</h3>
          
          <!-- Azienda ed Email affiancate -->
          <div class="grid-row-2-columns">
            <div class="input-field-group">
              <label for="companyName">Azienda:</label>
              <input 
                type="text" 
                id="companyName" 
                v-model="selectedCustomer.company_name"
                :class="getValidationClass(isCompanyNameValid, selectedCustomer.company_name, false)"
              >
            </div>
            <div class="input-field-group">
              <label for="email">Email:</label>
              <input 
                type="text" 
                id="email" 
                v-model="selectedCustomer.email"
                :class="getValidationClass(isEmailValid, selectedCustomer.email, false)"
              >
            </div>
          </div>

          <!-- Indirizzo (intera riga) -->
          <div class="input-field-group">
            <label for="address">Indirizzo:</label>
            <input 
              type="text" 
              id="address" 
              v-model="selectedCustomer.address"
              :class="getValidationClass(isAddressValid, selectedCustomer.address, false)"
            >
          </div>
          
          <!-- Partita IVA e Codice Fiscale affiancati -->
          <div class="grid-row-2-columns">
            <div class="input-field-group">
              <label for="vatNumber">Partita IVA:</label>
              <input 
                type="text" 
                id="vatNumber" 
                v-model="selectedCustomer.vat_number"
                :class="getValidationClass(isVatNumberValid, selectedCustomer.vat_number, false)"
              >
            </div>
            <div class="input-field-group">
              <label for="fiscalCode">Codice Fiscale:</label>
              <input 
                type="text" 
                id="fiscalCode" 
                v-model="selectedCustomer.fiscal_code"
                :class="getValidationClass(isFiscalCodeValid, selectedCustomer.fiscal_code, false)"
              >
            </div>
          </div>

          <!-- Latitudine e Longitudine affiancate -->
          <div class="grid-row-2-columns">
            <div class="input-field-group">
              <label for="addressLatitude">Latitudine:</label>
              <input 
                type="text" 
                id="addressLatitude" 
                v-model="selectedCustomer.address_latitude"
                :class="getValidationClass(isAddressLatitudeValid, selectedCustomer.address_latitude, false)"
              >
            </div>
            <div class="input-field-group">
              <label for="addressLongitude">Longitudine:</label>
              <input 
                type="text" 
                id="addressLongitude" 
                v-model="selectedCustomer.address_longitude"
                :class="getValidationClass(isAddressLongitudeValid, selectedCustomer.address_longitude, false)"
              >
            </div>
          </div>

          <!-- Logo Upload Section -->
          <div class="input-field-group">
            <label>Logo:</label>
            <div 
              class="logo-upload-box"
              @dragover.prevent
              @drop="handleFileDrop"
              @click="triggerFileInput"
            >
              <template v-if="selectedCustomer.logo_url"> 
                <img :src="selectedCustomer.logo_url" class="current-logo" alt="Customer Logo"/> 
                <button @click.stop="clearLogo" class="clear-logo-button">X</button>
              </template>
              <template v-else>
                <font-awesome-icon :icon="['fas', 'cloud-upload-alt']" class="upload-icon" />
                <p>Trascina qui un'immagine o clicca per caricare</p>
              </template>
              <input 
                type="file" 
                ref="fileInputRef" 
                @change="handleFileSelect" 
                accept="image/*" 
                style="display: none;" 
              />
            </div>
          </div>
          
          <button @click="saveCustomerChanges" class="save-button">Salva Modifiche</button>

        </div>

        <!-- Sezione Destra: Pulsanti Funzione (visibile solo se un cliente è selezionato E NON si sta aggiungendo un nuovo cliente) -->
        <div v-if="selectedCustomer && !isAddingNewCustomer" class="customer-buttons-section">
          <h3>Funzioni Disponibili</h3>
          <div class="button-list-vertical">
            <button class="action-button" @click="openApplication('ServiceEmailView')">Email di servizio</button>
            <button class="action-button" @click="openApplication('ImpressumSettingsView')">Impostazione impressum</button>
            <button class="action-button" @click="openApplication('OtherSettingsView')">Alte impostazioni</button>
            <button v-if="authStore.user?.is_superuser" class="action-button" @click="openApplication('CustomerSettingsView')">Impostazioni cliente</button>
            <button class="action-button" @click="openApplication('DefectListView')">Elenco difetti</button>
            <button class="action-button" @click="openApplication('LanguageSelectionView')">Selezione lingua</button>
            <button class="action-button" @click="openApplication('EmailTemplateMessagesView')">Messaggi email template</button>
            <!-- <button class="action-button" @click="openApplication('PasswordSettingsView')">Password settings</button> -->
          </div>
        </div>
      </div>

      <!-- Messaggio quando nessun cliente è selezionato (Fallback) -->
      <div v-else class="no-customer-selected">
        <p>Seleziona un cliente dalla barra laterale per visualizzarne i dettagli.</p>
      </div>

      <!-- Legenda di Validazione (NUOVA POSIZIONE) -->
      <ValidationLegend v-if="selectedCustomer"/>

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

    <!-- Overlay per le Viste delle Applicazioni -->
    <component 
      :is="currentApplicationComponent" 
      v-if="showApplicationOverlay" 
      v-bind="currentApplicationProps"
      @close="closeApplication" 
    />
  </div>
</template>

<script>
import FilterableSidebar from '@/components/FilterableSidebar.vue';
import { ref, onMounted, computed, watch, shallowRef } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

// Importa tutti i nuovi componenti delle applicazioni
import ServiceEmailView from '@/components/customer-application-views/ServiceEmailView.vue';
import ImpressumSettingsView from '@/components/customer-application-views/ImpressumSettingsView.vue';
import OtherSettingsView from '@/components/customer-application-views/OtherSettingsView.vue';
import CustomerSettingsView from '@/components/customer-application-views/CustomerSettingsView.vue';
import DefectListView from '@/components/customer-application-views/DefectListView.vue';
import LanguageSelectionView from '@/components/customer-application-views/LanguageSelectionView.vue';
import EmailTemplateMessagesView from '@/components/customer-application-views/EmailTemplateMessagesView.vue';
import DeletedCustomerView from '@/components/customer-application-views/DeletedCustomerView.vue';
import DistributorCustomerView from '@/components/customer-application-views/DistributorCustomerView.vue';

// import PasswordSettingsView from '@/components/customer-application-views/PasswordSettingsView.vue';
import ValidationLegend from '@/components/ValidationLegend.vue'; // Importa il componente leggenda con percorso corretto

// Importa le regex dal file utils
import { 
  emailRegex, 
  companyNameAddressRegex, 
  vatFiscalCodeRegex, 
  floatNumberRegex 
} from '@/utils/regex';

export default {
  name: 'CustomerView',
  components: {
    FilterableSidebar,
    // Registra i componenti delle applicazioni per l'uso dinamico
    ServiceEmailView,
    ImpressumSettingsView,
    OtherSettingsView,
    CustomerSettingsView,
    DefectListView,
    LanguageSelectionView,
    EmailTemplateMessagesView,
    DeletedCustomerView,
    DistributorCustomerView,
    // PasswordSettingsView,
    ValidationLegend, // Registra il componente leggenda
  },
  setup() {
    const customerList = ref([]);
    const selectedCustomer = ref(null);
    const isLoading = ref(true); // Indica il caricamento dalla rete
    const error = ref(null);
    const isAddingNewCustomer = ref(false); // DICHIARAZIONE AGGIUNTA QUI

    const currentPage = ref(1);
    const initialPageSize = 40;
    const subsequentPageSize = 20;
    const totalItems = ref(0);

    const authStore = useAuthStore();
    const router = useRouter();

    // Refs for logo handling
    const fileInputRef = ref(null);

    // Stato per la gestione delle finestre delle applicazioni
    const currentApplicationComponent = shallowRef(null); // Usa shallowRef per i componenti dinamici
    const showApplicationOverlay = ref(false);
    const currentApplicationProps = ref({}); // Nuovo ref per le props dinamiche

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

    const hasMorePages = computed(() => {
      if (totalItems.value === 0 && customerList.value.length === 0) return false;
      return customerList.value.length < totalItems.value;
    });

    // Funzione per determinare la classe di validazione del bordo
    const getValidationClass = (isValid, value, isOptional) => {
      const stringValue = String(value || '');
      const trimmedValue = stringValue.trim();

      // Se il campo è vuoto
      if (trimmedValue === '') {
        return isOptional ? 'border-blue' : 'border-red'; // Blu se opzionale, rosso se obbligatorio
      }
      
      // Se il campo ha contenuto, controlla la validità
      return isValid ? 'border-green' : 'border-red';
    };

    // Computed properties per la validazione dei campi
    const isCompanyNameValid = computed(() => companyNameAddressRegex.test(selectedCustomer.value?.company_name || ''));
    const isEmailValid = computed(() => emailRegex.test(selectedCustomer.value?.email || ''));
    const isAddressValid = computed(() => companyNameAddressRegex.test(selectedCustomer.value?.address || ''));
    const isVatNumberValid = computed(() => vatFiscalCodeRegex.test(selectedCustomer.value?.vat_number || ''));
    const isFiscalCodeValid = computed(() => vatFiscalCodeRegex.test(selectedCustomer.value?.fiscal_code || ''));
    const isAddressLatitudeValid = computed(() => floatNumberRegex.test(selectedCustomer.value?.address_latitude || ''));
    const isAddressLongitudeValid = computed(() => floatNumberRegex.test(selectedCustomer.value?.address_longitude || ''));


    // Funzione per recuperare i dati dei clienti dall'API
    // `backgroundFetch` indica se la chiamata è per un aggiornamento in background
    const fetchCustomers = async (pageToLoad = 1, sizeToLoad = initialPageSize, append = false, backgroundFetch = false) => {
      if (!backgroundFetch && customerList.value.length === 0) {
        isLoading.value = true;
      } else if (append) {
        isLoading.value = true;
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

          const itemsToMap = rawData.data && rawData.data.items ? rawData.data.items : [];
          totalItems.value = rawData.data && rawData.data.total_items ? rawData.data.total_items : itemsToMap.length;

          const mappedCustomers = itemsToMap.map(item => {
            const logoUrl = item.logo_url || null; 

            return {
              customer_id: item.customer_id,
              company_name: item.company_name,
              total_machines: item.total_machines || 0,
              logo_url: logoUrl,
              address: item.address || 'N/A',
              fiscal_data: item.fiscal_data || 'N/A',
              latitude: item.latitude || 'N/A', 
              longitude: item.longitude || 'N/A', 
              email: item.email || 'N/A',
              vat_number: item.vat_number || 'N/A',
              fiscal_code: item.fiscal_code || 'N/A',
              address_latitude: item.address_latitude || '',
              address_longitude: item.address_longitude || '',
              logo_name: item.logo_name || null,
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

    // Funzione per recuperare i dettagli di un singolo cliente
    const fetchCustomerDetails = async (customerId) => {
      isLoading.value = true;
      error.value = null;

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        error.value = 'Sessione scaduta o non autenticata. Impossibile caricare i dettagli del cliente.';
        isLoading.value = false;
        await authStore.logout();
        router.push('/');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        "Language": authStore.selectedLanguage || 'en-EN',
        "EditData": "1",
      };

      if (authStore.user && authStore.user.is_superuser === true) {
        headers['Customer'] = '';
      } else if (authStore.user && authStore.user.company_name) {
        headers['Customer'] = authStore.user.company_name;
      } else if (selectedCustomer.value?.company_name) {
        headers['Customer'] = selectedCustomer.value.company_name;
      } else {
        console.warn('user.is_superuser o user.company_name non disponibili per l\'header Customer per fetchCustomerDetails.');
      }


      let apiUrl = `http://localhost:8000/api/customer/${customerId}`;

      console.log('Headers inviati alla API /api/customer/<pk>:', headers);
      console.log('URL finale della richiesta dettagli cliente:', apiUrl);

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
        });

        if (response.ok) {
          const rawData = await response.json();
          console.log('Dati API dettaglio cliente ricevuti:', rawData);

          const item = rawData; 
          
          const logoUrl = item.logo_url || null; 

          selectedCustomer.value = {
            customer_id: item.customer_id,
            company_name: item.company_name,
            total_machines: item.total_machines || 0,
            logo_url: logoUrl,
            address: item.address || 'N/A',
            fiscal_data: item.fiscal_data || 'N/A',
            latitude: item.latitude || 'N/A', 
            longitude: item.longitude || 'N/A', 
            email: item.email || '',
            vat_number: item.vat_number || '',
            fiscal_code: item.fiscal_code || '',
            address_latitude: item.address_latitude || '',
            address_longitude: item.address_longitude || '',
            logo_name: item.logo_name || null,
          };
          
        } else {
          const errorText = await response.text();
          console.error('Errore nel recupero dettagli cliente (risposta non ok):', response.status, errorText);
          error.value = `Errore nel caricamento dei dettagli cliente: ${response.status} - ${errorText}`;
          if (response.status === 401 || response.status === 403) {
            await authStore.logout();
            router.push('/');
          }
        }
      } catch (err) {
        console.error('Errore di rete o del server (catch dettagli cliente):', err);
        error.value = 'Impossibile connettersi al server per i dati dei dettagli cliente.';
      } finally {
        isLoading.value = false;
      }
    };


    const loadMoreCustomers = () => {
      if (!isLoading.value && hasMorePages.value) {
        currentPage.value++;
        fetchCustomers(currentPage.value, subsequentPageSize, true); 
      }
    };

    onMounted(() => {
      const currentUserId = authStore.user ? (authStore.user.user_id || authStore.user.username || authStore.user.customer_id) : null;

      if (authStore.isAuthenticated && authStore.cachedCustomerListUserId === currentUserId && authStore.cachedCustomerList.length > 0) {
        customerList.value = authStore.cachedCustomerList;
        console.log('Clienti caricati dalla cache (istantaneo):', customerList.value.length);
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
              console.log('Clienti caricati dalla cache dopo autenticazione (istantaneo):', customerList.value.length);
              isLoading.value = false;
              fetchCustomers(1, initialPageSize, false, true);
            } else {
              fetchCustomers(currentPage.value, initialPageSize, false);
            }
            unwatch();
          }
        });
      }
    });

    const handleCustomerSelected = async (item) => {
      if (!item) {
        selectedCustomer.value = null;
        isAddingNewCustomer.value = false; // Resetta lo stato di aggiunta
        console.log('Cliente deselezionato dalla sidebar.');
        return;
      }
      console.log('Cliente selezionato dalla sidebar, recupero dettagli completi per ID:', item.customer_id);
      console.log('Logo URL ricevuto per il cliente selezionato:', item.logo_url);
      isAddingNewCustomer.value = false; // Resetta lo stato di aggiunta quando si seleziona un cliente esistente
      await fetchCustomerDetails(item.customer_id);
    };

    const saveCustomerChanges = async () => {
      if (!selectedCustomer.value) return;

      console.log('Salvataggio modifiche per cliente:', selectedCustomer.value);
      console.log('Nuovi dati logo da salvare:', {
        logo_name: selectedCustomer.value.logo_name,
        logo_base64: selectedCustomer.value.logo_base64 ? selectedCustomer.value.logo_base64.substring(0, 30) + '...' : null,
        logo_content_type: selectedCustomer.value.logo_content_type
      });

      console.log('Modifiche simulate salvate!');
      const index = customerList.value.findIndex(c => c.customer_id === selectedCustomer.value.customer_id);
      if (index !== -1) {
        customerList.value[index] = { ...selectedCustomer.value };
        authStore.saveCustomerListToCache(customerList.value);
      }
      isAddingNewCustomer.value = false; // Resetta lo stato dopo il salvataggio
    };

    const addNewCustomer = () => {
      console.log('Aggiungi nuovo cliente cliccato.');
      selectedCustomer.value = { 
        customer_id: null, 
        company_name: '',
        address: '',
        fiscal_data: '',
        email: '',
        vat_number: '',
        fiscal_code: '',
        address_latitude: '',
        address_longitude: '',
        total_machines: 0,
        logo_url: null,
        logo_name: null,
        logo_base64: null,
        logo_content_type: null,
      };
      isAddingNewCustomer.value = true; // Imposta lo stato di aggiunta
      console.log('Logica per aggiungere un nuovo cliente non implementata. Form vuoto caricato.');
    };

    const exitCustomerDetails = () => {
      selectedCustomer.value = null;
      isAddingNewCustomer.value = false; // Resetta lo stato di aggiunta
      console.log('Uscito dalla visualizzazione dettagliata del cliente.');
    };

    const handleCustomerDeleted = (itemId) => {
      console.log('Richiesta di eliminazione cliente con ID:', itemId);
      customerList.value = customerList.value.filter(cust => cust.customer_id !== itemId);
      if (selectedCustomer.value && selectedCustomer.value.customer_id === itemId) {
        selectedCustomer.value = null;
        isAddingNewCustomer.value = false; // Resetta lo stato se il cliente eliminato era selezionato
      }
      totalItems.value--;
      authStore.saveCustomerListToCache(customerList.value);
    };

    const triggerFileInput = () => {
      fileInputRef.value.click();
    };

    const handleFileDrop = (event) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        processImageFile(files[0]);
      }
    };

    const handleFileSelect = (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        processImageFile(files[0]);
      }
    };

    const processImageFile = (file) => {
      if (!file.type.startsWith('image/')) {
        alert('Per favore, carica un file immagine valido.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result.split(',')[1];
        selectedCustomer.value.logo_base64 = base64String;
        selectedCustomer.value.logo_content_type = file.type;
        selectedCustomer.value.logo_name = file.name;

        selectedCustomer.value.logo_url = `data:${file.type};base64,${base64String}`; 
      };
      reader.readAsDataURL(file);
    };

    const clearLogo = () => {
      if (selectedCustomer.value) {
        selectedCustomer.value.logo_base64 = null;
        selectedCustomer.value.logo_content_type = null;
        selectedCustomer.value.logo_name = null;
        selectedCustomer.value.logo_url = null;
      }
      if (fileInputRef.value) {
        fileInputRef.value.value = '';
      }
    };

    // --- LOGICA DI APERTURA/CHIUSURA APPLICAZIONI ---
    // Mappa i nomi dei componenti a stringhe per l'uso con shallowRef
    const appComponentsMap = {
      ServiceEmailView,
      ImpressumSettingsView,
      OtherSettingsView,
      CustomerSettingsView,
      DefectListView,
      LanguageSelectionView,
      EmailTemplateMessagesView,
      DeletedCustomerView,
      DistributorCustomerView,
    };

    const openApplication = (componentName) => {
      if (appComponentsMap[componentName]) {
        currentApplicationComponent.value = appComponentsMap[componentName];
        if (selectedCustomer.value && selectedCustomer.value.company_name) {
          currentApplicationProps.value = { companyName: selectedCustomer.value.company_name, customerId: selectedCustomer.value.customer_id };
          console.log(`Passando companyName a ${componentName}: ${selectedCustomer.value.company_name}`);
        } else {
          currentApplicationProps.value = {};
          console.warn(`Tentativo di aprire ${componentName} senza companyName selezionato.`);
        }
        
        showApplicationOverlay.value = true;
        console.log(`Apertura applicazione: ${componentName}`);
      } else {
        console.error(`Componente applicazione "${componentName}" non trovato.`);
      }
    };

    const closeApplication = () => {
      showApplicationOverlay.value = false;
      currentApplicationComponent.value = null;
      currentApplicationProps.value = {};
      console.log('Chiusura applicazione.');
    };


    return {
      customerList,
      selectedCustomer,
      isLoading,
      error,
      isAddingNewCustomer, // Esposto al template
      hasMorePages,
      handleCustomerSelected,
      handleCustomerDeleted,
      loadMoreCustomers,
      saveCustomerChanges,
      addNewCustomer,
      exitCustomerDetails,
      fileInputRef,
      triggerFileInput,
      handleFileDrop,
      handleFileSelect,
      clearLogo,
      authStore, 
      currentApplicationComponent,
      showApplicationOverlay,
      openApplication,
      closeApplication,
      currentApplicationProps, 
      getValidationClass,
      isCompanyNameValid,
      isEmailValid,
      isAddressValid,
      isVatNumberValid,
      isFiscalCodeValid,
      isAddressLatitudeValid,
      isAddressLongitudeValid,
    };
  }
};
</script>

<style scoped>
/* Stili esistenti... */
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

.header-actions {
  display: flex; /* Aggiunto per allineare i pulsanti */
  gap: 10px;    /* Spazio tra i pulsanti */
  flex-wrap: wrap; /* Permette ai pulsanti di andare a capo su schermi piccoli */
  justify-content: flex-end; /* Allinea a destra */
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

.grid-row-2-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.grid-row-2-columns .input-field-group {
  margin-bottom: 0;
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

.button-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  width: 100%;
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

/* Stili per il logo upload box */
.logo-upload-box {
  width: 100px;
  height: 100px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  cursor: pointer;
  background-color: #f9f9f9;
  position: relative;
  overflow: hidden;
}

.logo-upload-box:hover {
  border-color: #007bff;
  background-color: #e9f5ff;
}

.logo-upload-box .upload-icon {
  font-size: 2.5em;
  color: #007bff;
}

.logo-upload-box p {
  font-size: 0.7em;
  color: #666;
  margin-top: 5px;
  padding: 0 5px;
}

.logo-upload-box .current-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.clear-logo-button {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(220, 53, 69, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.8em;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clear-logo-button:hover {
  background-color: #dc3545;
}

/* Classi per i bordi di validazione (con !important per priorità) */
.input-field-group input.border-red {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25) !important;
}

.input-field-group input.border-green {
  border-color: #28a745 !important;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25) !important;
}

.input-field-group input.border-blue {
  border-color: #007bff !important;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
}

/* Stili per il pulsante Ripristina */
.restore-button {
  background-color: #ffc107; /* Un colore giallo/arancione per indicare "attenzione" */
  color: #333;
  border-color: #ffc107;
}

.restore-button:hover {
  background-color: #e0a800; /* Versione più scura al passaggio del mouse */
  color: white;
}

/* NUOVO STILE per il pulsante Visualizza clienti dei distributori */
.distributor-view-button {
  background-color: #17a2b8; /* Un colore ciano/blu per distinguere */
  color: white;
  border-color: #17a2b8;
}

.distributor-view-button:hover {
  background-color: #138496; /* Versione più scura al passaggio del mouse */
  color: white;
}


@media (max-width: 900px) {
  .selected-customer-details-layout {
    grid-template-columns: 1fr;
  }
  .header-actions {
    flex-direction: column; /* Impila i pulsanti su schermi piccoli */
    align-items: flex-end; /* Allinea a destra */
  }
  .header-action-button {
    width: 100%; /* Rendi i pulsanti a larghezza piena */
  }
}
</style>