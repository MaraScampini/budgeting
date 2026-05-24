export default defineNuxtConfig({
  compatibilityDate: '2026-05-24',
  modules: ['@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fdzopwrebtktukbpqjlm.supabase.co',
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || '',
    redirect: false
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fdzopwrebtktukbpqjlm.supabase.co',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || ''
    }
  },
  app: {
    head: {
      title: 'Mara & Pau Budget',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f7f3ea' }
      ]
    }
  }
})
