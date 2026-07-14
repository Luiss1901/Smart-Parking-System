const { poolPrimary, poolReplica } = require('../config/db');

const getAllPayments = async () => {
    const result = await poolReplica.query('SELECT * FROM payments');
    return result.rows;
};

const getPaymentByTxnRef = async (txnRef) => {
    const result = await poolReplica.query('SELECT * FROM payments WHERE "txnRef" = $1', [txnRef]);
    return result.rows[0];
};

const getPaymentById = async (id) => {
    const result = await poolReplica.query('SELECT * FROM payments WHERE id = $1', [id]);
    return result.rows[0];
};

const getPaymentsByUserId = async (userId) => {
    const result = await poolReplica.query('SELECT * FROM payments WHERE "userId" = $1 ORDER BY id DESC', [userId]);
    return result.rows;
};

const createPayment = async (bookingId, userId, amount, txnRef) => {
    const result = await poolPrimary.query(
        'INSERT INTO payments ("bookingId", "userId", amount, "usdAmount", "exchangeRate", status, "vietQrUrl", "paidAt", "txnRef") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [bookingId, userId, amount, '0', '0', 'PENDING', '', null, txnRef]
    );
    return result.rows[0];
};

const updatePaymentStatus = async (txnRef, status, usdAmount = null, paidAt = null) => {
    let query = 'UPDATE payments SET status = $1';
    let params = [status, txnRef];
    
    if (usdAmount !== null && paidAt !== null) {
        query += ', "usdAmount" = $2, "paidAt" = $3 WHERE "txnRef" = $4 RETURNING *';
        params = [status, usdAmount, paidAt, txnRef];
    } else {
        query += ' WHERE "txnRef" = $2 RETURNING *';
    }
    
    const result = await poolPrimary.query(query, params);
    return result.rows[0];
};

module.exports = {
    getAllPayments,
    getPaymentById,
    getPaymentByTxnRef,
    getPaymentsByUserId,
    createPayment,
    updatePaymentStatus
};
