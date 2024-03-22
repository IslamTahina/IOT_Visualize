import App from './App.vue'
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';

import 'primevue/resources/themes/lara-light-green/theme.css'
import 'primeicons/primeicons.css'

const app = createApp(App)
app.use(PrimeVue);
app.mount('#app')