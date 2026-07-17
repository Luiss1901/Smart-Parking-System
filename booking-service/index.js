const app = require('./src/app');
const { initDb } = require('./src/config/db');

setTimeout(initDb, 5000);

const { initSubscribers } = require('./src/subscribers/paymentSubscriber');
initSubscribers();

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Booking service running on port ${PORT}`);
});
