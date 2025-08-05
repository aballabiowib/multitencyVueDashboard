<template>
  <div class="filterable-sidebar">
    <div class="sidebar-header-controls">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Cerca..." 
        class="search-input"
      />
      <button @click="toggleSortOrder" class="sort-button">
        <font-awesome-icon :icon="['fas', sortOrder === 'asc' ? 'sort-alpha-down' : 'sort-alpha-up']" />
      </button>
    </div>

    <div class="sidebar-content-list">
      <div 
        v-for="item in sortedItems" 
        :key="item[itemKey]" 
        :id="`item_${item[itemKey]}`"
        class="item-element"
        :class="{ 'selected-item': internalSelectedItemId === item[itemKey] }" 
        @click="selectItem(item)"
      >
        <div class="item-row">
          <div class="item-icon">
            <template v-if="item[logoKey]"> 
              <img :src="item[logoKey]" class="item-logo" :alt="`${item[displayKey]} logo`"/>
              </template>
            <template v-else>
              <font-awesome-icon :icon="['fas', 'user-tie']" class="item-default-icon" />
            </template>
          </div>
          <div class="item-text">
            <h6 class="item-title">{{ item[displayKey] }}</h6>
            <p class="item-description">
              {{ item[machineCountKey] }} {{ machineLabel(item[machineCountKey]) }}
            </p>
          </div>
          <div v-if="canDelete" class="item-delete" @click.stop="deleteItem(item)">
            <font-awesome-icon :icon="['far', 'trash-alt']" />
          </div>
        </div>
      </div>
      <p v-if="filteredItems.length === 0" class="no-results">Nessun risultato trovato.</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';

export default {
  name: 'FilterableSidebar',
  props: {
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    itemKey: { // Chiave univoca per l'elemento (es. 'customer_id')
      type: String,
      required: true
    },
    displayKey: { // Chiave per il testo principale (es. 'company_name')
      type: String,
      required: true
    },
    machineCountKey: { // Chiave per il numero di macchine/elementi associati
      type: String,
      default: null 
    },
    logoKey: { // **MODIFICATO**: Ora è la chiave per l'URL dell'immagine (es. 'logo_url')
      type: String,
      default: null
    },
    // **RIMOSSO**: logoContentTypeKey non è più necessaria con gli URL diretti
    canDelete: { // Permette di visualizzare il pulsante di eliminazione
      type: Boolean,
      default: false
    },
    labelSingular: { // Etichetta singolare per il conteggio (es. 'macchina')
      type: String,
      default: 'elemento'
    },
    labelPlural: { // Etichetta plurale per il conteggio (es. 'macchine')
      type: String,
      default: 'elementi'
    },
    // Prop per il v-model dell'elemento selezionato
    selectedItem: {
      type: Object,
      default: null
    }
  },
  emits: ['item-selected', 'item-deleted', 'update:selectedItem'], 

  setup(props, { emit }) {
    const searchQuery = ref('');
    const sortOrder = ref('asc'); 
    const internalSelectedItemId = ref(null); 

    // Inizializza internalSelectedItemId dalla prop all'inizio
    onMounted(() => {
      if (props.selectedItem) {
        internalSelectedItemId.value = props.selectedItem[props.itemKey];
      }
    });

    // Watcher per reagire ai cambiamenti della prop selectedItem dal genitore
    watch(() => props.selectedItem, (newVal) => {
      if (newVal) {
        internalSelectedItemId.value = newVal[props.itemKey];
      } else {
        internalSelectedItemId.value = null; // Deseleziona se la prop diventa null
      }
    });

    // Filtra gli elementi in base alla query di ricerca
    const filteredItems = computed(() => {
      if (!searchQuery.value) {
        return props.items;
      }
      const query = searchQuery.value.toLowerCase();
      return props.items.filter(item => 
        item[props.displayKey] && item[props.displayKey].toLowerCase().includes(query)
      );
    });

    // Ordina gli elementi filtrati
    const sortedItems = computed(() => {
      const itemsCopy = [...filteredItems.value]; 
      if (!props.displayKey) {
        return itemsCopy; 
      }

      return itemsCopy.sort((a, b) => {
        const valA = a[props.displayKey] ? String(a[props.displayKey]).toLowerCase() : '';
        const valB = b[props.displayKey] ? String(b[props.displayKey]).toLowerCase() : '';

        if (sortOrder.value === 'asc') {
          return valA.localeCompare(valB);
        } else {
          return valB.localeCompare(valA);
        }
      });
    });

    // Inverte l'ordine di ordinamento
    const toggleSortOrder = () => {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    };

    // Gestisce la selezione di un elemento
    const selectItem = (item) => {
      if (internalSelectedItemId.value === item[props.itemKey]) {
        // Se l'elemento è già selezionato, deselezionalo
        internalSelectedItemId.value = null;
        emit('update:selectedItem', null); 
        emit('item-selected', null); 
      } else {
        // Altrimenti, seleziona il nuovo elemento
        internalSelectedItemId.value = item[props.itemKey];
        emit('update:selectedItem', item); 
        emit('item-selected', item); 
      }
    };

    // Gestisce l'eliminazione di un elemento
    const deleteItem = (item) => {
      if (confirm(`Sei sicuro di voler eliminare "${item[props.displayKey]}"?`)) {
        emit('item-deleted', item[props.itemKey]); 
        // Se l'elemento eliminato era quello selezionato, deselezionalo
        if (internalSelectedItemId.value === item[props.itemKey]) {
          internalSelectedItemId.value = null;
          emit('update:selectedItem', null);
        }
      }
    };

    // Etichetta per il conteggio delle macchine (singolare/plurale)
    const machineLabel = (count) => {
      if (props.machineCountKey === null || count === undefined || count === null) return '';
      return count === 1 ? props.labelSingular : props.labelPlural;
    };

    return {
      searchQuery,
      sortOrder,
      internalSelectedItemId, 
      filteredItems, 
      sortedItems,
      toggleSortOrder,
      selectItem,
      deleteItem,
      machineLabel,
    };
  }
};
</script>

<style scoped>
.filterable-sidebar {
  width: 100%; 
  height: 100%; 
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa; 
  border-right: 1px solid #e0e0e0; 
  box-shadow: 1px 0 5px rgba(0, 0, 0, 0.05); 
}

.sidebar-header-controls {
  padding: 15px;
  display: flex;
  gap: 10px;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
}

.search-input {
  flex-grow: 1; 
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 0.95em;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.2);
}

.sort-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.sort-button:hover {
  background-color: #0056b3;
}

.sidebar-content-list {
  flex-grow: 1; 
  overflow-y: auto; 
  padding: 10px;
  height: 0; 
}

/* Stili per la scrollbar (Webkit browsers) */
.sidebar-content-list::-webkit-scrollbar {
  width: 8px; 
}

.sidebar-content-list::-webkit-scrollbar-track {
  background: #f1f1f1; 
  border-radius: 10px;
}

.sidebar-content-list::-webkit-scrollbar-thumb {
  background: #888; 
  border-radius: 10px;
}

.sidebar-content-list::-webkit-scrollbar-thumb:hover {
  background: #555; 
}

.item-element {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 7px; 
  margin-bottom: 10px;
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.item-element:hover {
  background-color: #f0f0f0;
  border-color: #c0c0c0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-element.selected-item {
  background-color: #e0f0ff; 
  border-color: #007bff;
  box-shadow: 0 0 0 2px #007bff; 
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px; 
}

.item-icon {
  flex-shrink: 0; 
  width: 40px; 
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e9ecef; 
}

.item-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-default-icon {
  font-size: 1.5em;
  color: #6c757d;
}

.item-text {
  flex-grow: 1; 
  overflow: hidden; 
}

.item-title {
  margin: 0;
  font-size: 1em;
  font-weight: bold;
  color: #333;
  white-space: nowrap; 
  overflow: hidden;
  text-overflow: ellipsis; 
}

.item-description {
  margin: 0;
  font-size: 0.85em;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-delete {
  flex-shrink: 0;
  color: #dc3545; 
  cursor: pointer;
  font-size: 1.1em;
  transition: color 0.2s ease, transform 0.2s ease;
}

.item-delete:hover {
  color: #c82333;
  transform: scale(1.1);
}

.no-results {
  text-align: center;
  color: #888;
  padding: 20px;
}
</style>