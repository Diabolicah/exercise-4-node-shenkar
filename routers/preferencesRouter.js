const { Router }  = require('express');
const { preferencesController } = require('../controllers/preferencesController');

const preferencesRouter = Router();

preferencesRouter.get('/', preferencesController.getPreferences);
preferencesRouter.get('/:username', preferencesController.getPreferencesByUsername);
preferencesRouter.post('/', preferencesController.addPreference);
preferencesRouter.put('/', preferencesController.updatePreference);

module.exports = { preferencesRouter };