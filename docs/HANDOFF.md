# LOOP Admin Frontend — Documentación de traspaso

> Guía técnica para quien continúe el proyecto. Última actualización: 2026-07.
> El objetivo es que puedas **levantar, entender, extender y deployar** el frontend sin
> conocimiento previo. Leé primero "Arranque rápido" y "Cómo está organizado";
> el resto es referencia.

---

## 1. Qué es LOOP

Panel de administración interno para control de mercadería, stock, repartos y
auditoría operativa de una empresa de distribución (bidones de agua / retornables).
**No es un sitio de marketing**: es software operativo, pensado para que usuarios
internos (admin, controladores, repartidores, supervisores) trabajen rápido con
tablas densas, filtros y estados claros.

Este repo es **solo el frontend**. El backend es una API REST separada (Spring Boot,
por lo que se ve en los contratos) que corre en otra máquina.

Integraciones externas que toca el sistema (todas mediadas por el backend, el front
nunca ve sus credenciales):
- **Aguas** — sistema al que se envían los remitos de salida. El `delivery_id` que
  espera Aguas se arma con el `code` del reparto (por eso los códigos deben ser
  numéricos, ver §9).
- **Powerfleet** — GPS de la flota. Alimenta la ubicación de camiones en tiempo real.
- **Google Maps** — render del mapa donde se muestra el camión.

---

## 2. Stack

| Área | Herramienta |
|------|-------------|
| Framework | React 18 + TypeScript |
| Build / dev server | Vite 5 |
| Estilos | Tailwind CSS 3 |
| Routing | React Router 6 |
| Estado servidor | TanStack Query (React Query) 5 |
| Estado global (auth) | Zustand 4 (con persist) |
| Formularios | React Hook Form 7 + Zod 3 |
| HTTP | Axios 1 |
| Iconos | lucide-react |
| Drag & drop | @dnd-kit (usado en orderable-products) |
| Fechas | date-fns |

Regla del proyecto (ver `CLAUDE.md`): **evitar dependencias nuevas salvo razón fuerte**.
Ej.: el mapa de Google se carga con un loader propio en vez de instalar un wrapper npm.

---

## 3. Arranque rápido

```bash
npm install
npm run dev        # http://localhost:3000
```

Scripts (`package.json`):
- `npm run dev` — servidor de desarrollo (Vite, puerto 3000).
- `npm run build` — `tsc && vite build`. **El typecheck corre acá**: si TS falla, no buildea.
- `npm run preview` — sirve el `dist/` ya buildeado.
- `npm run lint` — ⚠️ **hoy está roto** (ver §12).

### Cómo se conecta al backend en dev

El front nunca llama al backend por URL absoluta. Usa siempre rutas relativas a `/api`
(ej. `api.get('/routes')` → `/api/routes`). En **dev**, Vite proxea `/api/*` al backend
y le saca el prefijo `/api`. Eso está en `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',   // ← cambiá esto para apuntar a otro backend
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

Para apuntar a producción se usa `http://192.168.0.42:8095`. **Ese es el único lugar
que hay que tocar para cambiar de backend en dev.** No se usa `VITE_API_URL` en dev
(ver §8, la nota es importante).

---

## 4. Cómo está organizado

Estructura **por feature**. Cada módulo de negocio es autocontenido:

```
src/
  app/
    providers/        # QueryProvider (React Query) + AppProviders
    router/           # index.tsx — todas las rutas
  layouts/
    AdminLayout.tsx   # shell con sidebar + topbar; hace el guard de auth
    AuthLayout.tsx    # layout del login
    components/       # Sidebar, Topbar
  shared/
    components/ui/    # DataTable, PageHeader, StatusBadge, FormSection, Combobox, etc.
    hooks/            # useDebounce, useLocalStorage, useGoogleMaps
    lib/              # api.ts (cliente axios), utils.ts
    constants/        # ROUTES, ROLE_LABELS, mapeos de roles, formatos de fecha
    types/            # tipos compartidos (ID, OperationalStatus, UserRole, TableColumn)
  features/
    <modulo>/
      pages/          # componentes de página (montados en el router)
      components/     # modales, tablas, sub-componentes del módulo
      services/       # llamadas al backend (o mock)
      types.ts        # tipos + DTOs del módulo
      mocks/          # datos falsos (solo algunos módulos, ver §11)
```

**Convención clave:** la lógica de negocio y las llamadas viven en `services/`, no en
las páginas. Las páginas orquestan (queries, estado de UI, modales).

---

## 5. Convenciones de código (importante para no romper el patrón)

### 5.1. Capa de servicios y contrato del backend

Todos los servicios reales importan el cliente axios: `import { api } from '@/shared/lib/api'`.

El backend envuelve casi todas las respuestas en:

```ts
type ApiResponse<T> = { data: T; message: string }
```

Y las listas vienen paginadas al estilo Spring:

```ts
type SpringPage<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}
```

### 5.2. Adaptadores DTO ↔ modelo de UI

Cuando el shape del backend no coincide con lo que la UI quiere, el servicio traduce
con funciones `fromDto` / `toCreateDto` / `toUpdateDto`. Buen ejemplo:
`features/deliveries/services/deliveries.service.ts` (el backend llama "routes" a lo que
la UI muestra como "Repartos", y `active: boolean` se mapea a `status: 'active'|'inactive'`).

> Vocabulario a tener presente: **Reparto = Route** en el backend (`/routes`).

### 5.3. Manejo de errores

Patrón repetido: `extractMessage(err)` lee `err.response.data.message` y lo re-lanza como
`Error`, así el componente muestra el mensaje del backend directo. Los formularios lo
pintan en un banner rojo (`setError('root', ...)`).

### 5.4. Formularios

React Hook Form + Zod (`zodResolver`). Los modales de alta/edición siguen todos la misma
estructura (mirá `DeliveryFormModal.tsx` como plantilla): schema Zod arriba, `useForm`,
`useMutation` para guardar, secciones con `<FormSection>` / `<FormField>`.

### 5.5. Componentes UI compartidos

Antes de crear un componente nuevo, revisá `shared/components/ui/index.ts`. Ya existen:
`DataTable`, `PageHeader`, `StatusBadge`, `FilterBar`, `SearchInput`, `FormSection`,
`FormField`, `Combobox`, `DatePicker`, `ConfirmDialog`, `EmptyState`, `LoadingState`,
`ErrorState`, `ActionBar`, `MetricBlock`, `AuditTimeline`.

---

## 6. Integración con el backend (cliente axios)

`src/shared/lib/api.ts` es el corazón de la comunicación:

- `baseURL = import.meta.env.VITE_API_URL ?? '/api'` → en prod queda `/api` (relativo),
  y nginx lo proxea (ver §10). **En prod NO se setea `VITE_API_URL`** a propósito.
- **Timeout global: 15s.** Ojo: subidas grandes (APK) lo superan, por eso ese request
  usa `timeout: 0` explícito (ver §11.3).
- **Interceptor de request:** agrega `Authorization: Bearer <token>` leyendo el token de
  `localStorage['loop_token']`.
- **Interceptor de response:** ante un **401**, borra el token y redirige a `/login`.

> Consecuencia práctica: cualquier endpoint que requiera auth y se consuma con `<a href>`
> o `window.open()` directo **no funciona**, porque el navegador no manda el header en
> esas navegaciones. Hay que traer el recurso por `api` (blob) y armar un object URL.
> Esto aplica al remito PDF (§11.1).

---

## 7. Autenticación y roles

- **Login:** `POST /auth/login` con `{ username, password }`. Devuelve `{ id, name, username, role, token }`.
- **Store:** Zustand con `persist` bajo la clave `loop_auth` en localStorage. Además el
  token se guarda por separado en `loop_token` (que es de donde lo lee el interceptor).
- **Guard de rutas:** `AdminLayout` sólo chequea `isAuthenticated`. Si no, redirige a login.
  **No hay guard por rol a nivel de ruta** (ver §12).
- **Roles:** el backend usa strings en mayúscula/español (`ADMIN`, `CONTROLADOR`,
  `REPARTIDOR`, `PICKER`, `CARGADOR_DISPENSERS`, `SUPERVISOR`). El front los mapea a
  valores internos en minúscula/inglés vía `BACKEND_ROLE_MAP` / `FRONTEND_ROLE_MAP`
  (`shared/constants/index.ts`). Si agregás un rol, tocá **los dos** mapas.
- **Gating por rol en UI:** el Sidebar oculta ítems marcados `adminOnly` a los no-admin
  (hoy sólo "App móvil"). El filtro es `user?.role === 'admin'`.

---

## 8. Variables de entorno

Todas las vars de front son de **build-time** (Vite las hornea en el bundle; cambiarlas
requiere rebuild). Van en un archivo `.env` en la raíz (**gitignoreado**; hay un
`.env.example` de referencia).

| Variable | Para qué | Notas |
|----------|----------|-------|
| `VITE_API_URL` | Origen del backend | **No usar en dev** (rompería el proxy y daría CORS). En prod tampoco se setea: el bundle usa `/api` y nginx proxea. |
| `VITE_GOOGLE_MAPS_API_KEY` | Mapa de ubicación de camión | Browser key, restringir por HTTP referrer. Si falta, el mapa degrada a un link "Abrir en Google Maps". |
| `VITE_DEFAULT_LAT` / `VITE_DEFAULT_LNG` | Centro por defecto del mapa | Fallback (Buenos Aires) cuando un camión no reporta GPS válido. |

Para Docker hay además vars de **runtime** (las resuelve nginx, no requieren rebuild),
ver §10:

| Variable | Default | Para qué |
|----------|---------|----------|
| `BACKEND_URL` | `http://192.168.0.42:8095` | Adónde nginx proxea `/api`. |
| `MAX_UPLOAD_SIZE` | `256m` | Límite de tamaño de subida (APK). Menos que esto → nginx tira 413. |

---

## 9. Deploy con Docker

El deploy es una imagen que sirve el `dist/` estático con **nginx**, que además hace de
proxy `/api` → backend (replicando lo que hace el proxy de Vite en dev).

Archivos:
- `Dockerfile` — multi-stage: etapa `node` buildea, etapa `nginx` sirve.
- `docker/default.conf.template` — config de nginx con placeholders `${BACKEND_URL}` y
  `${MAX_UPLOAD_SIZE}`.
- `docker/40-loop-envsubst.sh` — entrypoint que sustituye esos placeholders al arrancar
  (usando `envsubst`) y valida que `BACKEND_URL` esté seteada.
- `docker-compose.yml` — orquesta el build y expone el puerto **8080 → 80**.

### Comandos

```bash
# build + arranque (con el mapa configurado)
VITE_GOOGLE_MAPS_API_KEY=<key> docker compose up -d --build

# apuntar a otro backend / subir el límite de subida (sin rebuild de la app)
BACKEND_URL=http://otro:8095 MAX_UPLOAD_SIZE=512m docker compose up -d
```

Al arrancar, el log confirma la config:
`[loop] proxying /api -> http://192.168.0.42:8095 (max upload 256m)`.

### El detalle que más confunde: build-time vs runtime

- **`VITE_GOOGLE_MAPS_API_KEY`** se hornea en el JS al **buildear** → es un `ARG` del
  Dockerfile. Cambiarla **requiere rebuild** (`--build`).
- **`BACKEND_URL` y `MAX_UPLOAD_SIZE`** las aplica **nginx al arrancar** → son `environment`
  del contenedor. Cambiarlas **no requiere rebuild**, sólo reiniciar.

### Por qué la allowlist de `envsubst` importa

El entrypoint hace `envsubst '${BACKEND_URL} ${MAX_UPLOAD_SIZE}'`. Esa lista explícita es
**obligatoria**: sin ella, `envsubst` reemplazaría también las variables propias de nginx
(`$host`, `$uri`, `$remote_addr`...) por vacío y el proxy se rompería en silencio. Si
agregás un placeholder nuevo al template, **sumalo también a esa lista** en el `.sh`.

---

## 10. Estado actual: qué es real y qué no

⚠️ **Lo más importante de todo el documento.** Hay pantallas que parecen funcionar pero
sirven datos falsos. En staging alguien las va a abrir y creer que son reales.

| Módulo / ruta | Estado | Detalle |
|---------------|--------|---------|
| `/stock` (Stock) | 🟥 **MOCK** | `stock.service.ts` devuelve un array en memoria con `setTimeout`. No pega al backend. |
| `/movements` (Movimientos) | 🟥 **MOCK** | `movements.service.ts` usa un store en memoria. "Crear" un movimiento parece andar pero se pierde al refrescar. |
| `/trucks` (Unidades) | 🟨 **STUB** | Pantalla con "Módulo en desarrollo". Honesta, no engaña. |
| Todo el resto | 🟩 **REAL** | Auth, Sucursales, Productos, Usuarios, Repartos, Pedidos, Pedibles, Dispensers, Auditoría, Controles de Stock (entradas/salidas), Dashboard, App móvil, ubicación de camión. |

Los servicios reales son los que importan `@/shared/lib/api`. Los mock importan de
`../mocks`. Grep rápido para verificar en cualquier momento:

```bash
grep -l "MOCK_\|from '../mocks" src/features/*/services/*.ts   # los mock
```

---

## 11. Features con lógica delicada (leé antes de tocarlas)

### 11.1. Remito PDF (Controles de Stock → Salidas)

`features/stock/components/RemitoActions.tsx` + `fetchRemitoPdf` en
`stock-controls.service.ts`. Botones "Ver" e "Imprimir" en cada salida y en el detalle.

Puntos finos que ya están resueltos y **no hay que romper**:
- El endpoint pide Bearer → el PDF se trae con `responseType: 'blob'` (no se puede linkear).
- **Bloqueador de pop-ups:** la pestaña se abre **síncrona y vacía** *antes* del `await`,
  y se le setea la URL cuando llega el PDF. Si abrís después del await, Chrome la mata.
- **Errores como blob:** con `responseType: 'blob'`, el cuerpo de error **también** es un
  Blob, así que hay que leer su texto y parsear el JSON (no `response.data.message` directo).
- Imprimir usa un **iframe oculto** que dispara `print()` sobre el PDF cargado.
- Los mensajes de 404/409 están traducidos a castellano (los del backend vienen en inglés).
- Falta implementar la variante "por reparto y fecha" (`/stock-controls/remito?routeId=&date=`);
  hoy siempre tenemos el ID a mano, así que no se usó.

### 11.2. Ubicación de camión (Repartos → 📍)

`TruckLocationModal.tsx` + `fleet.service.ts` + `useGoogleMaps.ts` + `shared/types/google-maps.d.ts`.
- Google Maps se carga con un **loader propio** (sin dependencia npm). Los tipos son un
  `.d.ts` mínimo escrito a mano (sólo lo que se usa).
- Llama `GET /fleet/location/{plate}` con **polling cada 20s**. El ícono rota según
  `direction` y cambia de color según `engineOn`.
- Degrada elegante: sin API key o si Google no carga, muestra datos + link "Abrir en Google Maps".
- `resolveCenter()` usa el centro por defecto (§8) si el camión reporta coords inválidas
  (0/0 o nulls), para que el mapa no salte al océano.

### 11.3. Subida de APK (App móvil, admin-only)

`AppVersionFormModal.tsx` + `app-version.service.ts`.
- `POST /app/version` como **multipart/form-data**. Campos: `version` (regex `x.y.z`),
  `mandatory` (checkbox), `notes` (opcional), `file` (`.apk`).
- El request usa **`timeout: 0`** (sin límite) porque un APK supera los 15s globales, y
  muestra **barra de progreso** real (`onUploadProgress`).
- Ojo con los límites de tamaño en la cadena: **nginx** (`MAX_UPLOAD_SIZE`, §8/§10) y
  **el backend** (Spring `spring.servlet.multipart.max-file-size` / `max-request-size`,
  default 1MB/10MB — hay que subirlos del lado del backend o rebota con 413/JSON).

### 11.4. Código de reparto numérico (Aguas)

`DeliveryFormModal.tsx`. El `code` del reparto **debe ser sólo números** (regex `^\d+$`),
porque se usa para armar el `delivery_id` que va a Aguas, y Aguas rechaza códigos con
letras. Los repartos legacy (`rto1`, `Rto10`...) hay que migrarlos: al editar uno, la
validación exige corregir el código antes de guardar.
- La lista de repartos se ordena con **orden natural** (`localeCompare(..., {numeric:true})`)
  así "10" va después de "9" y no después de "1".
- **Pendiente de producto:** hoy el `code` es lo único que se muestra Y lo que va a Aguas.
  Si se necesita mostrar algo descriptivo ("Reparto 1 - Ciudadela") pero seguir mandando
  un número limpio, hay que agregar un campo `name`/`displayName` separado.

### 11.5. Controles de salida: sólo "Total"

`StockControlFormModal.tsx` + `StockControlDetail.tsx`. En **salidas (EXIT)** sólo se carga
y muestra la columna **Total**; "Llenos" y "Recambios" son concepto de entrada y se envían
siempre en **0** (incluso al editar salidas viejas que tuvieran valores, se normalizan). En
**entradas** se muestran las tres columnas + "Diferencia". El PDF del remito lo genera el
backend, así que si ahí también sobran esas columnas, se pide del lado del backend.

---

## 12. Deuda técnica y cosas a saber

- 🟥 **Stock y Movimientos son mock** (§10). Decisión pendiente: conectarlos al backend o
  sacarlos del sidebar hasta que existan sus endpoints.
- ⚠️ **`npm run lint` está roto.** El repo usa ESLint 9, que requiere `eslint.config.js`
  (formato flat), y no existe. Hay que migrar la config o crear ese archivo. **El typecheck
  (`tsc`) sí funciona** y corre en el `build`.
- ⚠️ **`vite.config.ts` — revisar el `target` del proxy.** Estuvo con un espacio al final
  (`'http://localhost:8080 '`) que puede romper el proxy. Verificá que quede limpio y
  apuntando a donde corresponda.
- **Sin guard de rutas por rol.** El gating admin es sólo visual (el ítem desaparece del
  sidebar), pero un no-admin que tipee la URL entra igual. La barrera real es el backend
  (403). Si se quiere protección real en el front, hay que agregar un guard por rol —
  hoy no existe en ningún módulo.
- **Bundle grande (~690KB).** El build avisa que supera 500KB. No hay code-splitting por
  ruta todavía; si molesta, se puede lazy-load de las páginas en el router.
- **`CLAUDE.md` y `api.md` están gitignoreados** (no se versionan). `CLAUDE.md` tiene las
  reglas de diseño/arquitectura del proyecto y vale la pena leerlo. `api.md` son contratos
  de API que fueron llegando.

---

## 13. Referencia rápida de rutas ↔ archivos

| Ruta | Página | Servicio | Real? |
|------|--------|----------|-------|
| `/` | `dashboard/pages/DashboardPage` | (usa servicios de otros módulos) | 🟩 |
| `/branches` | `branches/.../BranchesPage` | `branches.service` | 🟩 |
| `/products` | `products/.../ProductsPage` | `products.service` | 🟩 |
| `/stock` | `stock/pages/StockPage` | `stock.service` | 🟥 mock |
| `/stock/entries` | `stock/.../StockControlsPage` (ENTRY) | `stock-controls.service` | 🟩 |
| `/stock/exits` | `stock/.../StockControlsPage` (EXIT) | `stock-controls.service` | 🟩 |
| `/movements` | `movements/.../MovementsPage` | `movements.service` | 🟥 mock |
| `/deliveries` | `deliveries/.../DeliveriesPage` | `deliveries.service` + `fleet.service` | 🟩 |
| `/trucks` | `trucks/.../TrucksPage` | — | 🟨 stub |
| `/audits` | `audits/.../AuditsPage` | `audits.service` | 🟩 |
| `/users` | `users/.../UsersPage` | `users.service` | 🟩 |
| `/orderable-products` | `orderable-products/...` | `orderable-products.service` | 🟩 |
| `/orders` | `orders/.../OrdersPage` | `orders.service` | 🟩 |
| `/dispensers` | `dispensers/.../DispenserMovementsPage` | `dispensers.service` | 🟩 |
| `/app-version` | `app-version/.../AppVersionPage` | `app-version.service` | 🟩 (admin) |
| `/login` | `auth/pages/LoginPage` | `auth.service` | 🟩 |

Las rutas están centralizadas en `shared/constants/index.ts` (`ROUTES`) y montadas en
`app/router/index.tsx`.
