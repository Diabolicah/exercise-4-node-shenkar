const { dbConnection } = require('../db_connection');
const TABLE_USERS_NAME = "tbl_28_users";
const TABLE_PREFERENCES_NAME = "tbl_28_preferences";

exports.preferencesController = {
    async getPreferences(req, res) {
        const connection = await dbConnection.createConnection();

        try {
            const [rows] = await connection.execute(`SELECT * FROM ${TABLE_NAME}`);
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
                return res.status(404).json({error: `Preferences for username (${req.params.username}) Not found`});
            }
            res.status(200).json(rows[0]);
        } catch (error) {
            res.status(500).json({error: error.message});
        } finally {
            await connection.end();
        }
    }
};
