import express from 'express';
import path from 'path';
import formRoutes from './routes/routes';

const app = express();
const PORT = 3333;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Use the form routes
app.use('/', formRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});