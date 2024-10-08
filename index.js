import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import patientRoutes from './routes/patientRoutes.js';

const app = express();
const port = 3000;

app.set('view engine', 'hbs');
app.set('views', 'views');
app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Add session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

const users = [
  {
    username: 'doctor',
    passwordHash: '$2b$10$ljnI.t8giNIoQ/Sp/CR6mOmdJLD2CCCXRkx.5wNnF/UcAKU5uJhOm',
    role: 'doctor'
  },
  {
    username: 'receptionist',
    passwordHash: '$2b$10$ljnI.t8giNIoQ/Sp/CR6mOmdJLD2CCCXRkx.5wNnF/UcAKU5uJhOm', // Same password for simplicity
    role: 'receptionist'
  }
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
  const user = users.find(u => u.username === username);
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    req.session.isAuthenticated = true;
    req.session.userRole = user.role;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

app.get('/dashboard', (req, res) => {
  console.log(req.session.userRole);
  console.log("here")
  if (req.session.userRole === 'doctor') {
    res.render('doctor-dashboard');
  } else if (req.session.userRole === 'receptionist') {
    res.render('receptionist-dashboard');
  } else {
    res.redirect('/login');
  }
});

// // Protected route for viewing patients
// app.get('/patients', requireAuth, (req, res) => {
//   // This route will be implemented in patientRoutes.js
//   res.render('patients', { patients: [] }); // Placeholder
// });

app.use('/', patientRoutes);

app.get('/', (req, res) => {
  res.render('landing');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
