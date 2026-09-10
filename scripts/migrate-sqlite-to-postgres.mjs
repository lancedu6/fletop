import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

const databaseUrl=process.env.DATABASE_URL;
const sqlitePath=process.env.SQLITE_PATH||path.resolve('data/llevalo.db');
if(!databaseUrl)throw new Error('Define DATABASE_URL antes de ejecutar la migración.');
if(!fs.existsSync(sqlitePath))throw new Error('No se encontró la base SQLite en '+sqlitePath);
const sqlite=new DatabaseSync(sqlitePath),pool=new pg.Pool({connectionString:databaseUrl,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:false});
const target=await pool.connect();
try{
  await target.query('BEGIN');
  const users=sqlite.prepare('SELECT * FROM users').all();
  for(const u of users)await target.query('INSERT INTO users(id,name,email,password,phone,role,avatar,active,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO NOTHING',[u.id,u.name,u.email,u.password,u.phone,u.role||'user',u.avatar||null,u.active!==0,u.created_at||new Date().toISOString()]);
  const listings=sqlite.prepare('SELECT * FROM listings').all();
  for(const l of listings)await target.query('INSERT INTO listings(id,user_id,origin,destination,weight,title,details,phone,whatsapp,images,active,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO NOTHING',[l.id,l.user_id,l.origin,l.destination,l.weight,l.title,l.details||'',l.phone,l.whatsapp||null,l.images||'[]',l.active!==0,l.created_at||new Date().toISOString()]);
  const reports=sqlite.prepare('SELECT * FROM reports').all();
  for(const r of reports)await target.query('INSERT INTO reports(id,listing_id,reporter_id,reason,created_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING',[r.id,r.listing_id,r.reporter_id||null,r.reason||null,r.created_at||new Date().toISOString()]);
  await target.query("SELECT setval(pg_get_serial_sequence('users','id'),COALESCE((SELECT MAX(id) FROM users),1),true)");
  await target.query("SELECT setval(pg_get_serial_sequence('listings','id'),COALESCE((SELECT MAX(id) FROM listings),1),true)");
  await target.query("SELECT setval(pg_get_serial_sequence('reports','id'),COALESCE((SELECT MAX(id) FROM reports),1),true)");
  await target.query('COMMIT');
  console.log('Migración completada: '+users.length+' usuarios, '+listings.length+' anuncios y '+reports.length+' reportes.');
}catch(error){await target.query('ROLLBACK');throw error}finally{target.release();await pool.end()}
