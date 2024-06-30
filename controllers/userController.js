const { dbConnection } = require('../db_connection');
const TABLE_NAME = "tbl_28_users";

exports.userController = {
    async registerUser(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide both username and password' });
        }

        const connection = await dbConnection.createConnection();

        try {
            const access_code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const [rows] = await connection.execute(`INSERT INTO ${TABLE_NAME} (user_name, user_password, user_access_code) VALUES (?, ?, ?)`, [username, password, access_code]);
            
            if (rows.affectedRows === 0) {
                return res.status(500).json({ error: 'Internal server error at register user' });
            }

            res.status(201).json({
                message: 'User registered successfully',
                access_token: access_code
            });
        } catch (error) {
            res.status(500).json(error);
        } finally {
            await connection.end();
        }
    },
};
