// server/server.js
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/track', (req, res) => {
  console.log('Received events:', (req.body.events || []).length);
  // For demo only: don't store sensitive info in plain files in prod
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Receiver listening: http://localhost:3000'));
