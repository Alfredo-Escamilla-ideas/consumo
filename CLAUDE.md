# CLAUDE.md — Control Consumo PHEV

Contexto esencial del proyecto para arrancar sesiones sin reexplicar.

---

## Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, React Router v6 (HashRouter)
- **Backend:** PHP 8 + PDO, MySQL, sin framework
- **Charts:** Recharts
- **Icons:** lucide-react
- **Deploy:** FTP a `ftp.lienzovirtual.com` (ver credenciales en memoria)

## Comandos

```bash
npm run dev      # desarrollo local (http://localhost:5173)
npm run build    # compila → dist/
```

**Subir a producción** (tras build):
```bash
curl -T dist/index.html "ftp://ftp.lienzovirtual.com/html/jaecoo7/index.html" --user "lienzovirtual.com:PASS"
curl -T dist/assets/FICHERO "ftp://ftp.lienzovirtual.com/html/jaecoo7/assets/FICHERO" --user "lienzovirtual.com:PASS"
# API PHP:
curl -T api/fichero.php "ftp://ftp.lienzovirtual.com/html/jaecoo7/api/fichero.php" --user "lienzovirtual.com:PASS"
```
> Las credenciales FTP están en la memoria persistente (`reference_ftp.md`).

---

## Estructura del proyecto

```
src/
  pages/
    Login.tsx          # Landing page + formulario login/registro
    Dashboard.tsx      # Resumen principal
    ElectricCharges.tsx
    FuelRefuels.tsx
    Statistics.tsx
    Tires.tsx
    Garage.tsx         # Taller / reparaciones
    Insurance.tsx
    Settings.tsx       # Configuración, exportar CSV, eliminar cuenta
  context/
    AuthContext.tsx    # Auth con localStorage (token Bearer)
    DataContext.tsx    # Carga y cache de datos del vehículo
    ThemeContext.tsx   # dark/light mode
  services/
    api.ts             # Capa HTTP; BASE = '/jaecoo7/api'
  utils/
    calculations.ts    # Estadísticas, km combinados PHEV
  components/
    Layout.tsx         # Sidebar + outlet

api/
  config.php           # Constantes DB y TOKEN_EXPIRY_DAYS=30
  db.php               # getDB() → PDO singleton
  helpers.php          # setCors, requireAuth, checkRateLimit, validators
  login.php
  register.php
  charges.php          # Recargas eléctricas (CRUD)
  refuels.php          # Repostajes gasolina (CRUD)
  tires.php
  repairs.php
  maintenance.php
  insurance.php
  vehicle.php          # DELETE vehículo + cascade
```

---

## Design system

Variables CSS en `src/index.css` bajo el prefijo `--j-*`, expuestas como clases Tailwind `jaecoo-*`:

| Token | Clase Tailwind | Valor (dark) |
|-------|---------------|--------------|
| Base bg | `bg-jaecoo-base` | `#080c14` |
| Surface | `bg-jaecoo-surface` | `#0e1520` |
| Card | `bg-jaecoo-card` | `#141c2e` |
| Elevated | `bg-jaecoo-elevated` | `#1b2438` |
| Electric (cyan) | `text-jaecoo-electric` | `#22d3ee` |
| Fuel (amber) | `text-jaecoo-fuel` | `#fb923c` |
| Danger | `text-jaecoo-danger` | `#f87171` |
| Text primary | `text-jaecoo-primary` | `#e2e8f0` |
| Text muted | `text-jaecoo-muted` | `#475569` |
| Border | `border-jaecoo-border` | `rgba(255,255,255,0.07)` |

Sombras: `shadow-j-electric`, `shadow-j-elevated`.
Soporta modo claro (`html.light`).

---

## Auth

- Token Bearer en `localStorage` (`consumo_token`)
- Sesión expira a los 30 días o tras 7 días de inactividad (`last_used_at`)
- En `api.ts`: 401 en ruta autenticada → limpia localStorage + `window.location.reload()`
- `requireAuth()` en todos los endpoints PHP salvo login/register

## Seguridad implementada

- CORS: solo `https://lienzovirtual.com` y `http://localhost:5173`
- Rate limiting en DB: login (10/15min), register (5/hora)
- Headers HTTP: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`
- Body limit: 64KB
- `display_errors = 0` en producción

---

## Modelo de datos clave

**`electric_charges`:** `id, vehicle_id, date, kwh, price_per_kwh, total_price_gross, total_price, waylet_before, waylet_after, battery_percent, odometer, station_name, station_address, driving_mode, notes`

**`fuel_refuels`:** `id, vehicle_id, date, liters, liters_in_tank, total_price, price_per_liter, odometer, station_name, station_address, driving_mode, notes`

**Km totales PHEV** (en `calculations.ts`): `max(odometer) - min(odometer)` sobre todos los registros (eléctricos + gasolina combinados), para evitar doble conteo.

---

## Convenciones

- PHP endpoints devuelven siempre JSON; errores con `err('mensaje', status)`
- Campos JS en camelCase, columnas DB en snake_case
- Fechas: `YYYY-MM-DD` (string)
- Números opcionales se envían como `null` si no están presentes
- No hay tests configurados aún (Vitest no instalado)
