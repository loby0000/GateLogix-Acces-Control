# Configuración de MailerSend

Para habilitar el envío automático del código de barras al correo del usuario, configura las siguientes variables en tu `.env` del backend:

```
MAILERSEND_API_KEY=tu_api_key_de_mailersend
MAILERSEND_FROM_EMAIL=notificaciones@tu-dominio.com
MAILERSEND_FROM_NAME=GateLogix
```

Requisitos:
- Tener un dominio verificado en MailerSend para el `from`.
- El backend debe poder salir a Internet para usar la API.

Integraciones actuales:
- Se envía email al registrar un usuario nuevo (`usuarioEquipoController.registrar`).
- Se envía email al agregar un equipo nuevo a un usuario existente (`equiposController.registrarEquipo`).

Adjuntos:
- El código de barras se envía como archivo PNG adjunto, generado en base64.

Observaciones:
- Si `MAILERSEND_API_KEY` o `MAILERSEND_FROM_EMAIL` no están definidos, el envío falla de forma controlada y no interrumpe el registro.