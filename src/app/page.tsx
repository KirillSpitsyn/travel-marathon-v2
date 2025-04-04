'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapBrowserEvent } from 'ol';
import { Map as OLMap, View, Overlay } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { FeatureLike } from 'ol/Feature';
import Link from 'next/link';
import 'ol/ol.css';
import { marathonsData } from '@/app/data/marathons';

// Define types for marathon data
interface Marathon {
  name: string;
  date: string;
  location: string;
  distance: string;
  description: string;
  logo: string;
  token?: string;
  coordinates: number[];
  sortOrder: number;
}

// Type guard to check if a feature is a real Feature
const isRealFeature = (feature: FeatureLike): feature is Feature => {
  return feature instanceof Feature;
};

const MarathonMap = () => {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<OLMap | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFeature, setCurrentFeature] = useState<Feature | null>(null);
  const [currentMarathon, setCurrentMarathon] = useState<Marathon | null>(null);
  
  // Get the current date for filtering
  const currentDate = new Date();
  
  // Sort marathons by date to get upcoming ones
  const upcomingMarathons = [...marathonsData]
    .filter((m: Marathon) => {
      // Parse the date - handle both ISO format and other formats
      const marathonDate = new Date(m.date);
      return marathonDate > currentDate;
    })
    .sort((a: Marathon, b: Marathon) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    })
    .slice(0, 5); // Get the next 5 upcoming marathons

  // Create a Set of upcoming marathon names for efficient lookup - using names instead of tokens
  const upcomingMarathonNames = new Set(upcomingMarathons.map(m => m.name));

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize OpenLayers Map
    mapInstance.current = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([37.618423, 55.751244]), // Default center at Moscow
        zoom: 5,
      }),
    });

    // Create a vector source to hold marathon markers
    const vectorSource = new VectorSource();
    markerLayerRef.current = new VectorLayer({ source: vectorSource });
    mapInstance.current.addLayer(markerLayerRef.current);

    // Initialize a popup overlay
    overlayRef.current = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      stopEvent: true,  // Allow interaction with popup
      offset: [0, -10],
    });
    mapInstance.current.addOverlay(overlayRef.current);

    // Marathon lookup map
    const marathonMap = new Map<string, Marathon>();
    
    // Create regular marathon markers
    marathonsData.forEach((marathon: Marathon) => {
      // Check if this marathon is in the top 5 upcoming ones using the name Set
      const isUpcoming = upcomingMarathonNames.has(marathon.name);
      
      // Create feature for each marathon
      const feature = new Feature({
        geometry: new Point(fromLonLat(marathon.coordinates)),
      });

      // Different styling for upcoming marathons
      feature.setStyle(
        new Style({
          image: new Icon({
            src: 'https://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/map-marker-icon.png',
            scale: 0.04,
            // Use green for upcoming marathons, red for others
            color: isUpcoming ? '#00C853' : undefined
          }),
        })
      );

      vectorSource.addFeature(feature);
      feature.setId(marathon.name);
      marathonMap.set(marathon.name as string, marathon);
    });

    // Function to show popup for a feature
    const showPopupForFeature = (feature: FeatureLike) => {
      // Use type guard to ensure we have a real Feature
      if (!isRealFeature(feature)) return;

      const marathonName = feature.getId() as string;
      const marathon = marathonMap.get(marathonName);
      if (marathon) {
        const geometry = feature.getGeometry();
        if (geometry) {
          const coordinate = (geometry as Point).getCoordinates();
          overlayRef.current?.setPosition(coordinate);
          
          if (popupRef.current) {
            const formattedDate = new Date(marathon.date).toLocaleDateString('ru-RU');
            popupRef.current.innerHTML = `
              <div id="marathon-popup" style="padding: 10px; width: 250px; text-align: center; position: relative; cursor: pointer;">
                <button id="close-popup" style="position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                <h5 style="margin: 0 0 8px 0;">${marathon.name}</h5>
                <p style="margin: 0 0 5px 0;">📅 ${formattedDate}<br>
                📍 ${marathon.location}<br>
                🏁 ${marathon.distance}</p>
                ${marathon.token ? 
                  `<div style="display: inline-block; background-color: #6c757d; color: white; 
                    padding: 5px 10px; border-radius: 5px; margin-top: 8px;">
                    Подробнее о марафоне
                  </div>` : 
                  ''}
              </div>
            `;
            popupRef.current.style.display = 'block';
            
            // Add event listeners
            const closeButton = popupRef.current.querySelector('#close-popup');
            const popupContent = popupRef.current.querySelector('#marathon-popup');
            
            // Close button listener
            if (closeButton) {
              closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (popupRef.current) popupRef.current.style.display = 'none';
                setCurrentFeature(null);
                setCurrentMarathon(null);
              });
            }
            
            // Popup content click listener
            if (popupContent && marathon.token) {
              popupContent.addEventListener('click', (e) => {
                // Prevent multiple navigation calls
                e.stopPropagation();
                router.push(`/marathons/${marathon.token}`);
              });
            }
          }
          
          // Keep track of current feature and marathon
          setCurrentFeature(feature);
          setCurrentMarathon(marathon);
        }
      }
    };

    // Pointer move interaction
    if (mapInstance.current) {
      mapInstance.current.on('pointermove', function(e: MapBrowserEvent<UIEvent>) {
        if (e.dragging) return;
        if (!mapInstance.current) return;
        
        const pixel = mapInstance.current.getEventPixel(e.originalEvent);
        const feature = mapInstance.current.forEachFeatureAtPixel(
          pixel, 
          (feat: FeatureLike) => {
            // Only return Feature instances
            return isRealFeature(feat) ? feat : null;
          }
        );
        
        // Only show popup for a new feature if no popup is currently open
        if (feature && !currentFeature) {
          showPopupForFeature(feature);
        }
      });

      // Click handler with navigation
      mapInstance.current.on('click', (event: MapBrowserEvent<UIEvent>) => {
        if (!mapInstance.current) return;
        
        const pixel = event.pixel;
        const clickedFeature = mapInstance.current.forEachFeatureAtPixel(
          pixel, 
          (feat: FeatureLike) => {
            // Only return Feature instances
            return isRealFeature(feat) ? feat : null;
          }
        );
        
        if (clickedFeature) {
          // If not already showing this feature's popup, show it
          if (currentFeature !== clickedFeature) {
            showPopupForFeature(clickedFeature);
          }
        } else {
          // Clicked outside any feature, hide popup
          if (popupRef.current) {
            popupRef.current.style.display = 'none';
            setCurrentFeature(null);
            setCurrentMarathon(null);
          }
        }
      });

      // Add global click listener to close popup when clicking outside map
      const globalClickHandler = (e: MouseEvent) => {
        // Check if the click is outside the map and popup
        if (mapRef.current && popupRef.current) {
          const mapElement = mapRef.current;
          const popupElement = popupRef.current;
          
          if (!mapElement.contains(e.target as Node) && 
              !popupElement.contains(e.target as Node)) {
            popupElement.style.display = 'none';
            setCurrentFeature(null);
            setCurrentMarathon(null);
          }
        }
      };
      
      document.addEventListener('click', globalClickHandler);

      // Cleanup
      return () => {
        document.removeEventListener('click', globalClickHandler);
      };
    }

    setTimeout(() => setIsLoading(false), 1000);
  }, [router, upcomingMarathons]);

  return (
    <div>
      <div className="text-center py-4">
        <h1 className="text-center mb-4">Карта Марафонов России</h1>
      </div>     

      <div className="container flex-grow-1 d-flex flex-column position-relative">
        {/* Upcoming Marathons */}
        <div className="mb-4">
          <h3 className="mb-3">Ближайшие марафоны</h3>
          <div className="row row-cols-1 row-cols-md-3 row-cols-lg-5 g-3">
            {upcomingMarathons.map((marathon: Marathon, idx: number) => (
              <div key={idx} className="col">
                <Link 
                  href={marathon.token ? `/marathons/${marathon.token}` : '#'} 
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="card h-100 shadow-sm">
                    <img 
                      src={marathon.logo} 
                      className="card-img-top p-2" 
                      alt={`${marathon.name} logo`}
                      style={{ height: '140px', objectFit: 'contain' }}
                    />
                    <div className="card-body text-center">
                      <h6 className="card-title">{marathon.name}</h6>
                      <p className="card-text">
                        📅 {new Date(marathon.date).toLocaleDateString('ru-RU')}<br />
                        📍 {marathon.location}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="position-absolute top-50 start-50 translate-middle bg-white p-3 rounded shadow">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div
          ref={mapRef}
          className="flex-grow-1 position-relative"
          style={{
            width: '100%',
            height: '600px',
            minHeight: '600px',
            borderRadius: '10px',
            boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
          }}
        />

        {/* Popup Overlay */}
        <div
          ref={popupRef}
          style={{
            display: 'none',
            position: 'absolute',
            background: 'white',
            padding: '0',
            borderRadius: '5px',
            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
            fontSize: '14px',
            minWidth: '250px',
            maxWidth: '300px',
          }}
        />
      </div>
    </div>
  );
};

export default MarathonMap;