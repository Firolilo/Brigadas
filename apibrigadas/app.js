const express = require('express');
const app = express();
const brigadaRouter = require('./routes/brigadas');

app.use(express.json());
app.use('/api', brigadaRouter);

app.listen(3000, () => {
    console.log('✅ API escuchando en http://localhost:3001');
});
