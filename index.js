import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import patientRoutes from './routes/patientRoutes.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import moment from 'moment';
import hbs from 'hbs';  

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.set('view engine', 'hbs');
app.set('views', 'views');
app.use(express.static('public'));

hbs.registerHelper('formatDate', (date) => {
  return moment(date).format('YYYY-MM-DD');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Add session middleware
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

const users = [
  {
    username: 'doctor',
    passwordHash:
      '$2b$10$ljnI.t8giNIoQ/Sp/CR6mOmdJLD2CCCXRkx.5wNnF/UcAKU5uJhOm',
    role: 'doctor',
  },
  {
    username: 'receptionist',
    passwordHash:
      '$2b$10$ljnI.t8giNIoQ/Sp/CR6mOmdJLD2CCCXRkx.5wNnF/UcAKU5uJhOm', // Same password for simplicity
    role: 'receptionist',
  },
];

// Authentication middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.session.isAuthenticated && req.session.userRole === role) {
      next();
    } else {
      res.status(403).send('Access denied');
    }
  };
};

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    req.session.isAuthenticated = true;
    req.session.userRole = user.role;
    res.redirect('/dashboard');
  } else {
    res.render('landing', { error: 'Invalid credentials' });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

app.get('/dashboard', async (req, res) => {
  const patients = await fetchPatients();

  if (req.session.userRole === 'doctor') {
    res.render('doctor-dashboard', { patients });
  } else if (req.session.userRole === 'receptionist') {
    res.render('receptionist-dashboard', { patients });
  } else {
    res.redirect('/');
  }
});

async function fetchPatients() {
  try {
    const filePath = path.join(__dirname, 'data', 'patients.json');
    const data = await fs.readFile(filePath, 'utf8');
    const patients = JSON.parse(data);

    return patients;
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
}

app.use('/', patientRoutes);

app.get('/', (req, res) => {
  if (req.session.isAuthenticated) {
    res.redirect('/dashboard');
  } else {
    res.render('landing');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
