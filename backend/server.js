const express = require('express')
const cors = require('cors')
const { generateCommits, fetchContributions, deleteContributions } = require('./services/git')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.post('/api/generate', async (req, res) => {
  const { repoUrl, sshKey, userName, userEmail, contributions } = req.body

  if (!repoUrl || !sshKey || !userName || !userEmail || !contributions) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' })
  }

  if (Object.keys(contributions).length === 0) {
    return res.status(400).json({ error: 'Nenhuma contribuição para gerar.' })
  }

  try {
    const result = await generateCommits({
      repoUrl,
      sshKey,
      userName,
      userEmail,
      contributions
    })
    res.json(result)
  } catch (err) {
    console.error('Erro ao gerar commits:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/fetch-contributions', async (req, res) => {
  const { repoUrl, sshKey } = req.body

  if (!repoUrl || !sshKey) {
    return res.status(400).json({ error: 'Repositório e chave SSH são obrigatórios.' })
  }

  try {
    const result = await fetchContributions({ repoUrl, sshKey })
    res.json(result)
  } catch (err) {
    console.error('Erro ao buscar contribuições:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/delete-contributions', async (req, res) => {
  const { repoUrl, sshKey, datesToDelete } = req.body

  if (!repoUrl || !sshKey || !datesToDelete || datesToDelete.length === 0) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' })
  }

  try {
    const result = await deleteContributions({ repoUrl, sshKey, datesToDelete })
    res.json(result)
  } catch (err) {
    console.error('Erro ao deletar contribuições:', err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
})
