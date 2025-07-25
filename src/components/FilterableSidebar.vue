<template>
  <div class="filterable-sidebar">
    <!-- Sezione Superiore: Ricerca e Ordinamento -->
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

    <!-- Sezione Principale: Lista Scorrevole degli Elementi -->
    <div class="sidebar-content-list">
      <div 
        v-for="item in sortedItems" 
        :key="item[itemKey]" 
        :id="`item_${item[itemKey]}`"
        class="item-element"
        :class="{ 'selected-item': item[itemKey] === selectedItemId }"
        @click="selectItem(item)"
      >
        <div class="item-row">
          <div class="item-icon">
            <!-- Icon or Logo -->
            <template v-if="item[logoKey] && item[logoContentTypeKey]">
              <img :src="`data:${item[logoContentTypeKey]};base64, ${item[logoKey]}`" class="item-logo" alt="logo"/>
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
import { ref, computed } from 'vue'; // Import ref and computed from Composition API

export default {
  name: 'FilterableSidebar',
  props: {
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    itemKey: { // Unique key for the item (e.g., 'customer_id', 'location_id')
      type: String,
      required: true
    },
    displayKey: { // Key for the main text (e.g., 'company_name', 'location_name')
      type: String,
      required: true
    },
    machineCountKey: { // Key for the number of associated machines/elements (e.g., 'total_machines')
      type: String,
      default: null // Can be optional if not all lists have this data
    },
    logoKey: { // Key for the base64 logo (e.g., 'logo_base64')
      type: String,
      default: null
    },
    logoContentTypeKey: { // Key for the logo content type (e.g., 'logo_content')
      type: String,
      default: null
    },
    canDelete: { // Allows displaying the delete button
      type: Boolean,
      default: false
    },
    labelSingular: { // Singular label for the count (e.g., 'machine')
      type: String,
      default: 'elemento'
    },
    labelPlural: { // Plural label for the count (e.g., 'elements')
      type: String,
      default: 'elementi'
    }
  },
  emits: ['item-selected', 'item-deleted'], // Defines events the component can emit

  setup(props, { emit }) {
    const searchQuery = ref('');
    const sortOrder = ref('asc'); // 'asc' for ascending, 'desc' for descending
    const selectedItemId = ref(null); // To track the selected item

    // Filters items based on search query
    const filteredItems = computed(() => {
      if (!searchQuery.value) {
        return props.items;
      }
      const query = searchQuery.value.toLowerCase();
      return props.items.filter(item => 
        item[props.displayKey] && item[props.displayKey].toLowerCase().includes(query)
      );
    });

    // Sorts filtered items
    const sortedItems = computed(() => {
      const itemsCopy = [...filteredItems.value]; // Create a copy to avoid modifying the original array
      if (!props.displayKey) {
        return itemsCopy; // Cannot sort without a display key
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

    // Toggles sort order
    const toggleSortOrder = () => {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    };

    // Handles item selection
    const selectItem = (item) => {
      selectedItemId.value = item[props.itemKey];
      emit('item-selected', item); // Emits the event with the selected item
    };

    // Handles item deletion
    const deleteItem = (item) => {
      if (confirm(`Sei sicuro di voler eliminare "${item[props.displayKey]}"?`)) {
        emit('item-deleted', item[props.itemKey]); // Emits the event with the ID of the item to delete
      }
    };

    // Label for machine count (singular/plural)
    const machineLabel = (count) => {
      if (props.machineCountKey === null) return ''; // If key is not provided
      return count === 1 ? props.labelSingular : props.labelPlural;
    };

    return {
      searchQuery,
      sortOrder,
      selectedItemId,
      filteredItems, // Not strictly necessary to expose, but useful for debugging
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
  width: 100%; /* Occupies available width in its container */
  height: 100%; /* Occupies available height */
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa; /* Light background for the inner sidebar */
  border-right: 1px solid #e0e0e0; /* Light right border */
  box-shadow: 1px 0 5px rgba(0, 0, 0, 0.05); /* Light shadow */
}

.sidebar-header-controls {
  padding: 15px;
  display: flex;
  gap: 10px;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
}

.search-input {
  flex-grow: 1; /* Occupies available space */
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
  flex-grow: 1; /* Occupies all remaining vertical space */
  overflow-y: auto; /* Adds vertical scrollbar */
  padding: 10px;
  height: 0; /* Crucial for overflow-y to work in a flex container */
}

/* Styles for the scrollbar (Webkit browsers) */
.sidebar-content-list::-webkit-scrollbar {
  width: 8px; /* Scrollbar width */
}

.sidebar-content-list::-webkit-scrollbar-track {
  background: #f1f1f1; /* Track background color */
  border-radius: 10px;
}

.sidebar-content-list::-webkit-scrollbar-thumb {
  background: #888; /* Scrollbar thumb color */
  border-radius: 10px;
}

.sidebar-content-list::-webkit-scrollbar-thumb:hover {
  background: #555; /* Color on hover */
}

.item-element {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 7px; /* Matches user snippet border-radius */
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
  background-color: #e0f0ff; /* Color for selected item */
  border-color: #007bff;
  box-shadow: 0 0 0 2px #007bff; /* More prominent blue border */
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px; /* Space between columns */
}

.item-icon {
  flex-shrink: 0; /* Prevents icon from shrinking */
  width: 40px; /* Fixed size for icon/logo */
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  /* Removed: border-radius: 50%; to make it square */
  background-color: #e9ecef; /* Background for default icon */
  /* Removed: Debugging border */
  /* border: 1px solid blue; */ 
}

.item-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  /* Removed: border-radius: 50%; to make it square */
  /* Removed: Debugging border and background */
  /* border: 1px solid green; */ 
  /* background-color: rgba(255, 0, 0, 0.2); */ 
}

.item-default-icon {
  font-size: 1.5em;
  color: #6c757d;
}

.item-text {
  flex-grow: 1; /* Occupies remaining space */
  overflow: hidden; /* Hides overflowing text */
}

.item-title {
  margin: 0;
  font-size: 1em;
  font-weight: bold;
  color: #333;
  white-space: nowrap; /* Prevents title from wrapping */
  overflow: hidden;
  text-overflow: ellipsis; /* Adds "..." if title is too long */
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
  color: #dc3545; /* Red for delete icon */
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