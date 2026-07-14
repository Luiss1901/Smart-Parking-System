const { poolPrimary, poolReplica } = require('../config/db');

const getAllBookings = async () => {
    const result = await poolReplica.query('SELECT * FROM bookings');
    return result.rows;
};

const getBookingById = async (id) => {
    const result = await poolReplica.query('SELECT * FROM bookings WHERE id = $1', [id]);
    return result.rows[0];
};

const getBookingsByUser = async (userId) => {
    const result = await poolReplica.query('SELECT * FROM bookings WHERE "userId" = $1', [userId]);
    return result.rows;
};

const createBooking = async (userId, slotId, startTime, endTime) => {
    const result = await poolPrimary.query(
        'INSERT INTO bookings ("userId", "slotId", "startTime", "endTime", status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, slotId, startTime, endTime, 'active']
    );
    return result.rows[0];
};

const cancelBooking = async (id) => {
    const result = await poolPrimary.query(
        "UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *",
        [id]
    );
    return result.rows[0];
};

const getOverlappingBookings = async (slotId, excludeBookingId, startTime, endTime) => {
    const result = await poolReplica.query(
        `SELECT * FROM bookings 
         WHERE "slotId" = $1 
         AND id != $2 
         AND status != 'cancelled'
         AND "startTime" < $4 AND "endTime" > $3`,
        [slotId, excludeBookingId, startTime, endTime]
    );
    return result.rows;
};

const updateBookingEndTime = async (id, newEndTime) => {
    const result = await poolPrimary.query(
        'UPDATE bookings SET "endTime" = $1 WHERE id = $2 RETURNING *',
        [newEndTime, id]
    );
    return result.rows[0];
};

module.exports = {
    getAllBookings,
    getBookingById,
    getBookingsByUser,
    createBooking,
    cancelBooking,
    getOverlappingBookings,
    updateBookingEndTime
};
