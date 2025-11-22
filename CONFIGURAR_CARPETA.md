# 📁 Configuración del Nombre de Carpeta

## Nombre Actual: `FACTURAS_PDF`

Este es el nombre de la carpeta donde debes colocar los archivos PDF para procesar.

## ¿Cómo Cambiar el Nombre?

### Opción 1: Usar el Nombre Actual (Recomendado)
- **Nombre**: `FACTURAS_PDF`
- **Ventaja**: Ya está configurado, no requiere cambios
- **Profesional**: Nombre claro y descriptivo

### Opción 2: Cambiar a Otro Nombre

Si prefieres otro nombre, sigue estos pasos:

1. **Edita el archivo de configuración:**
   - Abre: `server/config.js`
   - Cambia la línea:
     ```javascript
     PDF_FOLDER_NAME: 'FACTURAS_PDF',
     ```
   - Por ejemplo, a:
     ```javascript
     PDF_FOLDER_NAME: 'Facturas_Para_Procesar',
     ```

2. **Renombra la carpeta física:**
   - Renombra la carpeta `FACTURAS_PDF` al nuevo nombre
   - Debe coincidir exactamente con el nombre en `config.js`

3. **Reinicia el sistema:**
   - Detén el sistema si está corriendo
   - Vuelve a iniciar con `INICIAR_SISTEMA.bat`

## Sugerencias de Nombres

Nombres profesionales y claros:
- ✅ `FACTURAS_PDF`
- ✅ `Facturas_Para_Procesar`
- ✅ `PDFs_Facturas`
- ✅ `Documentos_Facturas`
- ✅ `Facturas_Pendientes`

Evita nombres con:
- ❌ Espacios múltiples
- ❌ Caracteres especiales (excepto guión bajo `_`)
- ❌ Acentos (pueden causar problemas en algunos sistemas)

## Ubicación de la Carpeta

La carpeta siempre debe estar en la raíz del proyecto:
```
lector_factura_nov2025/
├── FACTURAS_PDF/          ← Aquí van los PDFs
├── server/
├── client/
└── INICIAR_SISTEMA.bat
```

## Notas Importantes

- ⚠️ El nombre en `config.js` y el nombre de la carpeta física **deben ser idénticos**
- ⚠️ Después de cambiar el nombre, reinicia el sistema
- ✅ Puedes tener subcarpetas dentro, pero el sistema solo lee el nivel principal
- ✅ Los PDFs pueden tener cualquier nombre
