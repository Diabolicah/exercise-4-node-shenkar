const { dbConnection } = require('../db_connection');
const TABLE_NAME = "tbl_28_users";

exports.userController = {
    async getUserAccessToken(req, res) {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide both username and password' });
        }

        const connection = await dbConnection.createConnection();

        try {
            const [rows] = await connection.execute(`SELECT user_access_code FROM ${TABLE_NAME} WHERE user_name = ? AND user_password = ?`, [username, password]);
            if (rows.length === 0) {
                return res.status(404).json({error: 'Invalid details'});
            }
            res.status(200).json(rows[0]);
        } catch (error) {
            res.status(500).json({error: error.message});
        } finally {
            await connection.end();
        }
    },

    async registerUser(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide both username and password' });
        }

        const connection = await dbConnection.createConnection();

        try {
            const [usernames] = await connection.execute(`SELECT * FROM ${TABLE_NAME} WHERE user_name = ?`, [username]);
            if (usernames.length > 0) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            const [users] = await connection.execute(`SELECT * FROM ${TABLE_NAME}`);
            if (users.length >= 5) {
                return res.status(400).json({ error: 'Maximum number of users reached (5)' });
            }

            const access_code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            const [rows] = await connection.execute(`INSERT INTO ${TABLE_NAME} (user_name, user_password, user_access_code) VALUES (?, ?, ?)`, [username, password, access_code]);
            if (rows.affectedRows === 0) {
                return res.status(500).json({ error: 'Internal server error at register user' });
            }

            res.status(201).json({
                message: 'User registered successfully',
                access_code: access_code
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        } finally {
            await connection.end();
        }
    },
};
