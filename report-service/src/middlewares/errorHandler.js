const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.stack || err.message || err}`);
    
    const statusCode = err.status || res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode === 200 ? 500 : statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;
