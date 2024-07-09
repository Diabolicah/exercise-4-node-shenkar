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
                error: 'Invalid end date format',
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
            const [rows] = await connection.execute(`SELECT id, user_access_code FROM ${TABLE_USERS_NAME} WHERE user_access_code = ?`, [access_code]);
            if (rows.length === 0) {
                return res.status(404).json({error: `User with access code (${access_code}) not found`});
            }

            if (rows[0].user_access_code != access_code) {
                return res.status(401).json({error: 'Invalid access code'});
            }

            const user_id = rows[0].id;
            const [existingPreferences] = await connection.execute(`SELECT * FROM ${TABLE_PREFERENCES_NAME} WHERE user_id = ?`, [user_id]);
            if (existingPreferences.length > 0) {
                return res.status(400).json({error: 'User has already added a preference'});
            }

            const [insertedRow] = await connection.execute(`INSERT INTO ${TABLE_PREFERENCES_NAME} (user_id, start_date, end_date, destination, vacation_type) VALUES (?, DATE(?), DATE(?), ?, ?)`, [user_id, start_date, end_date, destination, vacation_type]);
            if (insertedRow.affectedRows === 0) {
                return res.status(500).json({ error: 'Internal server error at add preferences' });
            }

            res.status(201).json({
                message: 'Preferences added successfully'
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        } finally {
            await connection.end();
        }
    },

    async updatePreference(req, res) {
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
                error: 'Invalid end date format',
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
            const [rows] = await connection.execute(`SELECT id, user_access_code FROM ${TABLE_USERS_NAME} WHERE user_access_code = ?`, [access_code]);
            if (rows.length === 0) {
                return res.status(404).json({error: `User with access code (${access_code}) not found`});
            }

            if (rows[0].user_access_code != access_code) {
                return res.status(401).json({error: 'Invalid access code'});
            }

            const user_id = rows[0].id;
            const [existingPreferences] = await connection.execute(`SELECT * FROM ${TABLE_PREFERENCES_NAME} WHERE user_id = ?`, [user_id]);
            if (existingPreferences.length === 0) {
                return res.status(404).json({error: 'User has not added a preference yet'});
            }

            const [updatedRow] = await connection.execute(`UPDATE ${TABLE_PREFERENCES_NAME} SET start_date = DATE(?), end_date = DATE(?), destination = ?, vacation_type = ? WHERE user_id = ?`, [start_date, end_date, destination, vacation_type, user_id]);
            if (updatedRow.affectedRows === 0) {
                return res.status(500).json({ error: 'Internal server error at update preferences' });
            }

            res.status(200).json({
                message: 'Preferences updated successfully',
            });
        }
        catch (error) {
            res.status(500).json({error: error.message});
        } finally {
            await connection.end();
        }
    },

    async calculateVacationDestination(req, res) {
        const connection = await dbConnection.createConnection();

        try {
            const [preferences] = await connection.execute(`SELECT * FROM ${TABLE_PREFERENCES_NAME}`);
            if (preferences.length < 5) {
                return res.status(404).json({error: 'Not all 5 users have added their preferences yet'});
            }

            const [destinationResult] = await connection.execute(`select destination from ${TABLE_PREFERENCES_NAME} group by destination order by count(destination) desc, MIN(id) ASC limit 1;`);
            const destination = destinationResult[0].destination;

            const [vacationTypeResult] = await connection.execute(`select vacation_type from ${TABLE_PREFERENCES_NAME} group by vacation_type order by count(vacation_type) desc, MIN(id) ASC limit 1;`);
            const vacationType = vacationTypeResult[0].vacation_type;

            const [startDateResult] = await connection.execute(`select start_date from ${TABLE_PREFERENCES_NAME} order by start_date DESC limit 1;`);
            const startDate = Date.parse(startDateResult[0].start_date);

            const [endDateResult] = await connection.execute(`select end_date from ${TABLE_PREFERENCES_NAME} order by end_date ASC limit 1;`);
            const endDate = Date.parse(endDateResult[0].end_date);

            const duration = (endDate - startDate) / (MILLISECONDS_IN_A_DAY);
            if (duration > 7 || duration < 0) {
                return res.status(400).json({ error: "Couldn't find suitable date for everyone." });
            }

            res.status(200).json({
                message: "Vacation destination calculated successfully",
                destination: destination,
                vacation_type: vacationType,
                start_date: new Date(startDate).toLocaleDateString(),
                endDate: new Date(endDate).toLocaleDateString()
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        } finally {
            await connection.end();
        }
    }
};
