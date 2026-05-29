import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/Login.vue'),
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/recuperar-senha',
    name: 'recover',
    component: () => import('@/pages/ForgotPassword.vue'),
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('@/pages/Dashboard.vue') },
      { path: 'transacoes', name: 'transactions', component: () => import('@/pages/Transactions.vue') },
      { path: 'contas', name: 'accounts', component: () => import('@/pages/Accounts.vue') },
      { path: 'planejamento', name: 'planning', component: () => import('@/pages/Planning.vue') },
      { path: 'cofrinhos', name: 'goals', component: () => import('@/pages/Goals.vue') },
      { path: 'cartoes', name: 'credit-cards', component: () => import('@/pages/CreditCards.vue') },
      { path: 'contas-fixas', name: 'recurring-bills', component: () => import('@/pages/RecurringBills.vue') },
      { path: 'categorias', name: 'categories', component: () => import('@/pages/Categories.vue') },
      { path: 'configuracoes', name: 'settings', component: () => import('@/pages/Settings.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'dashboard' } },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard global (seção 8): sem sessão → /login; com sessão em /login → /.
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.ready) await auth.init();
  const isPublic = to.meta.public === true;

  if (!auth.isAuthenticated && !isPublic) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (auth.isAuthenticated && isPublic) {
    return { name: 'dashboard' };
  }
  return true;
});
