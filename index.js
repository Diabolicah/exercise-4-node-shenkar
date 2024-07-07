require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

const { userRouter } = require('./routers/userRouter');
const { preferencesRouter } = require('./routers/preferencesRouter');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.set('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE");
    res.set('Content-Type', 'application/json');
    next();
});

app.use('/api/users', userRouter);
app.use('/api/preferences', preferencesRouter);

app.use((req, res) => {
    res.status(400).json({ error: 'API Not Found' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});