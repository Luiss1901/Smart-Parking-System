const app = require('./src/app');
const { initDb } = require('./src/config/db');

setTimeout(initDb, 5000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
});
