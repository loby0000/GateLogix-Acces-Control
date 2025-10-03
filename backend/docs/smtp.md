# Configuración SMTP (Gmail) para envío de correos

Este backend envía correos usando SMTP de Gmail mediante `nodemailer`. Se utiliza para enviar el código de barras del equipo (PNG base64 adjunto) al usuario durante:

- Registro de nuevo usuario con equipo principal (`usuarioEquipoController.registrar`)
- Registro de equipo adicional (`equiposController.registrarEquipo`)

## Variables de entorno requeridas

Defina estas variables en `backend/.env`:

- `EMAIL_HOST` = `smtp.gmail.com`
- `EMAIL_PORT` = `587` (STARTTLS) o `465` (SSL)
- `EMAIL_USER` = Correo Gmail remitente (ej: `tu_cuenta@gmail.com`)
- `EMAIL_PASS` = App Password de Gmail (16 caracteres, sin espacios)
- `MAILERSEND_FROM_NAME` = Nombre remitente mostrado (ej: `GateLogix`)

Ejemplo:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_cuenta@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # App Password sin espacios
MAILERSEND_FROM_NAME=GateLogix
```

Nota: En el archivo `.env`, elimine espacios en `EMAIL_PASS`. Debe quedar como `abcdefghijklmnop`.

## Requisitos en Gmail

- Active la verificación en dos pasos en la cuenta Gmail.
- Cree un App Password específico para “Mail”. Copie y pegue el código sin espacios en `EMAIL_PASS`.
- Evite usar la contraseña normal; Gmail la bloquea para SMTP.

## Funcionamiento

- El servicio `src/utils/emailService.js` construye el `transporter` de `nodemailer` con las variables de entorno.
- Convierte el Data URL base64 del código de barras a adjunto PNG.
- Envía un correo con asunto y HTML básico, incluyendo el serial y el usuario.

## Puntos de integración

- `src/controllers/usuarioEquipoController.js`: envía el correo tras crear usuario/equipo principal.
- `src/controllers/equiposController.js`: envía el correo tras registrar equipo adicional.

## Troubleshooting

- Si no se envía:
  - Verifique `EMAIL_*` en `.env` y reinicie el backend.
  - Asegure que el `EMAIL_PASS` es un App Password válido sin espacios.
  - Revise logs del backend por errores de `nodemailer`.
  - Compruebe que el servidor tiene acceso a Internet.

## Seguridad

- No comparta `.env` ni credenciales en repositorios.
- Use una cuenta de servicio dedicada y revise límites de envío de Gmail.