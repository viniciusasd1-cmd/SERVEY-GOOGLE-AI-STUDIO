# SURVEY — Hostinger Deployment

## Runtime

Node.js 22.x

## Package manager

npm

## Install

```bash
npm ci
```

## Build

```bash
npm run build
```

## Output

`dist`

## Framework

React + Vite

## Root directory

`/`

## Environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Configure these variables in the Hostinger application panel. They are public Vite client variables required to connect the frontend to the external Supabase project.

Never use `SUPABASE_SERVICE_ROLE_KEY` in the frontend or expose it through a `VITE_` variable. Do not put `GEMINI_API_KEY` in the frontend. Production uses Supabase as an external backend; this repository does not require a persistent Node.js server or Express.

## Primeiro deploy

1. Conectar o repositório do GitHub.
2. Selecionar a branch `main`.
3. Selecionar Node.js 22.x.
4. Selecionar npm.
5. Usar o build command `npm run build`.
6. Usar o output directory `dist`.
7. Adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no painel.
8. Executar o deploy.
9. Abrir a landing page.
10. Testar login.
11. Testar logout.
12. Testar uma chamada ao Supabase.
13. Testar o refresh da página.
14. Verificar o console do navegador.
