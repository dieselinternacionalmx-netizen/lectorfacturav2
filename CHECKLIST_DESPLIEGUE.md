# 📦 Checklist de Preparación para Despliegue

## ✅ Antes de Copiar a la Computadora de la Contadora

### 1. Verificar Archivos del Sistema
- [ ] Carpeta `server` completa
- [ ] Carpeta `client` completa
- [ ] Carpeta `EJEMPLOS XML` (puede estar vacía inicialmente)
- [ ] Archivo `INICIAR_SISTEMA.bat`
- [ ] Archivo `DETENER_SISTEMA.bat`
- [ ] Archivo `GUIA_INSTALACION.md`
- [ ] Archivo `LEEME.txt`

### 2. Limpiar Archivos Temporales (Opcional)
Puedes eliminar estos archivos/carpetas para reducir el tamaño:
- [ ] `server/node_modules` (se reinstalará)
- [ ] `client/node_modules` (se reinstalará)
- [ ] `server/invoices.db` (se creará automáticamente)
- [ ] `client/dist` (archivos de compilación)

### 3. Preparar la Computadora de Destino
- [ ] Instalar Node.js (versión LTS desde nodejs.org)
- [ ] Reiniciar la computadora después de instalar Node.js
- [ ] Verificar instalación: abrir CMD y escribir `node --version`

### 4. Copiar el Sistema
- [ ] Copiar toda la carpeta a `C:\lector_factura_nov2025`
- [ ] O copiar al Escritorio (más fácil de encontrar)

### 5. Instalación Inicial
En la computadora de la contadora:
- [ ] Abrir CMD en la carpeta del proyecto
- [ ] Ejecutar: `cd server && npm install`
- [ ] Ejecutar: `cd ..\client && npm install`
- [ ] Esperar a que termine (5-10 minutos)

### 6. Prueba Inicial
- [ ] Doble-click en `INICIAR_SISTEMA.bat`
- [ ] Verificar que se abran 2 ventanas negras
- [ ] Verificar que se abra el navegador
- [ ] Verificar que la interfaz cargue correctamente
- [ ] Hacer una prueba de escaneo con 1-2 PDFs

### 7. Capacitación
- [ ] Mostrar cómo iniciar el sistema
- [ ] Mostrar cómo agregar PDFs
- [ ] Mostrar cómo escanear
- [ ] Mostrar cómo buscar y filtrar
- [ ] Mostrar cómo exportar CSV
- [ ] Mostrar cómo detener el sistema
- [ ] Entregar archivo `LEEME.txt` impreso (opcional)

### 8. Configuración de Seguridad (Recomendado)
- [ ] Crear carpeta de backups
- [ ] Configurar backup automático de `server/invoices.db`
- [ ] Explicar importancia de no compartir archivos

---

## 📝 Notas Importantes

### Seguridad:
- ✅ Todo funciona **100% offline**
- ✅ Los datos **nunca** salen de la computadora
- ✅ No requiere internet para funcionar
- ✅ Base de datos local en `server/invoices.db`

### Mantenimiento:
- Hacer backup semanal de la carpeta completa
- Revisar espacio en disco si se acumulan muchos PDFs
- Limpiar PDFs antiguos de `EJEMPLOS XML` periódicamente

### Soporte:
- Guardar este checklist para futuras instalaciones
- Documentar cualquier problema encontrado
- Mantener contacto para actualizaciones

---

## 🎯 Resultado Esperado

Al finalizar, la contadora debe poder:
1. ✅ Iniciar el sistema con un doble-click
2. ✅ Agregar y escanear facturas
3. ✅ Buscar y filtrar información
4. ✅ Exportar reportes a Excel
5. ✅ Detener el sistema correctamente

**Tiempo estimado de instalación completa: 30-45 minutos**
