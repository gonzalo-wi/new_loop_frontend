import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  X,
  Loader2,
  MapPin,
  Navigation,
  Gauge,
  Power,
  PowerOff,
  Clock,
  User,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import type { Delivery, FleetLocation } from '../types'
import { fetchFleetLocation, FleetLocationError } from '../services/fleet.service'
import { useGoogleMaps } from '@/shared/hooks/useGoogleMaps'
import { formatDateTime, timeAgo } from '@/shared/lib/utils'
import { DEFAULT_MAP_CENTER } from '@/shared/constants'

const REFRESH_MS = 20_000

// Powerfleet occasionally reports 0/0 or nulls when a unit has no GPS fix; fall
// back to the configured default center so the map never jumps to the ocean.
function resolveCenter(location: FleetLocation): google.maps.LatLngLiteral {
  const valid =
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    (location.lat !== 0 || location.lng !== 0)
  return valid ? { lat: location.lat, lng: location.lng } : DEFAULT_MAP_CENTER
}

type Props = {
  delivery: Delivery
  onClose: () => void
}

export function TruckLocationModal({ delivery, onClose }: Props) {
  const plate = delivery.truckPlate?.trim()

  const {
    data: location,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['fleet-location', plate],
    queryFn: () => fetchFleetLocation(plate as string),
    enabled: !!plate,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const fleetError = error as FleetLocationError | null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-md bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-zinc-100 text-zinc-500">
              <MapPin size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Ubicación del camión
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Reparto{' '}
                <span className="font-mono text-zinc-700">{delivery.code}</span>
                {plate && (
                  <>
                    {' · '}
                    <span className="font-mono uppercase text-zinc-700">{plate}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isFetching && plate && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Actualizando
              </span>
            )}
            <button
              onClick={onClose}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {!plate ? (
            <StateMessage
              icon={AlertTriangle}
              tone="warning"
              title="Sin patente cargada"
              description="Este reparto no tiene una patente asociada, así que no se puede ubicar el camión. Editá el reparto para agregarla."
            />
          ) : isLoading ? (
            <StateMessage
              icon={Loader2}
              spinning
              title="Buscando ubicación…"
              description="Consultando el sistema de flota en tiempo real."
            />
          ) : fleetError ? (
            <StateMessage
              icon={AlertTriangle}
              tone={fleetError.kind === 'gateway' ? 'warning' : 'error'}
              title={
                fleetError.kind === 'notfound'
                  ? 'Camión no encontrado'
                  : fleetError.kind === 'gateway'
                    ? 'Sistema de flota no disponible'
                    : 'No se pudo obtener la ubicación'
              }
              description={fleetError.message}
              onRetry={() => refetch()}
            />
          ) : location ? (
            <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
              <div className="relative flex-1 bg-zinc-100">
                <MapArea location={location} />
              </div>
              <InfoPanel location={location} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── Map area: Google map, or a graceful link-out when the API isn't available ──

function MapArea({ location }: { location: FleetLocation }) {
  const status = useGoogleMaps()

  if (status === 'ready') return <TruckMap location={location} />

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    )
  }

  // 'no-key' or 'error': no embedded map, but the coordinates are still useful.
  const center = resolveCenter(location)
  const mapsUrl = `https://www.google.com/maps?q=${center.lat},${center.lng}`
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <MapPin size={22} className="text-zinc-300" />
      <p className="max-w-xs text-xs text-zinc-500">
        {status === 'no-key'
          ? 'El mapa embebido no está configurado en este entorno.'
          : 'No se pudo cargar el mapa de Google.'}{' '}
        Las coordenadas siguen disponibles.
      </p>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <ExternalLink size={12} />
        Abrir en Google Maps
      </a>
    </div>
  )
}

// ── Imperative Google map: created once, marker updated on each location tick ──

function TruckMap({ location }: { location: FleetLocation }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)

  // Create the map + marker once, on mount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const position = resolveCenter(location)
    const map = new google.maps.Map(containerRef.current, {
      center: position,
      zoom: 15,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      clickableIcons: false,
    })
    mapRef.current = map
    markerRef.current = new google.maps.Marker({
      position,
      map,
      icon: truckIcon(location.direction, location.engineOn),
      title: location.licensePlate,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Move the marker + recenter whenever a fresh position arrives from polling.
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    const position = resolveCenter(location)
    marker.setPosition(position)
    marker.setIcon(truckIcon(location.direction, location.engineOn))
    map.panTo(position)
  }, [location.lat, location.lng, location.direction, location.engineOn])

  return <div ref={containerRef} className="h-full w-full" />
}

function truckIcon(direction: number, engineOn: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 6,
    rotation: direction ?? 0,
    fillColor: engineOn ? '#059669' : '#71717a',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
  }
}

// ── Side info panel ─────────────────────────────────────────────────────────

function InfoPanel({ location }: { location: FleetLocation }) {
  return (
    <div className="w-full shrink-0 space-y-4 overflow-y-auto border-t border-zinc-200 bg-white p-5 md:w-72 md:border-l md:border-t-0">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold uppercase text-zinc-900">
          {location.licensePlate}
        </span>
        {location.engineOn ? (
          <span className="flex items-center gap-1 rounded-sm bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <Power size={11} /> En marcha
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-sm bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
            <PowerOff size={11} /> Detenido
          </span>
        )}
      </div>

      <InfoRow icon={MapPin} label="Dirección">
        {location.address || '—'}
      </InfoRow>
      <InfoRow icon={Gauge} label="Velocidad">
        {location.speed} km/h
      </InfoRow>
      <InfoRow icon={Navigation} label="Rumbo">
        {location.direction}°
      </InfoRow>
      <InfoRow icon={User} label="Conductor (flota)">
        {location.driver || '—'}
      </InfoRow>
      <InfoRow icon={Clock} label="Último reporte GPS">
        <span title={formatDateTime(location.gpsDateTime)}>
          {timeAgo(location.gpsDateTime)}
        </span>
      </InfoRow>

      <p className="border-t border-zinc-100 pt-3 text-[11px] leading-relaxed text-zinc-400">
        La ubicación se actualiza automáticamente cada {REFRESH_MS / 1000} segundos.
      </p>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-zinc-400" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</p>
        <p className="text-sm text-zinc-800">{children}</p>
      </div>
    </div>
  )
}

// ── Full-area state placeholder (loading / error / no plate) ─────────────────

function StateMessage({
  icon: Icon,
  title,
  description,
  tone = 'neutral',
  spinning = false,
  onRetry,
}: {
  icon: typeof MapPin
  title: string
  description: string
  tone?: 'neutral' | 'warning' | 'error'
  spinning?: boolean
  onRetry?: () => void
}) {
  const toneClass =
    tone === 'error'
      ? 'text-red-400'
      : tone === 'warning'
        ? 'text-amber-500'
        : 'text-zinc-300'

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Icon size={26} className={`${toneClass} ${spinning ? 'animate-spin' : ''}`} />
      <div>
        <p className="text-sm font-medium text-zinc-800">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">{description}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-sm border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
