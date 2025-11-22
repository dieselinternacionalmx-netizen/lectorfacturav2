# 🚀 Migración a Cloud: Archivos Creados

## 📁 Estructura de Archivos

```
lector_factura_nov2025/
├── supabase/
│   ├── schema.sql              ← Schema PostgreSQL con RLS
│   └── storage_policies.sql    ← Políticas de Storage
├── migrate_to_supabase.js      ← Script de migración de datos
├── DEPLOYMENT_GUIDE.md         ← Guía paso a paso de deployment
└── BACKUP_CHECKPOINT_20251122_093719/  ← Backup pre-migración
```

---

## 📄 Descripción de Archivos

### 1. `supabase/schema.sql` (Crítico)
**Propósito**: Schema completo de PostgreSQL con seguridad empresarial

**Contiene**:
- ✅ Tablas: `user_profiles`, `invoices`, `bank_transactions`, `audit_log`
- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Políticas de acceso por rol (admin/agent/viewer)
- ✅ Triggers para auditoría automática
- ✅ Índices para optimización
- ✅ Función de actualización de timestamps

**Seguridad**:
- Admins ven todo
- Agentes solo ven sus propios datos
- Viewers solo lectura de sus datos
- Audit log inmutable

---

### 2. `supabase/storage_policies.sql`
**Propósito**: Políticas de acceso a PDFs en Supabase Storage

**Contiene**:
- ✅ Políticas para bucket `invoices`
- ✅ Acceso basado en rol y agente
- ✅ Estructura de carpetas por agente

**Ejemplo de estructura**:
```
invoices/
  ANDRES/
    F-34963.pdf
  JUAN_DIOS/
    F-34914.pdf
  TEODORO/
    F-34311.pdf
```

---

### 3. `migrate_to_supabase.js`
**Propósito**: Migrar datos de SQLite local a Supabase PostgreSQL

**Funciones**:
- ✅ Migra facturas de `invoices`
- ✅ Migra depósitos de `bank_transactions`
- ✅ Sube PDFs a Supabase Storage
- ✅ Actualiza URLs de PDFs
- ✅ Manejo de errores robusto
- ✅ Progress tracking

**Uso**:
```powershell
set SUPABASE_URL=https://xxx.supabase.co
set SUPABASE_SERVICE_KEY=eyJxxx...
node migrate_to_supabase.js
```

---

### 4. `DEPLOYMENT_GUIDE.md`
**Propósito**: Guía completa de deployment paso a paso

**Secciones**:
1. Configurar Supabase (proyecto, schema, storage, auth)
2. Migrar datos (ejecutar script)
3. Crear proyecto Next.js
4. Desplegar en Vercel
5. Configurar dominio
6. Crear usuarios
7. Monitoreo y seguridad

**Incluye**:
- ✅ Comandos exactos
- ✅ Screenshots de configuración
- ✅ Troubleshooting común
- ✅ Costos estimados ($45/mes)
- ✅ Checklist final

---

## 🔐 Características de Seguridad Implementadas

### Autenticación
- ✅ Email + Password
- ✅ 2FA con TOTP (Google Authenticator)
- ✅ Sesiones con expiración (1 hora)
- ✅ Refresh token rotation

### Autorización
- ✅ Row Level Security (RLS)
- ✅ 3 roles: admin, agent, viewer
- ✅ Políticas por tabla
- ✅ Filtrado automático por agente

### Auditoría
- ✅ Log de todas las modificaciones
- ✅ Registro de IP y User Agent
- ✅ Datos antes/después de cambios
- ✅ Logs inmutables

### Datos
- ✅ Encriptación en reposo (Supabase)
- ✅ HTTPS obligatorio
- ✅ Backups diarios automáticos
- ✅ Storage privado con políticas

---

## 🎯 Próximos Pasos

### Paso 1: Crear Proyecto Supabase
1. Ir a [supabase.com](https://supabase.com)
2. Crear proyecto `diesel-invoices`
3. Ejecutar `supabase/schema.sql`
4. Ejecutar `supabase/storage_policies.sql`
5. Obtener credenciales (URL + Keys)

### Paso 2: Migrar Datos
1. Configurar variables de entorno
2. Ejecutar `node migrate_to_supabase.js`
3. Crear usuario admin en Supabase Auth
4. Insertar perfil admin en `user_profiles`

### Paso 3: Crear Aplicación Next.js
1. Inicializar proyecto Next.js
2. Configurar Supabase client
3. Implementar componentes de auth
4. Migrar componentes existentes
5. Probar localmente

### Paso 4: Deploy a Vercel
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy a producción
4. Configurar dominio (opcional)

### Paso 5: Crear Usuarios
1. Invitar usuarios vía Supabase Auth
2. Asignar roles y agentes
3. Habilitar 2FA para admins
4. Capacitar usuarios

---

## 📊 Matriz de Permisos

| Acción | Admin | Agent | Viewer |
|--------|-------|-------|--------|
| Ver todas las facturas | ✅ | ❌ | ❌ |
| Ver facturas propias | ✅ | ✅ | ✅ |
| Editar facturas | ✅ | ❌ | ❌ |
| Ver todos los depósitos | ✅ | ❌ | ❌ |
| Ver depósitos propios | ✅ | ✅ | ✅ |
| Editar depósitos | ✅ | ❌ | ❌ |
| Asociar facturas | ✅ | ❌ | ❌ |
| Subir PDFs | ✅ | ✅ | ❌ |
| Exportar datos | ✅ | ✅ (propios) | ✅ (propios) |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Ver audit logs | ✅ | ❌ | ❌ |

---

## 💰 Costos Estimados

### 🎉 Opción 1: GRATIS para Empezar

| Servicio | Plan | Costo | Límites |
|----------|------|-------|---------|
| Supabase | Free | $0/mes | 500MB DB, 1GB storage, 50K users/mes |
| Vercel | Hobby | $0/mes | 100GB bandwidth, serverless functions |
| **TOTAL** | | **$0/mes** | Perfecto para empezar y probar |

**Incluye**:
- ✅ ~10,000 facturas
- ✅ ~200-300 PDFs
- ✅ Usuarios ilimitados (hasta 50K autenticaciones/mes)
- ✅ HTTPS automático
- ✅ Autenticación con 2FA
- ✅ Row Level Security
- ✅ Backups manuales

---

### 📈 Opción 2: Plan Pro (Cuando Crezcas)

| Servicio | Plan | Costo |
|----------|------|-------|
| Supabase | Pro | $25/mes |
| Vercel | Pro | $20/mes |
| **TOTAL** | | **$45/mes** |

**Incluye**:
- ✅ 8GB Base de datos PostgreSQL
- ✅ 100GB Storage para PDFs
- ✅ Backups diarios automáticos
- ✅ SSL/HTTPS incluido
- ✅ Dominio personalizado
- ✅ Usuarios ilimitados
- ✅ Autenticación con 2FA
- ✅ 99.9% uptime SLA

**Actualiza cuando**:
- Tengas más de 10,000 facturas
- Necesites backups automáticos
- Quieras dominio personalizado
- Necesites más de 1GB de PDFs

---

## ✅ Checklist de Seguridad

Antes de producción:

- [ ] Schema ejecutado en Supabase
- [ ] Políticas RLS probadas
- [ ] Storage configurado
- [ ] Datos migrados
- [ ] Usuario admin creado
- [ ] 2FA habilitado para admin
- [ ] Aplicación desplegada
- [ ] Variables de entorno seguras
- [ ] HTTPS funcionando
- [ ] Backups automáticos activos
- [ ] Alertas configuradas
- [ ] Penetration testing realizado
- [ ] Documentación completa

---

## 🆘 Soporte

### Documentación
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Comunidad
- [Supabase Discord](https://discord.supabase.com)
- [Vercel Discord](https://vercel.com/discord)

---

## 📝 Notas Importantes

### Seguridad
- ⚠️ **NUNCA** compartas el `SUPABASE_SERVICE_KEY` públicamente
- ⚠️ Usa variables de entorno para todas las credenciales
- ⚠️ Habilita 2FA para todos los admins
- ⚠️ Revisa audit logs regularmente

### Performance
- Los índices están optimizados para queries por agente y fecha
- RLS puede agregar ~10-20ms de latencia (aceptable para seguridad)
- Storage usa CDN global de Supabase

### Backups
- Backups automáticos diarios (Plan Pro)
- Puedes hacer backups manuales cuando quieras
- Retención de 7 días
- Para retención mayor, considera exportar a S3

---

**Creado**: 2025-11-22  
**Versión**: 1.0  
**Estado**: Listo para deployment
