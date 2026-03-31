import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'flag-icons/css/flag-icons.min.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
