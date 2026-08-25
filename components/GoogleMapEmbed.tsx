import { MapPinned } from 'lucide-react';
import { googleMapsEmbedUrl } from '@/lib/google-maps';

export function GoogleMapEmbed({ address, mapsUrl }: { address: string; mapsUrl: string }) {
  const embedUrl = googleMapsEmbedUrl(address);
  if (!embedUrl) return <a className="idea-map-placeholder" href={mapsUrl} target="_blank" rel="noreferrer"><MapPinned size={28} strokeWidth={1.6} aria-hidden="true" />Open in Google Maps</a>;
  return <div className="idea-map-embed"><iframe title={`Map of ${address}`} src={embedUrl} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /><a href={mapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a></div>;
}
