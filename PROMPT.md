# Prompt de Recreación de Proyecto: PortPilot CAU con Firebase

## 1. Objetivo General

Recrear la aplicación "PortPilot CAU" utilizando Next.js, TypeScript, Tailwind CSS, y ShadCN UI, pero sustituyendo el backend basado en archivos JSON locales por un backend robusto y escalable de **Firebase**.

El objetivo es replicar todas las funcionalidades existentes, incluyendo la gestión de usuarios con roles, el sistema de ticketing (CAU), el dashboard de estado y los paneles de administración, utilizando Firebase Authentication y Firestore como base de datos.

## 2. Pila Tecnológica

- **Framework:** Next.js con App Router.
- **Lenguaje:** TypeScript.
- **UI:** React, ShadCN UI.
- **Estilos:** Tailwind CSS.
- **Iconos:** `lucide-react`.
- **Backend:**
    - **Autenticación:** Firebase Authentication (Proveedor de Email/Contraseña).
    - **Base de Datos:** Cloud Firestore.
- **Validación de Formularios:** `react-hook-form` y `zod`.

## 3. Arquitectura del Backend en Firebase

La base de datos Firestore debe estructurarse con las siguientes colecciones, reemplazando los archivos `.json` existentes:

- **`users`**: Almacena información adicional de los usuarios. El ID de cada documento debe ser el UID del usuario de Firebase Authentication.
  - **Schema:** `{ name: string, email: string, role: 'Admin' | 'Soporte Operativo' | 'Soporte Aduanas' | 'Usuario' }`

- **`news`**: Almacena las noticias operativas.
  - **Schema:** `{ content: string, author: string, createdAt: Timestamp }`

- **`occupancy`**: Almacena los datos de ocupación de la terminal.
  - **Schema:** `{ name: string, percentage: number }` (El ID del documento puede ser `ttp1`, `ttp2`, `aux`).

- **`cau_categories`**: Define las categorías principales de las solicitudes.
  - **Schema:** `{ name: string }`

- **`cau_request_types`**: Configuración para cada tipo de solicitud que se puede crear.
  - **Schema:** `{ title: string, description: string, category: string, requiresUti: boolean, requiresFile: boolean, estimatedResponseTime: number, customFields: array }` (El `customFields` es un array de objetos con la configuración de cada campo).

- **`cau_predefined_responses`**: Plantillas de respuesta para los agentes.
  - **Schema:** `{ title: string, responseText: string, status: string }`

- **`cau_requests`**: La colección principal para el sistema de ticketing.
  - **Schema:** `{ subject: string, userId: string (UID del creador), userName: string, createdAt: Timestamp, status: string, category: string, type: string, uti?: string, attachments: array, customFieldsData: map, history: array, slaExpiresAt?: Timestamp }`
    - `attachments` es un array de `{ name: string, url: string (URL de Firebase Storage) }`.
    - `history` es un array de `{ author: string, authorRole: string, content: string, createdAt: Timestamp }`.

- **`config`**: Para configuraciones del sistema. Un único documento `api` podría contener el token.
  - **Schema (en un doc 'api'):** `{ utiApiToken: string }`

**Nota:** Utiliza **Firebase Storage** para gestionar la subida de archivos adjuntos en las solicitudes del CAU.

## 4. Descripción Detallada de Funcionalidades a Recrear

### 4.1. Autenticación y Gestión de Usuarios

- **Flujo de Autenticación:**
  - Crear una página de login (`/login`) que use `signInWithEmailAndPassword` de Firebase.
  - Implementar un `AuthProvider` y un hook `useAuth` que escuche los cambios de estado de autenticación (`onAuthStateChanged`).
  - Al autenticarse un usuario, el hook debe leer el documento correspondiente de la colección `users` en Firestore para obtener su rol y nombre.
  - La sesión del usuario debe persistir entre recargas.
  - Implementar la funcionalidad de `logout`.

- **Gestión de Usuarios (Página `/admin/users` - Solo Admin):**
  - La página debe mostrar una tabla con todos los usuarios de la colección `users`.
  - Crear un diálogo para **añadir nuevos usuarios**. Este proceso debe:
    1.  Crear un nuevo usuario en Firebase Authentication con `createUserWithEmailAndPassword`.
    2.  Crear el documento correspondiente en la colección `users` de Firestore con el rol y nombre proporcionados.
  - Implementar la funcionalidad para **editar el rol** de un usuario existente, actualizando el documento en Firestore.

### 4.2. Layout Principal y Navegación (`AppShell`)

- Crear un layout principal para usuarios autenticados que incluya:
  - Una barra lateral de navegación, que debe ser colapsable.
  - Una barra de encabezado superior.
- La navegación en la barra lateral debe ser **dinámica y basada en roles**:
  - **Todos los usuarios:** Dashboard, CAU.
  - **Solo `Admin`:** Gestión de Usuarios, Ajustes, Prueba de API.
- El encabezado debe mostrar un menú de perfil del usuario con su nombre, rol, avatar y un botón para cerrar sesión.

### 4.3. Dashboard (`/dashboard`)

- La página principal para usuarios autenticados.
- **Medidores de Ocupación:**
  - Mostrar tres medidores de ocupación (TTP1, TTP2, Auxiliares) que lean los datos en **tiempo real** desde la colección `occupancy` de Firestore.
  - Los usuarios `Admin` y `Soporte Operativo` deben poder hacer clic en un medidor para abrir un popover y ajustar el porcentaje de ocupación, actualizando el documento correspondiente en Firestore.
- **Feed de Noticias:**
  - Mostrar una lista de las últimas noticias, obtenidas de la colección `news` y ordenadas por fecha de creación.
  - Los `Admin` deben tener un botón para añadir una nueva noticia, lo que creará un nuevo documento en la colección `news`.
- **Estadísticas de Agentes (Solo `Admin`):**
  - Analizar la colección `cau_requests` para calcular y mostrar:
    - Agente más activo (más respuestas).
    - Agente con el tiempo de respuesta medio más rápido.
    - Una tabla con el rendimiento de cada agente (solicitudes atendidas, TMR).

### 4.4. Sistema CAU (`/cau`)

Esta es la funcionalidad central.

- **Pestaña "Nueva Solicitud":**
  - El formulario debe permitir a los usuarios crear una nueva solicitud del CAU.
  - **Selección de Tipo:** El usuario primero ve una lista de tipos de solicitud, agrupados por categoría (leídos de `cau_categories` y `cau_request_types`).
  - **Formulario Dinámico:** Al seleccionar un tipo, el formulario debe renderizarse dinámicamente, mostrando los campos requeridos:
    - **Validación de UTI:** Si `requiresUti` es `true`, mostrar el campo de validación de matrícula.
      - **Conexión a API Externa:** El campo UTI debe llamar a una Server Action que consulte la API `headoffice.ttpcontinentalparking.com`. El token JWT se debe obtener de forma segura (desde el doc `config/api` en Firestore).
      - La validación es exitosa solo si la matrícula existe y la API devuelve `"state": "INSIDE"`.
      - Si la validación es correcta, los datos del vehículo se deben adjuntar al mensaje inicial de la solicitud para que los agentes los vean.
    - **Campos Personalizados:** Renderizar los campos definidos en `customFields` del tipo de solicitud.
    - **Adjuntos:** Si `requiresFile` o un campo personalizado es de tipo `file`, mostrar un componente de subida de archivos que suba el fichero a **Firebase Storage**.
  - Al enviar, se debe crear un nuevo documento en la colección `cau_requests` con todos los datos.

- **Pestañas "Bandeja de Entrada" y "Archivadas" (Solo Roles de Gestión):**
  - Mostrar una tabla con las solicitudes activas (`status != 'Archivada'`) y otra para las archivadas.
  - Usar un listener de **tiempo real** (`onSnapshot`) de Firestore para que la lista se actualice automáticamente.
  - **Diálogo de Detalle:** Al hacer clic en "Ver", abrir un diálogo que muestre:
    - El historial completo de la conversación.
    - Los adjuntos (con enlaces para descargar desde Firebase Storage).
    - Controles para agentes:
      - **Añadir Respuesta:** Añade un nuevo mensaje al array `history` del documento.
      - **Cambiar Estado/Categoría:** Actualiza los campos `status` y `category` del documento.
      - **Usar Respuesta Predefinida:** (Funcionalidad futura del prompt) Un menú para seleccionar una respuesta de la colección `cau_predefined_responses`, que rellenará el texto y cambiará el estado.
      - **Archivar:** Cambia el estado a `Archivada`.

### 4.5. Ajustes del Sistema (`/admin/settings` - Solo Admin)

- Una página para que los administradores configuren el sistema. Cada sección debe leer y escribir en la colección de Firestore correspondiente.
- **Ajustes de API:** Un campo para ver/actualizar el token JWT de la API de UTI en el documento `config/api`.
- **Editor de Categorías:** CRUD para los documentos de la colección `cau_categories`.
- **Editor de Tipos de Solicitud:** Interfaz completa para CRUD de los documentos de `cau_request_types`. El formulario de creación/edición debe permitir definir todos los campos, incluyendo el constructor dinámico para `customFields`.
- **Editor de Respuestas Predefinidas:** CRUD para los documentos de la colección `cau_predefined_responses`.

### 4.6. Página de Pruebas de API (`/admin/api-test` - Solo Admin)

- Una página de utilidad simple, protegida por rol.
- Debe tener un input para una matrícula y un botón.
- Al hacer clic, debe llamar a la misma Server Action de validación de UTI y mostrar la **respuesta JSON cruda** devuelta por la API, ya sea éxito o error. Esto es crucial para la depuración.
Este prompt esta desactualizado y solo muestra la parte inicial de la creacion de la aplicacion. No existe prompt actualizado.