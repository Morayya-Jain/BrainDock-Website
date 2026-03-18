import { resolve } from 'path'
import { defineConfig } from 'vite'

const posthogSnippet = `<script>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identify setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags resetGroups onFeatureFlags addFeatureFlagsHandler onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_bfW8oeBxSNfHSQsR1pM2sxiVDNu3VtZWoJ2vyyrac52', {
        api_host: 'https://us.i.posthog.com',
        defaults: '2026-01-30'
    })
</script>`

export default defineConfig({
  // Rewrite "/" to "/index.html" so public/index.html serves as the landing page
  plugins: [
    {
      name: 'serve-public-index',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            req.url = '/index.html'
          }
          next()
        })
      },
    },
    {
      name: 'inject-posthog',
      transformIndexHtml(html) {
        return html.replace('</head>', `${posthogSnippet}\n</head>`)
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'auth/login/index.html'),
        signup: resolve(__dirname, 'auth/signup/index.html'),
        callback: resolve(__dirname, 'auth/callback/index.html'),
        forgotPassword: resolve(__dirname, 'auth/forgot-password/index.html'),
        resetPassword: resolve(__dirname, 'auth/reset-password/index.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html'),
        settingsConfiguration: resolve(__dirname, 'settings/blocklist/index.html'),
        settingsDevices: resolve(__dirname, 'settings/devices/index.html'),
        sessions: resolve(__dirname, 'sessions/index.html'),
        sessionDetail: resolve(__dirname, 'sessions/detail/index.html'),
        account: resolve(__dirname, 'account/index.html'),
        accountSubscription: resolve(__dirname, 'account/subscription/index.html'),
        pricing: resolve(__dirname, 'pricing/index.html'),
        howToUse: resolve(__dirname, 'how-to-use/index.html'),
        download: resolve(__dirname, 'download/index.html'),
      },
    },
  },
})
