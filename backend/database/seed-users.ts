/**
 * Script to create initial admin and agent users with proper bcrypt hashes
 * Run this after executing schema.sql
 * 
 * Usage: npx ts-node database/seed-users.ts
 */

import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedUsers() {
  try {
    console.log('🌱 Seeding users...\n');

    // Hash passwords
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const agentPassword = await bcrypt.hash('Agent@123', 10);

    // Check if admin exists
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@xcyber.com']);
    
    if (adminCheck.rows.length === 0) {
      // Create admin user
      const adminResult = await pool.query(
        `INSERT INTO users (name, email, phone, password_hash) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['System Admin', 'admin@xcyber.com', '+1234567890', adminPassword]
      );
      
      await pool.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
        [adminResult.rows[0].id, 'admin']
      );
      
      console.log('✅ Admin user created: admin@xcyber.com / Admin@123');
    } else {
      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [adminPassword, 'admin@xcyber.com']
      );
      console.log('✅ Admin password updated: admin@xcyber.com / Admin@123');
    }

    // Check if agent exists
    const agentCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['agent@xcyber.com']);
    
    if (agentCheck.rows.length === 0) {
      // Create agent user
      const agentResult = await pool.query(
        `INSERT INTO users (name, email, phone, password_hash) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['John Agent', 'agent@xcyber.com', '+1234567891', agentPassword]
      );
      
      await pool.query(
        'INSERT INTO user_roles (user_id, role, bank_id) VALUES ($1, $2, $3)',
        [agentResult.rows[0].id, 'agent', 'hdfc-life']
      );
      
      console.log('✅ Agent user created: agent@xcyber.com / Agent@123 (HDFC Life)');
    } else {
      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [agentPassword, 'agent@xcyber.com']
      );
      console.log('✅ Agent password updated: agent@xcyber.com / Agent@123');
    }

    console.log('\n🎉 Seeding complete!');
    console.log('\n📋 Test Credentials:');
    console.log('   Admin: admin@xcyber.com / Admin@123');
    console.log('   Agent: agent@xcyber.com / Agent@123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await pool.end();
  }
}

seedUsers();
