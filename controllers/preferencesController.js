const { dbConnection } = require('../db_connection');
const TABLE_USERS_NAME = "tbl_28_users";
const TABLE_PREFERENCES_NAME = "tbl_28_preferences";
const MILLISECONDS_IN_A_DAY = 1000 * 60 * 60 * 24;

const { vacation_destinations } = require('../data/vacation_destination.json');
const { vacation_types } = require('../data/vacation_types.json');

exports.preferencesController = {
    async getPreferences(req, res) {
        const connection = await dbConnection.createConnection();

        try {
            const [rows] = await connection.execute(`SELECT * FROM ${TABLE_PREFERENCES_NAME}`);
            res.status(200).json(rows);
        } catch (error) {
            res.status(500).json({error: error.message});
        } finally {
            await connection.end();
        }
    },

    async getPreferencesByUsername(req, res) {
        const connection = await dbConnection.createConnection();

        try {
            const [rows] = await connection.execute(`SELECT ${TABLE_PREFERENCES_NAME}.id, start_date, end_date, destination, vacation_type FROM ${TABLE_USERS_NAME} inner join ${TABLE_PREFERENCES_NAME} on ${TABLE_USERS_NAME}.id = ${TABLE_PREFERENCES_NAME}.user_id WHERE user_name = ?`, [req.params.username]);
            if (rows.length === 0) {
                return res.status(404).json({error: `Preferences for username (${req.params.username}) not found`});
            }
            res.status(200).json(rows);
        } catch (error) {
            res.status(500).json({error: error.message});
        } finally {
            await connection.end();
        }
    },

    async addPreference(req, res) {
        const { username } = req.params;
        const { access_code, start_date, end_date, destination, vacation_type } = req.body;

        if (!access_code || !start_date || !end_date || !destination || !vacation_type) {
            return res.status(400).json({ error: `Please provide all the required fields { access_code, start_date, end_date, destination, vacation_type}` });
        }

        if (isNaN(Date.parse(start_date))) {
            return res.status(400).json({ 
                error: 'Invalid start date format',
                valid_date_format: 'YYYY-MM-DD'
            });
        }

        if (isNaN(Date.parse(end_date))) {
            return res.status(400).json({ 
                error: 'Invalid start date format',
                valid_date_format: 'YYYY-MM-DD'
            });
        }

        if (Date.parse(end_date) < Date.parse(start_date)) {
            return res.status(400).json({ error: 'End date cannot be before the start date' });
        }

        const duration = (Date.parse(end_date) - Date.parse(start_date)) / (MILLISECONDS_IN_A_DAY);
        if (duration > 7) {
            return res.status(400).json({ error: 'Vacation duration cannot be more than a week' });
        }

        if (!vacation_destinations.includes(destination)) {
            return res.status(400).json({ 
                error: 'Invalid destination',
                available_destinations: vacation_destinations
            });
        }

        if (!vacation_types.includes(vacation_type)) {
            return res.status(400).json({ 
                error: 'Invalid vacation type',
                available_vacation_types: vacation_types
            });
        }

        const connection = await dbConnection.createConnection();

        try {
            const [rows] = await connection.execute(`SELECT id, user_access_code FROM ${TABLE_USERS_NAME} WHERE user_name = ?`, [username]);
            if (rows.length === 0) {
                return res.status(404).json({error: `User with username (${username}) not found`});
            }

            if (rows[0].user_access_code != access_code) {
                return res.status(401).json({error: 'Invalid access code'});
            }

            const user_id = rows[0].id;
            const [insertedRow] = await connection.execute(`INSERT INTO ${TABLE_PREFERENCES_NAME} (user_id, start_date, end_date, destination, vacation_type) VALUES (?, DATE(?), DATE(?), ?, ?)`, [user_id, start_date, end_date, destination, vacation_type]);
            if (insertedRow.affectedRows === 0) {
                return res.status(500).json({ error: 'Internal server error at add preferences' });
            }

            res.status(201).json({
                message: 'Preferences added successfully',
                user_id: user_id,
                preference_id: insertedRow.insertId
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        } finally {
            await connection.end();
        }
    },
};
