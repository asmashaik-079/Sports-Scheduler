const express = require('express');
const { getAllSports, createSport, updateSport, deleteSport } = require('../controllers/sportController');
const { isLoggedIn, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', isLoggedIn, getAllSports);
router.post('/', isLoggedIn, isAdmin, createSport);
router.put('/:id', isLoggedIn, isAdmin, updateSport);
router.delete('/:id', isLoggedIn, isAdmin, deleteSport);

module.exports = router;
