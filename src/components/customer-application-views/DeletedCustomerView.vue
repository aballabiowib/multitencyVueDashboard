<template>
  <div class="deleted-customer-overlay">
    <div class="deleted-customer-container">
      <div class="header">
        <h2>Clienti Cancellati</h2>
        <!-- Casella di ricerca aggiornata qui -->
        <div class="search-box">
          <input type="text" v-model="searchQuery" placeholder="Cerca nell'elenco..." class="search-input">
          <img src="@/components/icons/search.svg" alt="search" class="search-icon-img">
        </div>
        <!-- Il pulsante di chiusura in alto a destra è qui e funziona correttamente -->
        <button @click="$emit('close')" class="close-button">X</button>
      </div>

      <div v-if="isLoading" class="loading-message">
        <div class="spinner"></div>
        <p>Caricamento clienti cancellati...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>Errore: {{ error }}</p>
      </div>

      <div v-else-if="deletedCustomers.length === 0" class="no-results-message">
        <p>Nessun cliente cancellato trovato.</p>
      </div>

      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Indirizzo</th>
              <th>Email</th>
              <th>Cancellato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in deletedCustomers" :key="customer.customer_id">
              <td>{{ customer.customer_id }}</td>
              <td>{{ customer.company_name }}</td>
              <td>{{ customer.address }}</td>
              <td>{{ customer.email }}</td>
              <td>{{ customer.is_deleted ? 'Sì' : 'No' }}</td>
              <td class="actions-cell">
                <button @click="restoreCustomer(customer.customer_id)" class="action-button restore-button">Ripristina</button>
                <button @click="confirmDeleteCustomer(customer.customer_id)" class="action-button delete-button">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Nuovi controlli di paginazione -->
        <div v-if="totalPages > 1 && !isLoading" class="pagination-controls">
          <button @click="goToPreviousPage" :disabled="currentPage === 1" class="pagination-button">Precedente</button>
          
          <template v-for="(item, index) in visiblePageNumbers" :key="item.id || 'ellipsis-' + index">
            <button
              v-if="item.type === 'page'"
              @click="goToPage(item.value)"
              :class="['pagination-button', { 'active-page': item.value === currentPage }]"
              :disabled="item.value === currentPage"
            >
              {{ item.value }}
            </button>
            <span v-else-if="item.type === 'ellipsis'" class="pagination-ellipsis">...</span>
          </template>

          <button @click="goToNextPage" :disabled="currentPage === totalPages" class="pagination-button">Successiva</button>
        </div>
      </div>
      
      <!-- Pulsante di chiusura in basso a destra -->
      <div class="footer-close-button-container">
        <button @click="$emit('close')" class="action-button footer-close-button">Chiudi</button>
      </div>
    </div>

    <!-- Componente Modale per i messaggi (successo/errore) -->
    <MessageModal
      v-if="showModal"
      :title="modalTitle"
      :message="modalMessage"
      @close="showModal = false"
    />

    <!-- Nuovo Componente Modale per la conferma di eliminazione -->
    <ConfirmDeleteModal
      v-if="showConfirmModal"
      :title="confirmModalTitle"
      :message="confirmModalMessage"
      @confirm="handleConfirmDelete"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

// Importa i componenti modali
import MessageModal from '@/components/MessageModal.vue'; 
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'; 

export default {
  name: 'DeletedCustomerView',
  emits: ['close'],
  components: {
    MessageModal,
    ConfirmDeleteModal
  },
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const router = useRouter();
    const deletedCustomers = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    const currentPage = ref(1);
    const pageSize = 10;
    const totalItems = ref(0);
    const searchQuery = ref('');
    let searchTimeout = null;

    // Stato per il modale di messaggio generico
    const showModal = ref(false);
    const modalTitle = ref('');
    const modalMessage = ref('');

    // Stato per il modale di conferma eliminazione
    const showConfirmModal = ref(false);
    const confirmModalTitle = ref('');
    const confirmModalMessage = ref('');
    const customerIdToDelete = ref(null); // Per memorizzare l'ID del cliente da eliminare

    // Funzione per mostrare il modale di messaggio generico
    const showMessageModal = (title, message) => {
      modalTitle.value = title;
      modalMessage.value = message;
      showModal.value = true;
    };

    // Funzione per mostrare il modale di conferma eliminazione
    const confirmDeleteCustomer = (customerId) => {
      customerIdToDelete.value = customerId;
      confirmModalTitle.value = 'Attenzione!';
      confirmModalMessage.value = `Cancellare definitivamente tutti i dati del cliente: ${customerId}? Questa azione è irreversibile.`;
      showConfirmModal.value = true;
    };

    // Funzione per gestire la conferma di eliminazione dal modale
    const handleConfirmDelete = async () => {
      showConfirmModal.value = false; // Chiudi il modale di conferma
      if (customerIdToDelete.value) {
        await deleteCustomerPermanently(customerIdToDelete.value); // Chiama la funzione di eliminazione
        customerIdToDelete.value = null; // Resetta l'ID
      }
    };

    const totalPages = computed(() => {
      return Math.ceil(totalItems.value / pageSize);
    });

    const visiblePageNumbers = computed(() => {
      const pages = [];
      const maxVisiblePages = 5;
      const startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push({ type: 'page', value: 1, id: 1 });
        if (startPage > 2) {
          pages.push({ type: 'ellipsis', id: 'ellipsis-start' });
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push({ type: 'page', value: i, id: i });
      }

      if (endPage < totalPages.value) {
        if (endPage < totalPages.value - 1) {
          pages.push({ type: 'ellipsis', id: 'ellipsis-end' });
        }
        pages.push({ type: 'page', value: totalPages.value, id: totalPages.value });
      }
      return pages;
    });

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

    const fetchDeletedCustomers = async () => {
      isLoading.value = true;
      error.value = null;

      if (!authStore.isAuthenticated || !authStore.token || isTokenExpired(authStore.token)) {
        error.value = 'Sessione scaduta o non autenticata. Effettua nuovamente il login.';
        isLoading.value = false;
        console.error('Errore: Tentativo di recuperare clienti cancellati con token mancante o scaduto.');
        await authStore.logout();
        router.push('/');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
        'Datatable': '1',
        'Language': authStore.selectedLanguage || 'en-EN',
      };

      if (authStore.user && !authStore.user.is_superuser && authStore.user.company_name) {
        headers['Customer'] = authStore.user.company_name;
      } else if (authStore.user && authStore.user.is_superuser) {
        headers['Customer'] = '';
      }

      const queryParams = new URLSearchParams();
      queryParams.append('order_by', 'customer_id');
      queryParams.append('order_dir', 'asc');
      queryParams.append('page', currentPage.value.toString());
      queryParams.append('page_size', pageSize.toString());

      const filterObj = { is_deleted: true };
      if (searchQuery.value.trim() !== '') {
        filterObj.__all__ = searchQuery.value.trim();
      }
      queryParams.append('filter', JSON.stringify(filterObj));

      let apiUrl = `http://localhost:8000/api/customer?${queryParams.toString()}`;

      console.log('Headers inviati alla API /api/customer (deleted customers):', headers);
      console.log('URL finale della richiesta:', apiUrl);

      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
        });

        if (response.ok) {
          const rawData = await response.json();
          console.log('Dati API clienti cancellati ricevuti:', rawData);

          const itemsToMap = rawData.data && rawData.data.items ? rawData.data.items : [];
          totalItems.value = rawData.data && rawData.data.pagination && rawData.data.pagination.count !== undefined 
                             ? rawData.data.pagination.count 
                             : itemsToMap.length;

          deletedCustomers.value = itemsToMap.map(item => ({
            customer_id: item.customer_id,
            company_name: item.company_name || 'N/A',
            address: item.address || 'N/A',
            email: item.email || 'N/A',
            is_deleted: item.is_deleted || false,
          }));
          
        } else {
          const errorText = await response.text();
          console.error('Errore nel recupero clienti cancellati (risposta non ok):', response.status, errorText);
          error.value = `Errore nel caricamento dei clienti cancellati: ${response.status} - ${errorText}`;
          if (response.status === 401 || response.status === 403) {
            await authStore.logout();
            router.push('/');
          }
        }
      } catch (err) {
        console.error('Errore di rete o del server (catch clienti cancellati):', err);
        error.value = 'Impossibile connettersi al server per i dati dei clienti cancellati. Controlla che il backend sia attivo e le configurazioni CORS.';
      } finally {
        isLoading.value = false;
      }
    };

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
        currentPage.value = page;
        fetchDeletedCustomers();
      }
    };

    const goToPreviousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        fetchDeletedCustomers();
      }
    };

    const goToNextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        fetchDeletedCustomers();
      }
    };

    const closeView = () => {
      emit('close');
    };

    const restoreCustomer = async (customerId) => {
      console.log(`Ripristina cliente con ID: ${customerId}`);
      const payload = {
        is_deleted: false,
      };

      try {
        const response = await fetch(`http://localhost:8000/api/customer/${customerId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authStore.token}`,
            'Content-Type': 'application/json',
            'Updateflag': '1',
            'Language': authStore.selectedLanguage || 'en-EN',
          },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          console.log('Cliente ripristinato con successo!');
          showMessageModal('Successo!', 'Il cliente è stato ripristinato con successo.');
          fetchDeletedCustomers(); // Ricarica la lista dopo il ripristino
        } else {
          const errorText = await response.text();
          console.error(`Errore nel ripristino del cliente: ${response.status} - ${errorText}`);
          showMessageModal('Attenzione!', `Errore nel ripristino del cliente: ${response.status} - ${errorText}`);
        }
      } catch (err) {
        console.error('Errore di rete durante il ripristino del cliente.', err);
        showMessageModal('Attenzione!', 'Errore di rete durante il ripristino del cliente. Controlla la tua connessione.');
      }
    };

    // Funzione per eliminare definitivamente un cliente (chiamata solo dopo conferma)
    const deleteCustomerPermanently = async (customerId) => {
      console.log(`Eseguo eliminazione definitiva per cliente con ID: ${customerId}`);
      try {
        const response = await fetch(`http://localhost:8000/api/customer/${customerId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.token}`,
            'Erasecustomer': '1', // Header specifico per l'eliminazione definitiva
            'Language': authStore.selectedLanguage || 'en-EN',
          },
        });
        if (response.ok) {
          console.log('Cliente eliminato definitivamente!');
          showMessageModal('Successo!', 'Il cliente è stato eliminato definitivamente.');
          fetchDeletedCustomers(); // Ricarica la lista dopo l'eliminazione
        } else {
          const errorText = await response.text();
          console.error(`Errore nell'eliminazione definitiva del cliente: ${response.status} - ${errorText}`);
          showMessageModal('Attenzione!', `Errore nell'eliminazione definitiva del cliente: ${response.status} - ${errorText}`);
        }
      } catch (err) {
          console.error("Errore di rete durante l'eliminazione definitiva del cliente.", err);
          showMessageModal('Attenzione!', `Errore di rete durante l'eliminazione definitiva del cliente. Err: ${err.message || err}`);
      }
    };

    watch(searchQuery, (newVal) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        currentPage.value = 1;
        fetchDeletedCustomers();
      }, 500);
    });

    onMounted(() => {
      fetchDeletedCustomers();
    });

    return {
      deletedCustomers,
      isLoading,
      error,
      currentPage,
      totalPages,
      visiblePageNumbers,
      closeView,
      restoreCustomer,
      confirmDeleteCustomer, // Esposto per il click sul pulsante "Elimina"
      goToPage,
      goToPreviousPage,
      goToNextPage,
      searchQuery,
      showModal,
      modalTitle,
      modalMessage,
      showConfirmModal,
      confirmModalTitle,
      confirmModalMessage,
      handleConfirmDelete, // Esposto per la callback del modale di conferma
    };
  },
};
</script>

<style scoped>
.deleted-customer-overlay {
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
}

.deleted-customer-container {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 95%;
  height: 80%;
  max-width: 1700px;
  max-height: 95%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.header h2 {
  margin: 0;
  color: #007bff;
  font-size: 1.8em;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  /* Rimosso margin-left: auto; per allinearlo meglio con gli altri elementi */
  margin-right: 20px; 
}

/* Stili per l'immagine icona di ricerca */
.search-icon-img {
  position: absolute;
  left: 10px; /* Posiziona l'immagine a sinistra */
  width: 20px; /* Dimensione dell'icona */
  height: 20px;
  opacity: 0.7;
}

.search-input {
  padding: 8px 12px 8px 35px; /* Spazio a sinistra per l'icona */
  border: 1px solid #ccc;
  border-radius: 20px;
  font-size: 1em;
  width: 250px;
  transition: width 0.3s ease, border-color 0.3s ease;
}

.search-input:focus {
  width: 300px;
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.2);
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
.error-message,
.no-results-message {
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

.table-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px 30px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background-color: #e9ecef;
  color: #333;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.9em;
}

tbody tr:hover {
  background-color: #f1f1f1;
}

.actions-cell {
  white-space: nowrap;
}

.action-button {
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: bold;
  transition: background-color 0.2s ease, transform 0.1s ease;
  margin-right: 8px;
}

.action-button:last-child {
  margin-right: 0;
}

.restore-button {
  background-color: #007bff;
  color: white;
}

.restore-button:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.delete-button {
  background-color: #dc3545;
  color: white;
}

.delete-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 15px 0;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.pagination-button {
  padding: 8px 14px;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  background-color: #fff;
  color: #007bff;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  font-weight: bold;
}

.pagination-button:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #0056b3;
}

.pagination-button:disabled {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.pagination-button.active-page {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.pagination-ellipsis {
  padding: 8px 0;
  color: #6c757d;
  font-weight: bold;
}

/* Container per il pulsante di chiusura in basso */
.footer-close-button-container {
  display: flex;
  justify-content: flex-end; /* Allinea a destra */
  padding: 15px 30px;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  border-radius: 0 0 10px 10px; /* Arrotonda gli angoli inferiori del container principale */
}

.footer-close-button {
  background-color: #6c757d; /* Colore grigio per il pulsante di chiusura */
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


@media (max-width: 768px) {
  .deleted-customer-container {
    width: 95%;
    max-height: 95%;
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

  .search-box {
    margin-left: 0; /* Rimuovi auto-margin per mobile */
    margin-right: 0;
    width: 100%; /* Occupa tutta la larghezza disponibile */
    justify-content: center; /* Centra la casella di ricerca */
  }

  .search-input {
    width: 100%; /* Occupa tutta la larghezza */
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
  }

  table, thead, tbody, th, td, tr {
    display: block;
  }

  thead tr {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }

  tr {
    border: 1px solid #e0e0e0;
    margin-bottom: 10px;
    border-radius: 8px;
    overflow: hidden;
  }

  td {
    border: none;
    position: relative;
    padding-left: 50%;
    text-align: right;
  }

  td:before {
    content: attr(data-label);
    position: absolute;
    left: 10px;
    width: 45%;
    padding-right: 10px;
    white-space: nowrap;
    text-align: left;
    font-weight: bold;
    color: #555;
  }

  td:nth-of-type(1):before { content: "ID:"; }
  td:nth-of-type(2):before { content: "Nome:"; }
  td:nth-of-type(3):before { content: "Indirizzo:"; }
  td:nth-of-type(4):before { content: "Email:"; }
  td:nth-of-type(5):before { content: "Cancellato:"; }
  td:nth-of-type(6):before { content: "Azioni:"; }

  .actions-cell {
    text-align: center;
    padding-top: 15px;
    padding-bottom: 15px;
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .footer-close-button-container {
    justify-content: center; /* Centra il pulsante in basso per mobile */
    padding: 15px 20px;
  }
}
</style>