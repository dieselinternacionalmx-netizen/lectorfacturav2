# 🚀 Guía de Instalación para la Contadora

Esta guía explica cómo instalar y usar el sistema de lectura de facturas en una computadora nueva.

## 📋 Requisitos Previos (Solo Primera Vez)

### 1. Instalar Node.js
1. Descarga Node.js desde: https://nodejs.org
2. Descarga la versión **LTS** (recomendada)
3. Ejecuta el instalador y sigue las instrucciones
4. Acepta todas las opciones por defecto
5. Reinicia la computadora después de instalar

### 2. Copiar el Sistema
1. Copia toda la carpeta `lector_factura_nov2025` a la computadora de la contadora
2. Recomendado: Colócala en `C:\lector_factura_nov2025` o en el escritorio

### 3. Instalar Dependencias (Solo Primera Vez)

#### Backend:
1. Abre una terminal (CMD) en la carpeta del proyecto
2. Ejecuta:
```bash
cd server
npm install
```

#### Frontend:
1. En la misma terminal, ejecuta:
```bash
cd ..\client
npm install
```

> ⏱️ Este proceso puede tardar 5-10 minutos la primera vez.

---

## 🎯 Uso Diario (Súper Fácil)

### Para Iniciar el Sistema:
1. Ve a la carpeta del proyecto
2. **Doble-click en `INICIAR_SISTEMA.bat`**
3. Espera unos segundos
4. El navegador se abrirá automáticamente

### Para Detener el Sistema:
- **Opción 1**: Cierra todas las ventanas negras (terminales)
- **Opción 2**: Doble-click en `DETENER_SISTEMA.bat`

---

## 📁 Gestión de Archivos

### Agregar Nuevas Facturas:
1. Coloca los archivos PDF en la carpeta: **`FACTURAS_PDF`**
2. En el sistema web, haz clic en **"Escanear Nuevos"**
3. Los nuevos PDFs se procesarán automáticamente

### Cambiar el Nombre de la Carpeta (Opcional):
1. Abre el archivo: `server/config.js`
2. Cambia el valor de `PDF_FOLDER_NAME` al nombre que prefieras
3. Renombra la carpeta física con el mismo nombre
4. Reinicia el sistema

### Exportar Datos:
1. (Opcional) Filtra por agente si lo necesitas
2. Haz clic en **"Exportar CSV"**
3. El archivo se descargará a tu carpeta de Descargas
4. Abre el CSV con Excel o Google Sheets

---

## 🔒 Seguridad y Privacidad

✅ **Todo es local** - Los datos nunca salen de la computadora
✅ **Sin internet** - El sistema funciona completamente offline
✅ **Base de datos local** - Archivo `server/invoices.db`
✅ **Backups recomendados** - Copia la carpeta completa periódicamente

---

## ❓ Solución de Problemas

### El sistema no inicia:
1. Verifica que Node.js esté instalado: Abre CMD y escribe `node --version`
2. Si no aparece un número de versión, reinstala Node.js

### El navegador no se abre automáticamente:
- Abre manualmente: http://localhost:5173

### Error "Puerto en uso":
- Ejecuta `DETENER_SISTEMA.bat` y vuelve a iniciar

### Los PDFs no se escanean:
- Verifica que los PDFs estén en la carpeta `EJEMPLOS XML`
- Verifica que sean PDFs válidos (no imágenes escaneadas)

### Error "vite http proxy error" / "Dependencias no encontradas":
1.  Asegúrate de tener internet.
2.  Ejecuta el archivo **`REINSTALAR_DEPENDENCIAS.bat`**.
3.  Espera a que termine y vuelve a intentar iniciar el sistema.


---

## 📞 Contacto

Si hay problemas técnicos, contacta al administrador del sistema.

---

## 🎓 Capacitación Rápida (5 minutos)

### Video Tutorial (Recomendado)
> 💡 Considera grabar un video corto mostrando:
> 1. Cómo iniciar el sistema
> 2. Cómo escanear facturas
> 3. Cómo filtrar por agente
> 4. Cómo exportar a CSV

### Checklist de Capacitación:
- [ ] Iniciar el sistema con doble-click
- [ ] Escanear facturas nuevas
- [ ] Usar la búsqueda
- [ ] Filtrar por agente
- [ ] Ver estadísticas de ventas
- [ ] Exportar a CSV
- [ ] Detener el sistema correctamente
