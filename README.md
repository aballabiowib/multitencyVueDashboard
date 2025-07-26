# dashboadVU

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
in code modificare il file launch.json come sotto in questo modo potrete usare il debugger 
di code e per far partire il codice accendere il backend e poi far partire con la freccia
Vue: Start Dev Server (Vite), in questo modo partira il server di sviluppo di vue
e si aprira una finestra del browser dove funzionera l'applicazione la versione di node 
che avete deve essere >= v22.17.1, se non installato installare pinia

// il file launch.json:

{
    "version": "0.2.0",
    "configurations": [
        // Questa configurazione avvia il server di sviluppo e aspetta che sia pronto.
        // NON avvia un browser direttamente.
        {
            "name": "Vue: Start Dev Server (Vite)",
            "request": "launch",
            "type": "node", // Usiamo il debugger Node.js per avviare il processo npm
            "runtimeExecutable": "npm",
            "runtimeArgs": [
                "run",
                "dev"
            ],
            "cwd": "${workspaceFolder}", // Esegui npm run dev dalla radice del progetto
            "console": "integratedTerminal", // Mostra l'output nel terminale integrato di VS Code
            "internalConsoleOptions": "neverOpen",
            "skipFiles": [
                "<node_internals>/**"
            ],
            // serverReadyAction: aspetta che il server sia pronto prima di procedere
            "serverReadyAction": {
                "action": "debugWithChrome", // Azione da eseguire quando il server è pronto
                // Pattern per rilevare che il server è pronto.
                // Vite spesso stampa "Local: http://localhost:PORT/" o "ready in X ms"
                "pattern": "Local:\\s*(https?://localhost:[0-9]+)", // Cattura l'URL del server
                "uriFormat": "%s", // Usa l'URL catturato
                "webRoot": "${workspaceFolder}/src" // La radice del tuo progetto web
            }
        },
        // Configurazione per il Debug su Chrome (si connette a un server già avviato)
        {
            "name": "Vue: Debug Chrome (Connect)",
            "request": "attach", // 'attach' invece di 'launch' perché il server è già avviato
            "type": "chrome",
            "port": 9222, // Porta di default per il debugging remoto di Chrome
            "urlFilter": "http://localhost:5173/*", // Filtra l'URL per la connessione (o la porta effettiva)
            "webRoot": "${workspaceFolder}/src",
            "sourceMapPathOverrides": {
                "webpack:///./src/*": "${webRoot}/*",
                "webpack:///src/*": "${webRoot}/*",
                "http://localhost:5173/src/*": "${webRoot}/*",
                "http://localhost:5173/@fs/*": "${webRoot}/*"
            }
        },
        // Configurazione per il Debug su Edge (si connette a un server già avviato)
        {
            "name": "Vue: Debug Edge (Connect)",
            "request": "attach",
            "type": "msedge",
            "port": 9222,
            "urlFilter": "http://localhost:5173/*", // Filtra l'URL per la connessione (o la porta effettiva)
            "webRoot": "${workspaceFolder}/src",
            "sourceMapPathOverrides": {
                "webpack:///./src/*": "${webRoot}/*",
                "webpack:///src/*": "${webRoot}/*",
                "http://localhost:5173/src/*": "${webRoot}/*",
                "http://localhost:5173/@fs/*": "${webRoot}/*"
            }
        }
    ],
    // Configurazioni Compound per avviare il server e poi il browser
    "compounds": [
        {
            "name": "Vue: Debug Chrome (Compound)",
            "configurations": [
                "Vue: Start Dev Server (Vite)",
                "Vue: Debug Chrome (Connect)"
            ],
            "stopAll": true // Ferma tutti i processi quando il debug termina
        },
        {
            "name": "Vue: Debug Edge (Compound)",
            "configurations": [
                "Vue: Start Dev Server (Vite)",
                "Vue: Debug Edge (Connect)"
            ],
            "stopAll": true
        }
    ]
}
