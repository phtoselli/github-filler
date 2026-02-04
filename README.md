# GitHub Filler

Ferramenta web para gerenciar e personalizar o grafico de contribuicoes do GitHub. Crie padroes, preencha automaticamente com commits e gerencie seu historico de contribuicoes com uma interface visual interativa.

<p align="center">
  <img src="assets/screenshot.png" alt="GitHub Filler - Tela principal" width="100%" />
</p>

---

## Funcionalidades

### Editor Mode

- Grafico de contribuicoes interativo no estilo GitHub
- Ferramentas de pintura: **Cycle**, **Paint** e **Eraser**
- 4 niveis de intensidade de contribuicao
- Selecao em range com `Shift+Click`
- Preenchimento aleatorio com presets (Casual, Intenso, Consistente)
- Configuracao de dias da semana e niveis min/max
- Push de commits diretamente para seu repositorio via SSH

### Grafico Real

- Busca e exibe contribuicoes reais de um repositorio remoto
- Marcacao visual de datas para exclusao
- Exclusao de contribuicoes via reescrita de historico (`git filter-branch`)
- Force push automatico apos limpeza

---

## Tech Stack

| Camada    | Tecnologia                     |
| --------- | ------------------------------ |
| Frontend  | **Vue 3** + **Vite**           |
| Backend   | **Node.js** + **Express**      |
| Linguagem | JavaScript (ES6+)              |
| Auth      | SSH (chave privada)            |
| Monorepo  | **concurrently** (dev scripts) |

---

## Estrutura do Projeto

```
github-filler/
├── package.json                 # Scripts do monorepo
├── frontend/
│   ├── src/
│   │   ├── App.vue              # Layout principal
│   │   ├── components/
│   │   │   ├── ContributionGraph.vue   # Grafico interativo
│   │   │   ├── YearSelector.vue        # Seletor de ano
│   │   │   ├── RandomFill.vue          # Preenchimento aleatorio
│   │   │   ├── SaveButton.vue          # Push para GitHub
│   │   │   ├── DeletePanel.vue         # Painel de exclusao
│   │   │   └── SettingsModal.vue       # Configuracoes
│   │   ├── composables/
│   │   │   └── useGraph.js      # Estado e logica central
│   │   └── utils/
│   │       └── dates.js         # Utilitarios de data
│   └── vite.config.js
└── backend/
    ├── server.js                # Rotas Express
    └── services/
        └── git.js               # Operacoes Git (clone, commit, push)
```

---

## Como Rodar

```bash
# Instalar dependencias
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..

# Rodar frontend + backend simultaneamente
npm run dev
```

O frontend roda em `http://localhost:5173` e o backend em `http://localhost:3001`.

---

## Configuracao

Clique no icone de engrenagem no header para configurar:

- **URL SSH** do repositorio (ex: `git@github.com:user/repo.git`)
- **Chave SSH** privada para autenticacao
- **Nome e email** do autor dos commits
- **Ano de criacao** da conta GitHub (define o range do seletor de anos)

As configuracoes sao salvas no `localStorage` do navegador.

---

## API Endpoints

### `POST /api/generate`

Gera commits e faz push para o repositorio.

```json
{
	"repoUrl": "git@github.com:user/repo.git",
	"sshKey": "-----BEGIN OPENSSH PRIVATE KEY-----...",
	"userName": "User",
	"userEmail": "user@email.com",
	"contributions": { "2024-06-15": 3, "2024-06-16": 1 }
}
```

### `POST /api/fetch-contributions`

Busca contribuicoes existentes no repositorio.

```json
{
	"repoUrl": "git@github.com:user/repo.git",
	"sshKey": "-----BEGIN OPENSSH PRIVATE KEY-----..."
}
```

### `POST /api/delete-contributions`

Remove contribuicoes em datas especificas via reescrita de historico.

```json
{
	"repoUrl": "git@github.com:user/repo.git",
	"sshKey": "-----BEGIN OPENSSH PRIVATE KEY-----...",
	"datesToDelete": ["2024-06-15", "2024-06-16"]
}
```
