import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'flag-icons/css/flag-icons.min.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import { currentLanguage } from './i18n'
import App from './App.vue'

const app = createApp(App)
const elementLocale = currentLanguage.value === 'en' ? en : zhCn
app.use(ElementPlus, { locale: elementLocale })
app.mount('#app')
