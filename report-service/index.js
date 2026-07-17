const app = require('./src/app');
const { initDb } = require('./src/config/db');

setTimeout(initDb, 5000);

const { initSubscribers } = require('./src/subscribers/reportSubscriber');
initSubscribers();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Report Service running on port ${PORT}`);
});
