# 📝 Control de Versiones

## Versión Actual: v1.0.0
**Fecha de Lanzamiento**: 19 de Noviembre, 2025

---

## 🎯 Características de v1.0.0

### Funcionalidades Principales
- ✅ Extracción automática de 9 campos de datos de PDFs
- ✅ Interfaz oscura estilo Vercel/Supabase
- ✅ Búsqueda global en tiempo real
- ✅ Filtro por agente
- ✅ Filtro por mes/año
- ✅ Burbujas de color para agentes (estilo Airtable)
- ✅ Tarjeta de resumen de ventas por agente
- ✅ Exportación a CSV (respeta filtros activos)
- ✅ Ordenamiento por cualquier columna
- ✅ Scripts de inicio automático (.bat)

### Configuración
- ✅ Carpeta de PDFs configurable (`FACTURAS_PDF`)
- ✅ Base de datos SQLite local
- ✅ 100% offline - sin dependencias de internet

---

## 📅 Historial de Versiones

### v1.0.0 - 19/Nov/2025 (Versión Inicial)
**Características Implementadas:**
- Sistema completo de lectura de facturas
- Extracción de datos: Archivo, Factura #, Fecha, Cliente, RFC, Agente, Subtotal, IVA, Total
- Dashboard con estadísticas en tiempo real
- Filtros combinables (Agente + Mes/Año)
- Exportación CSV
- Scripts de despliegue fácil
- Documentación completa

**Tecnologías:**
- Backend: Node.js + Express + SQLite + pdf-parse
- Frontend: React + Vite + TanStack Table
- Diseño: CSS personalizado (Vercel/Supabase style)

---

## 🔄 Cómo Actualizar la Versión

Cuando hagas cambios importantes al sistema:

1. **Edita el archivo `client/src/App.jsx`:**
   - Busca la línea: `<span className="version-badge">v1.0.0</span>`
   - Cambia el número de versión

2. **Actualiza este archivo (`VERSION.md`):**
   - Agrega una nueva entrada en el historial
   - Describe los cambios realizados

3. **Criterios de Versionado (Semántico):**
   - **v1.0.0** → **v2.0.0**: Cambios mayores (nueva funcionalidad grande, cambios de arquitectura)
   - **v1.0.0** → **v1.1.0**: Nuevas características menores
   - **v1.0.0** → **v1.0.1**: Correcciones de bugs, mejoras pequeñas

---

## 📋 Plantilla para Nuevas Versiones

```markdown
### vX.X.X - DD/Mes/YYYY
**Nuevas Características:**
- Descripción de nueva funcionalidad 1
- Descripción de nueva funcionalidad 2

**Mejoras:**
- Mejora 1
- Mejora 2

**Correcciones:**
- Bug fix 1
- Bug fix 2
```

---

## 🎯 Roadmap Futuro (Ideas)

Posibles mejoras para futuras versiones:
- [ ] Gráficas de ventas mensuales
- [ ] Comparación entre agentes
- [ ] Filtro por rango de fechas personalizado
- [ ] Exportación a Excel con formato
- [ ] Dashboard de métricas avanzadas
- [ ] Soporte para múltiples carpetas de PDFs
- [ ] Historial de cambios en la base de datos
- [ ] Backup automático programado
