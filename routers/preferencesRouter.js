const { Router }  = require('express');
const { preferencesController } = require('../controllers/preferencesController');

const preferencesRouter = Router();

preferencesRouter.get('/', preferencesController.getPreferences);
preferencesRouter.get('/:username', preferencesController.getPreferencesByUsername);
preferencesRouter.post('/:username', preferencesController.addPreferences);

module.exports = { preferencesRouter };