// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/components/LoginPage.vue';
import Dashboard from '@/components/Dashboard.vue';

// Importa le viste della dashboard
import ProfileView from '@/components/dashboard-views/ProfileView.vue';
import SettingsView from '@/components/dashboard-views/SettingsView.vue';
import ReportsView from '@/components/dashboard-views/ReportsView.vue';
import CustomerView from '@/components/dashboard-views/CustomerView.vue';
import LocationView from '@/components/dashboard-views/LocationView.vue';
import AdministratorView from '@/components/dashboard-views/AdministrationView.vue';
import AlarmView from '@/components/dashboard-views/AlarmView.vue';
import EventView from '@/components/dashboard-views/EventView.vue';
import MachineView from '@/components/dashboard-views/MachineView.vue';
import DbMaintenance from '@/components/dashboard-views/DbMaintenanceView.vue';

import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Login',
      component: LoginPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'DashboardHome',
          redirect: { name: 'Customers' }
        },
        {
          path: 'customer',
          name: 'Customers',
          component: CustomerView,
          meta: { requiresAuth: true }
        },
        {
          path: 'location',
          name: 'Locations',
          component: LocationView,
          meta: { requiresAuth: true }
        },
        // NUOVO: Rotte per le nuove viste
        {
          path: 'administration', // Percorso: /dashboard/administrators
          name: 'Administrators',
          component: AdministratorView,
          meta: { requiresAuth: true }
        },
        {
          path: 'alarm', // Percorso: /dashboard/alarms
          name: 'Alarms',
          component: AlarmView,
          meta: { requiresAuth: true }
        },
        {
          path: 'event', // Percorso: /dashboard/events
          name: 'Events',
          component: EventView,
          meta: { requiresAuth: true }
        },
        {
          path: 'machine', // Percorso: /dashboard/machines
          name: 'Machines',
          component: MachineView,
          meta: { requiresAuth: true }
        },
        {
          path: 'profile',
          name: 'Profile',
          component: ProfileView,
          meta: { requiresAuth: true }
        },
        {
          path: 'settings',
          name: 'Settings',
          component: SettingsView,
          meta: { requiresAuth: true }
        },
        {
          path: 'reports',
          name: 'Reports',
          component: ReportsView,
          meta: { requiresAuth: true }
        },
        {
          path: 'dbmaintenance',
          name: 'DbMaintenance',
          component: DbMaintenance,
          meta: { requiresAuth: true }
        },
      ]
    }
  ]
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' });
  } else if (!to.meta.requiresAuth && authStore.isAuthenticated) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;