import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import { router } from '@/router';
import { useAuthStore } from '@/stores/auth';
import '@/lib/helpers/date';
import '@/lib/echarts';
import '@/style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Inicializa auth — recupera sessão antes de montar (router guard depende disso).
const auth = useAuthStore();
void auth.init().finally(() => {
  app.mount('#app');
});
