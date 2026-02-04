const DEMO_MESSAGE = 'Este é apenas um ambiente de demonstração. Para realizar alterações reais, clone o repositório e execute o projeto localmente.'

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(403).json({ error: DEMO_MESSAGE })
}
