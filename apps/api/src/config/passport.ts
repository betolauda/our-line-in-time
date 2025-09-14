import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';
import { pool } from './database';
import { FamilyMember } from '@our-line-in-time/shared';

// Local strategy for login
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email: string, password: string, done) => {
    try {
      const result = await pool.query(
        'SELECT id, email, name, password_hash, role, is_active FROM family_members WHERE email = $1',
        [email]
      );

      const user = result.rows[0];
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (!user.is_active) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Remove password from user object
      const { password_hash, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }
));

// JWT strategy for protected routes
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
  },
  async (payload, done) => {
    try {
      const result = await pool.query(
        'SELECT id, email, name, role, is_active, generation_level, last_active_at FROM family_members WHERE id = $1',
        [payload.userId]
      );

      const user = result.rows[0];
      if (!user) {
        return done(null, false);
      }

      if (!user.is_active) {
        return done(null, false);
      }

      // Update last active timestamp
      await pool.query(
        'UPDATE family_members SET last_active_at = NOW() WHERE id = $1',
        [user.id]
      );

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

export default passport;