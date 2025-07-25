<!-- src/components/dashboard-views/ProfileView.vue -->
<template>
  <div class="profile-view-container">
    <div class="profile-header">
      <h2>Il Mio Profilo</h2>
    </div>

    <!-- Contenuto principale del profilo -->
    <div class="profile-content-wrapper">
      <div class="profile-forms-grid">
        <!-- Sezione Sinistra: Dati del Profilo Modificabili -->
        <form @submit.prevent="saveProfile" class="profile-data-section">
          <h3>Informazioni Utente</h3>
          <div class="input-field-group">
            <label for="nome">Nome:</label>
            <input 
              type="text" 
              id="nome" 
              v-model="profile.nome"
              :class="{ 'is-valid': isNomeValid, 'is-invalid': !isNomeValid && profile.nome !== '' }"
              autocomplete="given-name"
            >
            <p v-if="!isNomeValid && profile.nome !== ''" class="validation-feedback">
              Nome non valido. Usa solo lettere, spazi e trattini.
            </p>
          </div>
          <div class="input-field-group">
            <label for="cognome">Cognome:</label>
            <input 
              type="text" 
              id="cognome" 
              v-model="profile.cognome"
              :class="{ 'is-valid': isCognomeValid, 'is-invalid': !isCognomeValid && profile.cognome !== '' }"
              autocomplete="family-name"
            >
            <p v-if="!isCognomeValid && profile.cognome !== ''" class="validation-feedback">
              Cognome non valido. Usa solo lettere, spazi e trattini.
            </p>
          </div>
          <div class="input-field-group">
            <label for="username">Username:</label>
            <input 
              type="email"
              id="username" 
              v-model="profile.username"
              :class="{ 'is-valid': isUsernameValid, 'is-invalid': !isUsernameValid && profile.username !== '' }"
              autocomplete="email"
            >
            <p v-if="!isUsernameValid && profile.username !== ''" class="validation-feedback">
              Username non valido (deve essere un'email).
            </p>
          </div>
          <div class="input-field-group">
            <label for="telefono">Telefono:</label>
            <input 
              type="text" 
              id="telefono" 
              v-model="profile.telefono"
              :class="{ 'is-valid': isTelefonoValid, 'is-invalid': !isTelefonoValid && profile.telefono !== '' }"
              autocomplete="tel"
            >
            <p v-if="!isTelefonoValid && profile.telefono !== ''" class="validation-feedback">
              Formato telefono non valido.
            </p>
          </div>
          <div class="input-field-group">
            <label for="mobile">Mobile:</label>
            <input 
              type="text" 
              id="mobile" 
              v-model="profile.mobile"
              :class="{ 'is-valid': isMobileValid, 'is-invalid': !isMobileValid && profile.mobile !== '' }"
              autocomplete="tel-mobile"
            >
            <p v-if="!isMobileValid && profile.mobile !== ''" class="validation-feedback">
              Formato mobile non valido.
            </p>
          </div>
          <div class="input-field-group">
            <label for="fax">Fax:</label>
            <input 
              type="text" 
              id="fax" 
              v-model="profile.fax"
              :class="{ 'is-valid': isFaxValid, 'is-invalid': !isFaxValid && profile.fax !== '' }"
              autocomplete="tel-fax"
            >
            <p v-if="!isFaxValid && profile.fax !== ''" class="validation-feedback">
              Formato fax non valido.
            </p>
          </div>
          
          <button type="submit" :disabled="!isProfileFormValid" class="save-profile-button">
            Aggiorna profilo
          </button>

          <!-- <ValidationLegend /> Rimosso da qui -->
        </form>

        <!-- Sezione Destra: Cambio Password -->
        <form @submit.prevent="changePassword" class="password-change-section">
          <h3>Cambia Password</h3>
          <div class="input-field-group">
            <label for="newPassword">Nuova Password:</label>
            <input 
              type="password" 
              id="newPassword" 
              v-model="passwordForm.newPassword"
              :class="{ 'is-valid': isNewPasswordValid, 'is-invalid': !isNewPasswordValid && passwordForm.newPassword !== '' }"
              autocomplete="new-password" 
            >
            <p v-if="!isNewPasswordValid && passwordForm.newPassword !== ''" class="validation-feedback">
              Min. 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero, 1 segno.
            </p>
          </div>
          <div class="input-field-group">
            <label for="confirmPassword">Ripeti Password:</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="passwordForm.confirmPassword"
              :class="{ 'is-valid': isPasswordMatch && passwordForm.confirmPassword !== '' && isNewPasswordValid, 'is-invalid': !isPasswordMatch && passwordForm.confirmPassword !== '' }"
              autocomplete="new-password" 
            >
            <p v-if="!isPasswordMatch && passwordForm.confirmPassword !== ''" class="validation-feedback">
              Le password non corrispondono.
            </p>
          </div>
          
          <button type="submit" :disabled="!isPasswordFormValid" class="change-password-button">
            Cambia Password
          </button>

          <!-- <ValidationLegend /> Rimosso da qui -->
        </form>
      </div>

      <!-- La singola istanza della legenda in fondo al wrapper del contenuto -->
      <ValidationLegend /> 
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { nameRegex, phoneRegex, passwordRegex, emailRegex } from '@/utils/regex';
import ValidationLegend from '@/components/ValidationLegend.vue';

export default {
  name: 'ProfileView',
  components: {
    ValidationLegend
  },
  setup() {
    const authStore = useAuthStore();

    const profile = ref({
      nome: '',
      cognome: '',
      username: '',
      telefono: '',
      mobile: '',
      fax: '',
    });

    const passwordForm = ref({
      newPassword: '',
      confirmPassword: '',
    });

    const isNomeValid = computed(() => nameRegex.test(profile.value.nome));
    const isCognomeValid = computed(() => nameRegex.test(profile.value.cognome));
    const isUsernameValid = computed(() => profile.value.username === '' || emailRegex.test(profile.value.username)); 
    const isTelefonoValid = computed(() => profile.value.telefono === '' || phoneRegex.test(profile.value.telefono));
    const isMobileValid = computed(() => profile.value.mobile === '' || phoneRegex.test(profile.value.mobile));
    const isFaxValid = computed(() => profile.value.fax === '' || phoneRegex.test(profile.value.fax));

    const isProfileFormValid = computed(() => {
      return (
        isNomeValid.value &&
        isCognomeValid.value &&
        isUsernameValid.value &&
        isTelefonoValid.value &&
        isMobileValid.value &&
        isFaxValid.value &&
        profile.value.nome !== '' && 
        profile.value.cognome !== '' &&
        profile.value.username !== ''
      );
    });

    const isNewPasswordValid = computed(() => passwordRegex.test(passwordForm.value.newPassword));
    const isPasswordMatch = computed(() => 
      passwordForm.value.newPassword === passwordForm.value.confirmPassword && passwordForm.value.newPassword !== ''
    );

    const isPasswordFormValid = computed(() => {
      return (
        isNewPasswordValid.value &&
        isPasswordMatch.value &&
        passwordForm.value.newPassword !== ''
      );
    });

    const initializeProfile = () => {
      if (authStore.user) {
        profile.value.nome = authStore.user.name || '';
        profile.value.cognome = authStore.user.surname || '';
        profile.value.username = authStore.user.username || '';
        profile.value.telefono = authStore.user.phone || '';
        profile.value.mobile = authStore.user.mobile || '';
        profile.value.fax = authStore.user.fax || '';
      }
    };

    watch(() => authStore.user, (newUser) => {
      if (newUser) {
        initializeProfile();
      }
    }, { immediate: true });

    const saveProfile = async () => {
      if (!isProfileFormValid.value) {
        alert('Per favore, correggi gli errori nel form del profilo.');
        return;
      }
      console.log('Salvataggio profilo:', profile.value);
      alert('Profilo aggiornato con successo (simulato)!');
      authStore.user = { ...authStore.user, ...profile.value };
    };

    const changePassword = async () => {
      if (!isPasswordFormValid.value) {
        alert('Per favora, correggi gli errori nel form della password.');
        return;
      }
      console.log('Cambio password per utente:', authStore.user.username);
      console.log('Nuova password:', passwordForm.value.newPassword);
      alert('Password cambiata con successo (simulato)!');
      passwordForm.value.newPassword = '';
      passwordForm.value.confirmPassword = '';
    };

    return {
      profile,
      passwordForm,
      isNomeValid,
      isCognomeValid,
      isUsernameValid,
      isTelefonoValid,
      isMobileValid,
      isFaxValid,
      isProfileFormValid,
      isNewPasswordValid,
      isPasswordMatch,
      isPasswordFormValid,
      saveProfile,
      changePassword,
    };
  }
};
</script>

<style scoped>
.profile-view-container {
  padding: 5px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  /* NUOVO: Queste proprietà sono cruciali per lo scroll interno */
  height: 100%; /* Occupa il 100% dell'altezza disponibile dal main-content */
  overflow-y: auto; /* Aggiunge la scrollbar se il contenuto supera l'altezza */
  display: flex; /* Rendi il contenitore flex per impilare header e wrapper */
  flex-direction: column;
}

.profile-header {
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0; /* Impedisce all'header di restringersi */
}

.profile-header h2 {
  color: #007bff;
  font-size: 2.2em;
  margin: 0;
}

.profile-content-wrapper { /* Wrapper per il layout principale */
  display: flex;
  flex-direction: column; /* Impila la griglia dei form e la legenda */
  gap: 5px; /* Spazio tra i blocchi principali */
  flex-grow: 1; /* Permette al wrapper di occupare lo spazio rimanente */
  min-height: 0; /* Cruciale per permettere lo scroll di un flex-grow:1 item */
}

.profile-forms-grid { /* Contenitore per i due form (profilo e password) */
  display: grid;
  grid-template-columns: 1fr 1fr; /* Due colonne di uguale larghezza */
  gap: 40px; /* Spazio tra le sezioni */
}

.profile-data-section,
.password-change-section {
  background-color: #ffffff;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.profile-data-section h3,
.password-change-section h3 {
  color: #007bff;
  font-size: 1.6em;
  margin-top: 0;
  margin-bottom: 25px;
  border-bottom: 1px dashed #e0e0e0;
  padding-bottom: 10px;
}

.input-field-group {
  margin-bottom: 20px;
}

.input-field-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #555;
  font-size: 0.95em;
}

.input-field-group input[type="text"],
.input-field-group input[type="email"],
.input-field-group input[type="password"] {
  width: calc(100% - 24px);
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-field-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.25);
}

/* Stili per la validazione */
.input-field-group input.is-valid {
  border-color: #28a745; /* Verde */
  box-shadow: 0 0 5px rgba(40, 167, 69, 0.25);
}

.input-field-group input.is-invalid {
  border-color: #dc3545; /* Rosso */
  box-shadow: 0 0 5px rgba(220, 53, 69, 0.25);
}

.validation-feedback {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 5px;
}

.save-profile-button,
.change-password-button {
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

.save-profile-button:hover,
.change-password-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.save-profile-button:disabled,
.change-password-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
}

/* Media Query per layout a colonna su schermi piccoli */
@media (max-width: 768px) {
  .profile-forms-grid {
    grid-template-columns: 1fr; /* Una singola colonna su schermi più piccoli */
    gap: 30px;
  }
}
</style>