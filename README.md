# Fletop

Marketplace de cargas con Node.js y PostgreSQL. La aplicación ya no usa SQLite.

## Desarrollo local

1. Instala Node.js 22+ y Docker Desktop.
2. Copia `.env.example` a `.env` y cambia `SESSION_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
3. Ejecuta `npm install` y luego `npm run db:up` para levantar PostgreSQL local.
4. Ejecuta `npm start` y abre `http://localhost:3000`.

El servidor crea las tablas e índices requeridos en PostgreSQL al iniciar. La cuenta del correo definido como `ADMIN_EMAIL` se provisiona como administradora mediante `ADMIN_PASSWORD`.

Si vienes de la versión local con SQLite, inicia primero PostgreSQL y el servidor una vez para crear las tablas. Luego ejecuta `npm run db:migrate-sqlite`; conserva una copia de `data/llevalo.db` hasta comprobar que los datos estén correctos.

## Producción

Usa una base PostgreSQL administrada o la base de datos de tu hosting. Configura como mínimo:

```env
DATABASE_URL=postgresql://usuario:contraseña@host:5432/llevalo
DATABASE_SSL=true
SESSION_SECRET=una-clave-larga-y-unica
ADMIN_EMAIL=tu-correo@dominio.com
ADMIN_PASSWORD=una-contraseña-de-provisionamiento
```

Después del primer arranque, elimina `ADMIN_PASSWORD` de las variables de producción para evitar que una clave temporal se reaplique al reiniciar. Mantén `uploads/` en almacenamiento persistente o reemplázalo por S3/Cloudinary antes de escalar a varios servidores.

### Rutas limpias y refresh

La aplicación usa rutas del navegador (`/buscar`, `/publicar`, `/perfil`, etc.), no hash routing. El servidor Node ya incluye el fallback de SPA: las rutas válidas responden `index.html` con HTTP 200 para que funcionen al abrirlas, refrescarlas o compartirlas. Las rutas desconocidas reciben el mismo documento con HTTP 404 y la aplicación renderiza su página «Página no encontrada».

Si pones Nginx delante de Node, envía todas las solicitudes al proceso Node; no configures un directorio estático que intercepte las rutas de la aplicación:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Google

Para habilitar «Continuar con Google», crea una credencial OAuth de tipo Web en Google Cloud y añade:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Como URI de redirección autorizada usa `https://tu-dominio.com/auth/google/callback`.

## Recuperación de contraseña

El flujo «Olvidé mi contraseña» crea enlaces de un solo uso que vencen en una hora. Para enviarlos por correo en producción configura un remitente verificado en [Resend](https://resend.com) y añade:

```env
RESEND_API_KEY=re_xxx
MAIL_FROM=Fletop <noreply@tu-dominio.com>
```
