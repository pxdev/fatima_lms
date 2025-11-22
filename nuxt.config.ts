// https://nuxt.com/docs/api/configuration/nuxt-config
import {APP_INFO} from "./shared/utils/site";

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: false},
    components: [
        {
            path: '~/components',
            pathPrefix: false,
        },
    ],
    app: {
        head: {
            charset: "utf-8",
            viewport: "width=device-width, initial-scale=1",
            meta: [
                {name: "robots", content: "index, follow"},
                {property: "og:ttl", content: "604800"},
                {property: "og:site_name", content: APP_INFO.name}
            ],
        }
    },
    modules: [
        '@nuxt/eslint',
        '@nuxt/ui',
        '@vueuse/nuxt',
        "nuxt-auth-utils",
        '@nuxtjs/i18n',
        "@nuxt/fonts",
        "@nuxt/icon",
        '@nuxt/image',
        '@vueuse/motion/nuxt',
        'nuxt-directus'
    ],
    runtimeConfig: {
        public: {
            directus: {
                url: "",
                autoFetch: true,
                autoRefresh: true
            }
        },
    },
    css: ['~/assets/css/main.css'],
    icon: {
        mode: "svg",
        clientBundle: {
            scan: true,
            sizeLimitKb: 2048
        },
        customCollections: [
            {
                prefix: 'local',
                dir: './assets/icons',
            },
        ],
    },
    i18n: {
        defaultLocale: 'en',
        langDir: 'locales/',
        locales: [
            {
                code: 'en',
                iso: 'en-US',
                flag: 'flag:us-4x3',
                dir: 'ltr',
                name: 'English',
                file: 'en.js',
            },
        ],
    },
    ui: {
        colorMode: false
    },
    fonts: {
        families: [
            {name: "Rubik", provider: "google", global: true, weights: [400, 500, 600, 700]}
        ],
        experimental: {
            disableLocalFallbacks: true
        }
    },
})
