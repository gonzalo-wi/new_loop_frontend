// Minimal ambient declarations for the subset of the Google Maps JS API used by
// the truck-tracking modal. Kept hand-written on purpose to avoid pulling the
// full @types/google.maps dependency (see CLAUDE.md: avoid unnecessary deps).
// The runtime implementation is loaded dynamically by useGoogleMaps().
export {}

declare global {
  namespace google.maps {
    interface LatLngLiteral {
      lat: number
      lng: number
    }

    interface MapOptions {
      center?: LatLngLiteral
      zoom?: number
      disableDefaultUI?: boolean
      zoomControl?: boolean
      streetViewControl?: boolean
      mapTypeControl?: boolean
      fullscreenControl?: boolean
      clickableIcons?: boolean
      gestureHandling?: string
    }

    interface Symbol {
      path: SymbolPath | string
      scale?: number
      rotation?: number
      fillColor?: string
      fillOpacity?: number
      strokeColor?: string
      strokeWeight?: number
    }

    interface MarkerOptions {
      position?: LatLngLiteral
      map?: Map
      icon?: Symbol | string
      title?: string
    }

    enum SymbolPath {
      BACKWARD_CLOSED_ARROW,
      BACKWARD_OPEN_ARROW,
      CIRCLE,
      FORWARD_CLOSED_ARROW,
      FORWARD_OPEN_ARROW,
    }

    class Map {
      constructor(el: HTMLElement, opts?: MapOptions)
      setCenter(latLng: LatLngLiteral): void
      panTo(latLng: LatLngLiteral): void
      setZoom(zoom: number): void
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setPosition(latLng: LatLngLiteral): void
      setIcon(icon: Symbol | string): void
      setTitle(title: string): void
      setMap(map: Map | null): void
    }
  }

  interface Window {
    google?: typeof google
  }
}
