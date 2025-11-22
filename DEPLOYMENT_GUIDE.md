# 🚀 Guía de Deployment: Vercel + Supabase

## Paso 1: Configurar Supabase

### 1.1 Crear Proyecto
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva organización (si no tienes una)
3. Clic en "New Project"
4. Configuración:
   - **Name**: `diesel-invoices`
   - **Database Password**: (genera una contraseña fuerte y guárdala)
   - **Region**: `South America (São Paulo)` (más cercano a México)
   - **Pricing Plan**: **Free** ($0/mes - perfecto para empezar)

> **💡 Recomendación**: Empieza con el plan **Free** ($0/mes). Incluye:
> - 500MB de base de datos (suficiente para ~10,000 facturas)
> - 1GB de almacenamiento (suficiente para ~200-300 PDFs)
> - 50,000 usuarios autenticados/mes
> - 2GB de transferencia/mes
> 
> Puedes actualizar a **Pro** ($25/mes) más adelante si necesitas:
> - Más espacio (8GB DB, 100GB storage)
> - Backups diarios automáticos
> - Soporte prioritario

### 1.2 Ejecutar Schema
1. En Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de `supabase/schema.sql`
3. Clic en "Run"
4. Verifica que se crearon las tablas: `invoices`, `bank_transactions`, `user_profiles`, `audit_log`

### 1.3 Crear Bucket de Storage
1. En Supabase Dashboard → Storage
2. Clic en "Create bucket"
3. Configuración:
   - **Name**: `invoices`
   - **Public**: ❌ NO (privado)
4. Clic en "Create bucket"
5. En SQL Editor, ejecuta `supabase/storage_policies.sql`

### 1.4 Configurar Autenticación
1. En Supabase Dashboard → Authentication → Providers
2. Habilitar **Email** provider
3. Configurar:
   - **Enable email confirmations**: ✅ SÍ
   - **Secure email change**: ✅ SÍ
   - **Enable MFA**: ✅ SÍ (TOTP)

### 1.5 Obtener Credenciales
1. En Supabase Dashboard → Settings → API
2. Copia y guarda:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJxxx...`
   - **service_role key**: `eyJxxx...` (⚠️ SECRETO)

---

## Paso 2: Migrar Datos

### 2.1 Configurar Variables de Entorno
```powershell
# En la raíz del proyecto
set SUPABASE_URL=https://xxx.supabase.co
set SUPABASE_SERVICE_KEY=eyJxxx...
```

### 2.2 Instalar Dependencias
```powershell
npm install @supabase/supabase-js
```

### 2.3 Ejecutar Migración
```powershell
node migrate_to_supabase.js
```

### 2.4 Crear Usuario Admin
1. En Supabase Dashboard → Authentication → Users
2. Clic en "Add user" → "Create new user"
3. Configuración:
   - **Email**: `admin@diesel.com` (o tu email)
   - **Password**: (contraseña fuerte)
   - **Auto Confirm User**: ✅ SÍ
4. Copia el **User UID**
5. En SQL Editor, ejecuta:
```sql
INSERT INTO user_profiles (user_id, email, full_name, role)
VALUES (
  'PEGA-AQUI-EL-UUID',
  'admin@diesel.com',
  'Administrador',
  'admin'
);
```

---

## Paso 3: Crear Proyecto Next.js

### 3.1 Inicializar Next.js
```powershell
# En la raíz del proyecto
npx create-next-app@latest web --typescript --tailwind --app --src-dir --import-alias "@/*"
cd web
```

### 3.2 Instalar Dependencias
```powershell
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @tanstack/react-table lucide-react
npm install pdf-parse
```

### 3.3 Configurar Variables de Entorno
Crear `web/.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Paso 4: Desplegar en Vercel

### 4.1 Preparar para Deploy
1. Crear `.vercelignore`:
```
node_modules
.next
server
FACTURAS_PDF
*.db
BACKUP_*
```

2. Actualizar `package.json` en `/web`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### 4.2 Deploy a Vercel

> **💡 Tip**: Vercel **Hobby** (gratis) es perfecto para empezar. Incluye:
> - Despliegues ilimitados
> - HTTPS automático
> - 100GB de bandwidth/mes
> - Serverless functions
> 
> Solo necesitas **Pro** ($20/mes) si requieres:
> - Dominio personalizado (ej: invoices.diesel.com)
> - Analytics avanzados
> - Team collaboration

```powershell
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (desde carpeta /web)
cd web
vercel
```

Sigue las instrucciones:
- **Set up and deploy**: Y
- **Which scope**: (tu cuenta)
- **Link to existing project**: N
- **Project name**: `diesel-invoices`
- **Directory**: `./`
- **Override settings**: N

Tu app estará disponible en: `https://diesel-invoices.vercel.app`

### 4.3 Configurar Variables de Entorno en Vercel
1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `diesel-invoices`
3. Settings → Environment Variables
4. Agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://diesel-invoices.vercel.app`

### 4.4 Redeploy
```powershell
vercel --prod
```

---

## Paso 5: Configurar Dominio (Opcional)

### 5.1 En Vercel
1. Settings → Domains
2. Add Domain
3. Ingresa tu dominio: `invoices.diesel.com`
4. Sigue las instrucciones para configurar DNS

### 5.2 Configurar SSL
- Vercel configura SSL automáticamente con Let's Encrypt
- Espera ~5 minutos para que se active

---

## Paso 6: Crear Usuarios

### 6.1 Invitar Usuarios
Opción A - Manual (Supabase Dashboard):
1. Authentication → Users → Add user
2. Ingresa email y contraseña
3. Copia UUID del usuario
4. En SQL Editor:
```sql
INSERT INTO user_profiles (user_id, email, full_name, role, agent)
VALUES (
  'UUID-DEL-USUARIO',
  'usuario@diesel.com',
  'Nombre Completo',
  'agent', -- o 'viewer'
  'NOMBRE_AGENTE' -- ej: 'ANDRES', 'JUAN_DIOS'
);
```

Opción B - Programático (crear endpoint admin):
```javascript
// /api/admin/create-user
// Solo accesible por admins
```

### 6.2 Habilitar 2FA (Recomendado)
1. Usuario inicia sesión
2. Va a Perfil → Seguridad
3. Clic en "Habilitar 2FA"
4. Escanea QR con Google Authenticator
5. Ingresa código de verificación

---

## Paso 7: Monitoreo y Seguridad

### 7.1 Configurar Alertas
En Supabase Dashboard → Settings → Alerts:
- ✅ Database CPU usage > 80%
- ✅ Database memory usage > 80%
- ✅ Storage usage > 80%

### 7.2 Revisar Logs
- Vercel Dashboard → Logs (errores de aplicación)
- Supabase Dashboard → Logs (queries de DB)
- Supabase Dashboard → Auth → Users (intentos de login)

### 7.3 Backups
En Supabase Dashboard → Database → Backups:
- **Pro Plan**: Backups diarios automáticos (7 días retención)
- Puedes hacer backups manuales cuando quieras

---

## 📋 Checklist Final

Antes de dar acceso a usuarios:

- [ ] Schema ejecutado en Supabase
- [ ] Políticas RLS configuradas
- [ ] Storage bucket creado con políticas
- [ ] Datos migrados correctamente
- [ ] Usuario admin creado y probado
- [ ] Aplicación desplegada en Vercel
- [ ] Variables de entorno configuradas
- [ ] HTTPS funcionando
- [ ] Login/logout funcionando
- [ ] Permisos por rol probados
- [ ] 2FA habilitado para admin
- [ ] Backups automáticos activos
- [ ] Alertas configuradas
- [ ] Documentación para usuarios lista

---

## 🆘 Troubleshooting

### Error: "relation does not exist"
- Verifica que ejecutaste `schema.sql` en Supabase
- Revisa en Supabase → Database → Tables

### Error: "JWT expired"
- Las sesiones expiran después de 1 hora
- Usuario debe hacer logout/login

### Error: "Row Level Security policy violation"
- Verifica que el usuario tiene un perfil en `user_profiles`
- Verifica que el rol es correcto
- Revisa las políticas RLS en `schema.sql`

### PDFs no se ven
- Verifica que ejecutaste `storage_policies.sql`
- Verifica que los PDFs están en la carpeta correcta del agente
- Revisa en Supabase → Storage → invoices

---

## 💰 Costos Mensuales Estimados
## 💰 Costos Estimados

### 🎉 Empezar GRATIS ($0/mes)

#### Supabase Free
- **Costo**: $0/mes
- **Incluye**:
  - 500MB de base de datos (~10,000 facturas)
  - 1GB de almacenamiento (~200-300 PDFs)
  - 50,000 usuarios autenticados/mes
  - 2GB de transferencia/mes
  - Autenticación con 2FA
  - Row Level Security
  - Backups manuales

#### Vercel Hobby
- **Costo**: $0/mes
- **Incluye**:
  - Despliegues ilimitados
  - HTTPS automático
  - 100GB de bandwidth/mes
  - Serverless functions
  - URL: `https://tu-proyecto.vercel.app`

### **Total Inicial: $0/mes** 🎉

---

### 📈 Cuando Necesites Más (Upgrade)

#### Supabase Pro: $25/mes
**Actualiza cuando**:
- Tengas más de 10,000 facturas
- Necesites más de 1GB de PDFs
- Quieras backups automáticos diarios
- Necesites soporte prioritario

**Incluye**:
- 8GB de base de datos
- 100GB de almacenamiento
- 100,000 usuarios autenticados/mes
- 50GB de transferencia/mes
- Backups diarios (7 días retención)
- 99.9% uptime SLA

#### Vercel Pro: $20/mes
**Actualiza cuando**:
- Quieras dominio personalizado (invoices.diesel.com)
- Necesites analytics avanzados
- Quieras colaboración en equipo

**Total con upgrades**: ~$45/mes

---

### 💡 Recomendación

1. **Empieza GRATIS** ($0/mes) para probar
2. **Monitorea uso** en los dashboards
3. **Actualiza cuando sea necesario**:
   - Supabase te avisará cuando te acerques a los límites
   - Vercel te permite actualizar en cualquier momento

---

## 📞 Soporte

### Supabase
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Email: support@supabase.io

### Vercel
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord
- Email: support@vercel.com
