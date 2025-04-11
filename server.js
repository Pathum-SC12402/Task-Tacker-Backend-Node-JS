const app = require('./index');
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = server;