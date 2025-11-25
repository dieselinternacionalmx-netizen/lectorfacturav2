# 🚀 Desplegar Edge Functions a Supabase

## Paso 1: Instalar Supabase CLI

Abre PowerShell y ejecuta:

```powershell
npm install -g supabase
```

## Paso 2: Login a Supabase

```powershell
supabase login
```

Te abrirá el navegador para autenticarte.

## Paso 3: Vincular al Proyecto

```powershell
cd "d:\DIESEL INT\lector_factura_nov2025"
supabase link --project-ref sckksmidfhsrqagxxzwd
```

## Paso 4: Obtener Service Role Key

1. Ve a: https://supabase.com/dashboard/project/sckksmidfhsrqagxxzwd/settings/api
2. En la sección **Project API keys**, busca `service_role` (secret)
3. Clic en el ícono del ojo para revelar la key
4. Cópiala (empieza con `eyJ...`)

## Paso 5: Configurar Secrets

Reemplaza `TU_SERVICE_KEY_AQUI` con la key que copiaste:

```powershell
supabase secrets set SUPABASE_URL=https://sckksmidfhsrqagxxzwd.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_KEY_AQUI
```

## Paso 6: Desplegar Funciones

```powershell
# Desplegar función de facturas
supabase functions deploy process-invoice

# Desplegar función de depósitos
supabase functions deploy process-bank-deposits
```

## ✅ Verificar Deployment

Deberías ver algo como:
```
Deployed Function process-invoice
Deployed Function process-bank-deposits
```

Verifica en: https://supabase.com/dashboard/project/sckksmidfhsrqagxxzwd/functions

---

## 🆘 Si hay errores

### Error: "supabase: command not found"
```powershell
npm install -g supabase
```

### Error: "Project not linked"
```powershell
supabase link --project-ref sckksmidfhsrqagxxzwd
```

### Error: "Invalid service role key"
- Verifica que copiaste la key correcta (service_role, no anon)
- Asegúrate de no tener espacios al inicio/final

---

## 📋 Checklist

- [ ] Supabase CLI instalado
- [ ] Login completado
- [ ] Proyecto vinculado
- [ ] Service Role Key obtenida
- [ ] Secrets configurados
- [ ] Función process-invoice desplegada
- [ ] Función process-bank-deposits desplegada
- [ ] Funciones visibles en dashboard

---

**Cuando termines, avísame para probar que todo funcione!**
