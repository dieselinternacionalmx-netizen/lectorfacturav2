# Lector de Facturas - Sistema de Gestión

Sistema de gestión de facturas con arquitectura centrada en facturas y seguimiento de pagos.

## 🚀 Características

- ✅ Extracción automática de datos de PDFs
- ✅ Gestión de facturas con estados de pago (Pendiente, Parcial, Pagada)
- ✅ Registro de pagos desde depósitos bancarios
- ✅ Seguimiento de cuentas por cobrar
- ✅ Dashboard con métricas en tiempo real
- ✅ Filtros por agente y mes
- ✅ Exportación a CSV

## 🛠️ Stack Tecnológico

### Frontend
- React + Vite
- TanStack Table
- Lucide Icons

### Backend
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Storage para PDFs

### Deployment
- Vercel (Frontend)
- Supabase (Backend + Database)

## 📦 Instalación Local

```bash
# Instalar dependencias del cliente
cd client
npm install

# Instalar dependencias del servidor (solo para desarrollo local)
cd ../server
npm install
```

## 🌐 Deployment

Ver `DEPLOY_STEPS.md` para instrucciones detalladas de deployment a Vercel y Supabase.

## 📝 Licencia

Propiedad de Diesel Internacional MX
