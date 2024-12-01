const express = require('express');
const mongoose = require('mongoose');

require('dotenv').config();
const userRoutes = require('./Routes/RouteUser');
const eventRoutes = require('./Routes/RouteEvent');
const comYLikesRoutes = require('./Routes/RouterComYLIkes');
const compraRoutes = require('./Routes/RouteCompras');
const app = express();
const port = process.env.PORT || 3000;
const CORS = require('cors');

app.use(CORS(
    {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    
    }
));

// Middleware
app.use(express.static("public/img"))

app.use(express.json());
app.use('/api', userRoutes);
app.use('/api', eventRoutes);
app.use('/api', comYLikesRoutes);
app.use('/api', compraRoutes);

// Routes
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Connect to the database
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to the database');
}).catch((error) => {
    console.error('Error connecting to the database:', error);
});

app.listen(port, () => {
    console.log('Server listening on port', port);  
});
