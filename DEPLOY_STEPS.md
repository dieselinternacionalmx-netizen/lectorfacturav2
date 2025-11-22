# 🚀 Pasos para Completar el Deployment

## ✅ Completado
- [x] Código subido a GitHub: https://github.com/dieselinternacionalmx-netizen/lectorfacturav2

## 📋 Siguiente: Configurar Supabase

### Paso 1: Ejecutar Schema en Supabase

1. Ve a: https://supabase.com/dashboard/project/sckksmidfhsrqagxxzwd
2. En el menú lateral, clic en **SQL Editor**
3. Clic en **New Query**
4. Copia y pega el contenido del archivo `supabase/schema.sql`
5. Clic en **Run** (botón verde)
6. Deberías ver: "Success. No rows returned"

### Paso 2: Crear Bucket de Storage

1. En el menú lateral, clic en **Storage**
2. Clic en **Create a new bucket**
3. Configuración:
   - **Name**: `invoices`
   - **Public bucket**: ❌ NO (dejar desmarcado)
4. Clic en **Create bucket**
5. Vuelve al **SQL Editor**
6. Copia y pega el contenido de `supabase/storage_policies.sql`
7. Clic en **Run**

### Paso 3: Crear Usuario Admin

1. En el menú lateral, clic en **Authentication** → **Users**
2. Clic en **Add user** → **Create new user**
3. Configuración:
   - **Email**: tu email (ej: admin@diesel.com)
   - **Password**: (crea una contraseña fuerte)
   - **Auto Confirm User**: ✅ SÍ
4. Clic en **Create user**
5. **IMPORTANTE**: Copia el **User UID** que aparece
6. Vuelve al **SQL Editor** y ejecuta:

```sql
INSERT INTO user_profiles (user_id, email, full_name, role)
VALUES (
  'PEGA-AQUI-EL-UUID',
  'admin@diesel.com',
  'Administrador',
  'admin'
);
```

## 🌐 Siguiente: Deploy a Vercel

### Opción A: Desde Vercel Dashboard (Recomendado)

1. Ve a: https://vercel.com/new
2. Clic en **Import Git Repository**
3. Busca: `dieselinternacionalmx-netizen/lectorfacturav2`
4. Clic en **Import**
5. Configuración:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. **Environment Variables** (agregar estas):
   ```
   VITE_SUPABASE_URL=https://sckksmidfhsrqagxxzwd.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja2tzbWlkZmhzcnFhZ3h4endkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjQ5NDksImV4cCI6MjA3OTQwMDk0OX0.mGrdcyHhiOAh5lcPApRplxHs_P-id49oAIKWzjcFugk
   ```
7. Clic en **Deploy**
8. Espera 2-3 minutos

### Opción B: Desde CLI (Alternativa)

```powershell
cd client
npm install -g vercel
vercel login
vercel
```

## 📊 Migrar Datos

Una vez que Supabase esté configurado, ejecuta:

```powershell
# Configurar variables de entorno
$env:SUPABASE_URL="https://sckksmidfhsrqagxxzwd.supabase.co"
$env:SUPABASE_SERVICE_KEY="TU_SERVICE_KEY_AQUI"

# Ejecutar migración
node migrate_to_supabase.js
```

**NOTA**: Necesitas obtener el `SUPABASE_SERVICE_KEY` desde:
Supabase Dashboard → Settings → API → `service_role` key (secret)

---

## ✅ Checklist Final

- [ ] Schema ejecutado en Supabase
- [ ] Bucket `invoices` creado
- [ ] Storage policies ejecutadas
- [ ] Usuario admin creado
- [ ] Perfil admin insertado
- [ ] Proyecto desplegado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Datos migrados
- [ ] Probado en producción

---

## 🔗 URLs Importantes

- **GitHub**: https://github.com/dieselinternacionalmx-netizen/lectorfacturav2
- **Supabase**: https://supabase.com/dashboard/project/sckksmidfhsrqagxxzwd
- **Vercel**: (se generará después del deploy)

---

## 🆘 Si algo falla

1. Revisa los logs en Vercel Dashboard → Deployments → [tu deploy] → Logs
2. Verifica que las variables de entorno estén correctas
3. Asegúrate de que el schema se ejecutó sin errores en Supabase
