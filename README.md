# TancolFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Importing data using `app-import-file`

The `app-import-file` component supports mapping columns from an Excel file to
the application's data model. When a property is marked with `id: true`, you can
provide a `serviceName` and `query` to look up the corresponding record in the
backend. If no record is found, the component will automatically create it so
that the returned UUID can be used during import.

Example configuration:

```ts
configurationImport = {
  properties: [
    {
      nameProperty: 'idAlmacen',
      label: 'Almacén',
      column: '',
      id: true,
      serviceName: 'almacenApiService',
      query: '?nombre=' // value appended automatically
    },
    // ... other properties
  ]
};
```

With this setup the value found in the mapped column (e.g. the warehouse name)
is used to query the given service. If a matching record exists, its identifier
is assigned to `idAlmacen`. Otherwise the record is created and its UUID used
before creating or updating the entry.

## n8n local y Twilio WhatsApp Sandbox

n8n se ejecuta localmente en Docker y queda disponible en `http://localhost:5678`.
Para que Twilio pueda enviar webhooks durante una demo, se utiliza ngrok como
túnel HTTPS temporal.

### Iniciar n8n

Si el contenedor ya existe, iniciarlo con:

```powershell
docker start tancol-n8n
```

Comprobar que n8n responde en `http://localhost:5678`.

### Configurar ngrok por primera vez

ngrok necesita un authtoken de la cuenta de ngrok. Ejecutar una sola vez,
reemplazando el valor de ejemplo por el token real:

```powershell
ngrok config add-authtoken TU_AUTHTOKEN
```

El token se guarda en la configuración local de Windows:

```text
C:\Users\<usuario>\AppData\Local\ngrok\ngrok.yml
```

No guardar ese archivo ni el token en el repositorio.

### Iniciar el túnel

En otra ventana de PowerShell:

```powershell
ngrok http 5678
```

ngrok mostrará una línea similar a esta:

```text
Forwarding  https://xxxx.ngrok-free.app -> http://localhost:5678
```

La URL también se puede consultar en `http://127.0.0.1:4040` o con:

```powershell
(Invoke-RestMethod http://127.0.0.1:4040/api/tunnels).tunnels.public_url
```

Usar esa URL HTTPS como base para el webhook de Twilio. En el plan gratuito
puede cambiar cada vez que se reinicia ngrok.

### Detener los servicios

En la ventana de ngrok presionar `Ctrl+C`. Para detener n8n:

```powershell
docker stop tancol-n8n
```

Este túnel solo expone el puerto local; no modifica los workflows de n8n.
