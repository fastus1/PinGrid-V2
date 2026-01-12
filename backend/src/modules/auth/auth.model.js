const pool = require('../../shared/config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

class User {
  /**
   * Create a new user
   */
  static async create({ email, password, firstName, lastName }) {
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, is_admin, created_at`,
      [email, passwordHash, firstName, lastName]
    );

    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, is_admin, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Verify password
   */
  static async verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }

  /**
   * Update user
   */
  static async update(id, updates) {
    const { firstName, lastName, email } = updates;

    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email)
       WHERE id = $4
       RETURNING id, email, first_name, last_name, is_admin, created_at`,
      [firstName, lastName, email, id]
    );

    return result.rows[0];
  }

  /**
   * Delete user
   */
  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

module.exports = User;
