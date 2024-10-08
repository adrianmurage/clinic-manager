import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/');
  }
};

const requireDoctor = (req, res, next) => {
  if (req.session.isAuthenticated && req.session.userRole === 'doctor') {
    next();
  } else {
    res.status(403).send('Access denied');
  }
};

const requireReceptionist = (req, res, next) => {
  if (req.session.isAuthenticated && req.session.userRole === 'receptionist') {
    next();
  } else {
    res.status(403).send('Access denied');
  }
};

// GET route to display the add patient form
router.get('/add-patient',requireAuth, requireReceptionist, (req, res) => {
  res.render('add-patient');
});

// POST route to handle form submission
router.post('/add-patient', requireReceptionist, async (req, res) => {
  try {
    const newPatient = req.body;

    // Add a unique ID and timestamp to the patient data
    newPatient.id = Date.now().toString();
    newPatient.createdAt = new Date().toISOString();

    // Path to the JSON file
    const filePath = path.join(__dirname, '..', 'data', 'patients.json');

    // Read existing data from the file
    let patients = [];
    try {
      const data = await fs.readFile(filePath, 'utf8');
      patients = JSON.parse(data);
    } catch (error) {
      // If the file doesn't exist or is empty, we'll start with an empty array
      console.error('Error reading patients file:', error);
    }

    // Add the new patient to the array
    patients.push(newPatient);

    // Write the updated data back to the file
    await fs.writeFile(filePath, JSON.stringify(patients, null, 2));

    // Render the success page with the new patient data
    res.render('patient-added', { patient: newPatient });
  } catch (error) {
    console.error('Error adding patient:', error);
    res.status(500).send('Error adding patient');
  }
});

// GET route for the success page
router.get('/patient-added', (req, res) => {
  res.render('patient-added', { patient: null });
});



export default router;
