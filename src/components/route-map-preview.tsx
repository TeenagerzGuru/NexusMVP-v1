"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

import type { RoutePreview } from "@/lib/quote/route-preview";

type RouteMapPreviewProps = {
  route: RoutePreview;
};

export function RouteMapPreview({ route }: RouteMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const lineRef = useRef<Polyline | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const routeRef = useRef(route);
  routeRef.current = route;

  function fitRouteToView(L: typeof import("leaflet"), map: LeafletMap, line: Polyline) {
    const bounds = line.getBounds();
    const miles = routeRef.current.miles;
    const maxZoom = miles < 15 ? 14 : miles < 40 ? 12 : miles < 100 ? 10 : 8;

    map.fitBounds(bounds, {
      paddingTopLeft: [32, 32],
      paddingBottomRight: [32, 88],
      maxZoom,
      animate: true,
      duration: 0.6,
    });
  }

  useEffect(() => {
    let cancelled = false;
    let onEnter: (() => void) | undefined;
    let onLeave: (() => void) | undefined;
    const shell = shellRef.current;

    void (async () => {
      const L = await import("leaflet");

      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        touchZoom: true,
        dragging: true,
        boxZoom: true,
        minZoom: 5,
        maxZoom: 18,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
      drawRoute(L, map);

      onEnter = () => map.scrollWheelZoom.enable();
      onLeave = () => map.scrollWheelZoom.disable();
      shell?.addEventListener("mouseenter", onEnter);
      shell?.addEventListener("mouseleave", onLeave);
    })();

    return () => {
      cancelled = true;
      if (shell && onEnter && onLeave) {
        shell.removeEventListener("mouseenter", onEnter);
        shell.removeEventListener("mouseleave", onLeave);
      }
      mapRef.current?.remove();
      mapRef.current = null;
      lineRef.current = null;
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init map once
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      if (mapRef.current) drawRoute(L, mapRef.current);
    });
  }, [route]);

  function drawRoute(L: typeof import("leaflet"), map: LeafletMap) {
    for (const marker of markersRef.current) {
      map.removeLayer(marker);
    }
    markersRef.current = [];

    if (lineRef.current) {
      map.removeLayer(lineRef.current);
      lineRef.current = null;
    }

    const originIcon = L.divIcon({
      className: "route-pin-wrap",
      html: `<div class="route-pin route-pin-origin animate-pin-drop"><span>A</span></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const destIcon = L.divIcon({
      className: "route-pin-wrap",
      html: `<div class="route-pin route-pin-dest animate-pin-drop stagger-2"><span>B</span></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const originMarker = L.marker([route.origin.latitude, route.origin.longitude], { icon: originIcon });
    originMarker.addTo(map);
    markersRef.current.push(originMarker);

    const destMarker = L.marker([route.destination.latitude, route.destination.longitude], {
      icon: destIcon,
    });
    destMarker.addTo(map);
    markersRef.current.push(destMarker);

    const line = L.polyline(route.coordinates, {
      className: "route-line-path",
      color: getComputedStyle(document.documentElement).getPropertyValue("--brand-primary").trim() || "#1b4332",
      weight: 4,
      opacity: 0.92,
      lineCap: "round",
      lineJoin: "round",
    });
    line.addTo(map);
    lineRef.current = line;

    fitRouteToView(L, map, line);

    requestAnimationFrame(() => {
      map.invalidateSize();
      fitRouteToView(L, map, line);

      const path = containerRef.current?.querySelector(".route-line-path");
      if (path instanceof SVGPathElement) {
        const length = path.getTotalLength();
        path.style.setProperty("--route-length", `${length}`);
        path.classList.add("route-line-draw");
      }
    });
  }

  function handleFitRoute() {
    if (!mapRef.current || !lineRef.current) return;
    import("leaflet").then((L) => {
      if (mapRef.current && lineRef.current) {
        fitRouteToView(L, mapRef.current, lineRef.current);
      }
    });
  }

  return (
    <div ref={shellRef} className="route-map-shell animate-fade-in-up" data-lenis-prevent>
      <div ref={containerRef} className="route-map-canvas" />
      <button
        type="button"
        className="route-map-fit-btn"
        onClick={handleFitRoute}
        title="Fit full route on map"
      >
        Fit route
      </button>
      <p className="route-map-zoom-hint">Scroll on map to zoom · drag to pan</p>
      <div className="route-map-overlay">
        <div className="route-map-chip">
          <span className="route-map-chip-label">Collection</span>
          <span className="route-map-chip-value">{route.origin.postcode}</span>
        </div>
        <div className="route-map-chip route-map-chip-mid">
          <span className="route-map-chip-label">Road distance</span>
          <span className="route-map-chip-value">
            {route.miles} mi
            {route.durationMinutes != null ? ` · ~${route.durationMinutes} min` : ""}
          </span>
          {route.source === "openrouteservice" && (
            <span className="route-map-chip-badge">HGV route</span>
          )}
        </div>
        <div className="route-map-chip route-map-chip-right">
          <span className="route-map-chip-label">Delivery</span>
          <span className="route-map-chip-value">{route.destination.postcode}</span>
        </div>
      </div>
    </div>
  );
}

export function RouteMapSkeleton() {
  return (
    <div className="route-map-shell route-map-skeleton" aria-hidden>
      <div className="route-map-skeleton-shimmer" />
      <div className="route-map-skeleton-pins">
        <span className="route-map-skeleton-pin" />
        <span className="route-map-skeleton-line" />
        <span className="route-map-skeleton-pin route-map-skeleton-pin-delay" />
      </div>
      <p className="route-map-skeleton-text">Plotting route…</p>
    </div>
  );
}
