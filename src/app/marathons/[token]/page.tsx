'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
import "ol/ol.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Carousel, Modal, Button } from "react-bootstrap";

// Define interfaces for data types
export interface Detail {
  label: string;
  value: string;
}

export interface Accommodation {
  name: string;
  distance: number; 
  budget: string;
  coordinates: [number, number];
  address: string;
  website: string;
  image: string;
}

export interface Restaurant {
  name: string;
  distance: number;
  budget: string;
  coordinates: [number, number];
  address: string;
  website: string;
  image: string;
}

export interface Attraction {
  name: string;
  description: string;
  coordinates: [number, number];
  address: string;
  website: string;
  image: string;
}

export interface ImageInfo {
  src: string;
  width: number;
  height: number;
}

export interface MarathonDetail {
  token: string;
  name: string;
  date: string;
  location: string;
  distance: string;
  description: string;
  details: Detail[];
  accommodations: Accommodation[];
  restaurants: Restaurant[];
  attractions: Attraction[];
  mapCenter: [number, number];
  route: [number, number][];
  images: ImageInfo[];
}

// Marker Icons
const icons: Record<string, string> = {
  hotel: 'https://cdn-icons-png.flaticon.com/512/1668/1668966.png',
  restaurant: 'https://img.icons8.com/color/48/000000/restaurant.png',
  attraction: 'https://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/map-marker-icon.png',
  start: 'https://cdn-icons-png.flaticon.com/512/1945/1945064.png', 
  finish: 'https://cdn-icons-png.flaticon.com/512/783/783470.png' 
}

// Import marathon details data from an external file
import { marathonDetails } from '@/app/data/marathons';

// Function to create markers
const createMarker = (
  coords: [number, number],
  id: string,
  name: string,
  address: string,
  distance: string | null,
  type: 'hotel' | 'restaurant' | 'attraction' | 'start' | 'finish',
  website: string,
  vectorSource: VectorSource
): Feature => {
  const iconScale = type === 'hotel' ? 0.06 : 
                   type === 'attraction' ? 0.04 : 
                   type === 'start' || type === 'finish' ? 0.08 : 
                   0.7;
  
  const feature = new Feature({
    geometry: new Point(fromLonLat(coords)),
    name: name,
    address: address,
    distance: distance,
    type: type,
    website: website
  });

  feature.setId(id);
  feature.setStyle(
    new Style({
      image: new Icon({
        src: icons[type],
        scale: iconScale,
      }),
    })
  );

  vectorSource.addFeature(feature);
  return feature;
};

export default function MarathonDetailPage({ params }: { params: { token: string } }) {
  const marathon = marathonDetails.find((m) => m.token === params.token) as MarathonDetail | undefined || null;
  const [showMapModal, setShowMapModal] = useState(false);
  const [activeMapFeature, setActiveMapFeature] = useState<{ 
    name?: string; 
    address?: string; 
    distance?: string | null; 
    type?: string;
    website?: string;
  } | null>(null);
  
  // Small map refs
  const smallMapRef = useRef<HTMLDivElement | null>(null);
  const smallMapInstance = useRef<OLMap | null>(null);
  const smallMapPopupRef = useRef<HTMLDivElement | null>(null);
  const smallMapOverlayRef = useRef<Overlay | null>(null);
  
  // Large modal map refs
  const largeMapRef = useRef<HTMLDivElement | null>(null);
  const largeMapInstance = useRef<OLMap | null>(null);
  const largeMapPopupRef = useRef<HTMLDivElement | null>(null);
  const largeMapOverlayRef = useRef<Overlay | null>(null);
  
  // Initialize small map
  useEffect(() => {
    if (!marathon || !smallMapRef.current || smallMapInstance.current) return;
    
    // Create small map instance
    smallMapInstance.current = new OLMap({
      target: smallMapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat(marathon.mapCenter),
        zoom: 13,
      }),
      controls: [], // Minimal controls for the small map
    });
    
    // Create popup for small map
    smallMapPopupRef.current = document.createElement('div');
    smallMapPopupRef.current.className = 'ol-popup-small';
    smallMapPopupRef.current.style.position = 'absolute';
    smallMapPopupRef.current.style.background = 'white';
    smallMapPopupRef.current.style.padding = '10px';
    smallMapPopupRef.current.style.borderRadius = '5px';
    smallMapPopupRef.current.style.minWidth = '200px';
    smallMapPopupRef.current.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
    smallMapPopupRef.current.style.display = 'none';
    smallMapPopupRef.current.style.zIndex = '1000';
    
    smallMapOverlayRef.current = new Overlay({
      element: smallMapPopupRef.current,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10]
    });
    
    smallMapInstance.current.addOverlay(smallMapOverlayRef.current);
    
    // Create vector source for markers
    const vectorSource = new VectorSource();
    const markerLayer = new VectorLayer({ source: vectorSource });
    smallMapInstance.current.addLayer(markerLayer);
    
    // Add START and FINISH markers from route array
    if (marathon.route && marathon.route.length >= 2) {
      const startCoords = marathon.route[0];
      let finishCoords = marathon.route[marathon.route.length - 1];
      
      // Add START marker
      createMarker(
        startCoords,
        'start-marker',
        'Старт марафона',
        'Место старта марафона',
        null,
        'start',
        '',
        vectorSource
      );
      
      // Check if start and finish are at the same location
      const sameLocation = startCoords[0] === finishCoords[0] && startCoords[1] === finishCoords[1];
      
      // If same location, add a small offset to finish marker so both are visible
      if (sameLocation) {
        finishCoords = [finishCoords[0] + 0.001, finishCoords[1] + 0.001];
      }
      
      // Always add FINISH marker
      createMarker(
        finishCoords,
        'finish-marker',
        'Финиш марафона',
        'Место финиша марафона',
        null,
        'finish',
        '',
        vectorSource
      );
    }
    
    // Add accommodation markers
    marathon.accommodations.forEach((hotel, index) => {
      if (hotel.coordinates) {
        createMarker(
          hotel.coordinates,
          `hotel-${index}`,
          hotel.name,
          hotel.address,
          `${hotel.distance} км`,
          'hotel',
          hotel.website,
          vectorSource
        );
      }
    });
    
    // Add restaurant markers
    marathon.restaurants.forEach((restaurant, index) => {
      if (restaurant.coordinates) {
        createMarker(
          restaurant.coordinates,
          `restaurant-${index}`,
          restaurant.name,
          restaurant.address,
          `${restaurant.distance} км`,
          'restaurant',
          restaurant.website,
          vectorSource
        );
      }
    });
    
    // Add attraction markers
    marathon.attractions.forEach((attraction, index) => {
      if (attraction.coordinates) {
        createMarker(
          attraction.coordinates,
          `attraction-${index}`,
          attraction.name,
          attraction.address,
          null,
          'attraction',
          attraction.website,
          vectorSource
        );
      }
    });
    
    // Small map click handler for markers
    smallMapInstance.current.on('click', (event) => {
      if (!smallMapInstance.current || !smallMapPopupRef.current || !smallMapOverlayRef.current) return;
      
      const feature = smallMapInstance.current.forEachFeatureAtPixel(
        event.pixel, 
        (feat) => feat as Feature
      );
      
      if (feature && feature.getProperties().name) {
        const props = feature.getProperties();
        
        smallMapOverlayRef.current.setPosition(event.coordinate);
        
        let popupContent = '';
        if (props.type === 'start' || props.type === 'finish') {
          popupContent = `
            <div class="popup-content" style="cursor: default; position: relative; padding: 5px;">
              <button id="small-close-popup" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 16px; cursor: pointer;">×</button>
              <h6 style="margin-bottom: 5px;">${props.name}</h6>
              <p style="font-size: 12px; margin-bottom: 5px;">
                📍 ${props.address}
              </p>
            </div>
          `;
        } else {
          popupContent = `
            <div class="popup-content" style="cursor: pointer; position: relative; padding: 5px;">
              <button id="small-close-popup" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 16px; cursor: pointer;">×</button>
              <h6 style="margin-bottom: 5px;">${props.name}</h6>
              <p style="font-size: 12px; margin-bottom: 5px;">
                📍 ${props.address}<br>
                ${props.distance ? `📏 Расстояние: ${props.distance}` : ''}
              </p>
              <div class="text-center">
                <button id="small-view-website" class="btn btn-sm btn-primary" style="font-size: 12px; padding: 2px 8px;">
                  Перейти на сайт
                </button>
              </div>
            </div>
          `;
        }
        
        smallMapPopupRef.current.innerHTML = popupContent;
        smallMapPopupRef.current.style.display = 'block';
        
        // Add click listeners
        const closeButton = smallMapPopupRef.current.querySelector('#small-close-popup');
        if (closeButton) {
          closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            smallMapPopupRef.current!.style.display = 'none';
          });
        }
        
        const viewWebsiteButton = smallMapPopupRef.current.querySelector('#small-view-website');
        if (viewWebsiteButton && props.website) {
          viewWebsiteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(props.website, '_blank');
          });
        }
        
        // Make entire popup clickable for non-start/finish markers
        const popupContentEl = smallMapPopupRef.current.querySelector('.popup-content');
        if (popupContentEl && props.website && props.type !== 'start' && props.type !== 'finish') {
          popupContentEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            // Avoid opening website when clicking close button
            if (target.id !== 'small-close-popup') {
              window.open(props.website, '_blank');
            }
          });
        }
      } else {
        // If user clicks elsewhere on the map (not on a marker)
        if (smallMapPopupRef.current.style.display === 'block') {
          smallMapPopupRef.current.style.display = 'none';
        } else {
          setShowMapModal(true);
        }
      }
    });
    
    // Add "Click to expand" overlay
    const expandHintEl = document.createElement('div');
    expandHintEl.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
      ">
        Нажмите для увеличения
      </div>
    `;
    
    smallMapRef.current.appendChild(expandHintEl);
    const hintDiv = expandHintEl.firstElementChild as HTMLElement;
    
    // Show hint on hover
    smallMapRef.current.addEventListener('mouseenter', () => {
      if (hintDiv) hintDiv.style.opacity = '1';
    });
    
    smallMapRef.current.addEventListener('mouseleave', () => {
      if (hintDiv) hintDiv.style.opacity = '0';
    });
    
  }, [marathon]);
  
  // Initialize large modal map
  useEffect(() => {
    if (!showMapModal || !marathon || !largeMapRef.current) return;
    
    if (largeMapInstance.current) {
      // Reset map if it already exists
      largeMapInstance.current.setTarget(undefined);
      largeMapInstance.current = null;
    }
    
    // Create large map instance
    largeMapInstance.current = new OLMap({
      target: largeMapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat(marathon.mapCenter),
        zoom: 13,
      }),
    });
    
    // Create vector source for markers
    const vectorSource = new VectorSource();
    const markerLayer = new VectorLayer({ source: vectorSource });
    largeMapInstance.current.addLayer(markerLayer);
    
    // Create popup for map
    largeMapPopupRef.current = document.createElement('div');
    largeMapPopupRef.current.className = 'ol-popup';
    largeMapPopupRef.current.style.position = 'absolute';
    largeMapPopupRef.current.style.background = 'white';
    largeMapPopupRef.current.style.padding = '15px';
    largeMapPopupRef.current.style.borderRadius = '5px';
    largeMapPopupRef.current.style.minWidth = '280px';
    largeMapPopupRef.current.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
    largeMapPopupRef.current.style.display = 'none';
    largeMapPopupRef.current.style.zIndex = '1000';
    
    largeMapOverlayRef.current = new Overlay({
      element: largeMapPopupRef.current,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10]
    });
    
    largeMapInstance.current.addOverlay(largeMapOverlayRef.current);
    
    // Add START and FINISH markers from route array
    if (marathon.route && marathon.route.length >= 2) {
      const startCoords = marathon.route[0];
      let finishCoords = marathon.route[marathon.route.length - 1];
      
      // Add START marker
      createMarker(
        startCoords,
        'start-marker',
        'Старт марафона',
        'Место старта марафона',
        null,
        'start',
        '',
        vectorSource
      );
      
      // Check if start and finish are at the same location
      const sameLocation = startCoords[0] === finishCoords[0] && startCoords[1] === finishCoords[1];
      
      // If same location, add a small offset to finish marker so both are visible
      if (sameLocation) {
        finishCoords = [finishCoords[0] + 0.001, finishCoords[1] + 0.001];
      }
      
      // Always add FINISH marker
      createMarker(
        finishCoords,
        'finish-marker',
        'Финиш марафона',
        'Место финиша марафона',
        null,
        'finish',
        '',
        vectorSource
      );
    }
    
    // Add accommodation markers
    marathon.accommodations.forEach((hotel, index) => {
      if (hotel.coordinates) {
        createMarker(
          hotel.coordinates,
          `hotel-${index}`,
          hotel.name,
          hotel.address,
          `${hotel.distance} км`,
          'hotel',
          hotel.website,
          vectorSource
        );
      }
    });
    
    // Add restaurant markers
    marathon.restaurants.forEach((restaurant, index) => {
      if (restaurant.coordinates) {
        createMarker(
          restaurant.coordinates,
          `restaurant-${index}`,
          restaurant.name,
          restaurant.address,
          `${restaurant.distance} км`,
          'restaurant',
          restaurant.website,
          vectorSource
        );
      }
    });
    
    // Add attraction markers
    marathon.attractions.forEach((attraction, index) => {
      if (attraction.coordinates) {
        createMarker(
          attraction.coordinates,
          `attraction-${index}`,
          attraction.name,
          attraction.address,
          null,
          'attraction',
          attraction.website,
          vectorSource
        );
      }
    });
    
    // Add click interaction for markers
    largeMapInstance.current.on('click', (event) => {
      if (!largeMapInstance.current || !largeMapPopupRef.current || !largeMapOverlayRef.current) return;
      
      const feature = largeMapInstance.current.forEachFeatureAtPixel(
        event.pixel, 
        (feat) => feat as Feature
      );
      
      if (feature && feature.getProperties().name) {
        const props = feature.getProperties();
        setActiveMapFeature(props);
        
        largeMapOverlayRef.current.setPosition(event.coordinate);
        
        let popupContent = '';
        if (props.type === 'start' || props.type === 'finish') {
          popupContent = `
            <div class="popup-content" style="cursor: default; position: relative; padding: 10px;">
              <button id="close-popup" style="position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
              <h5>${props.name}</h5>
              <p>📍 ${props.address}</p>
            </div>
          `;
        } else {
          popupContent = `
            <div class="popup-content" style="cursor: pointer; position: relative; padding: 10px;">
              <button id="close-popup" style="position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
              <h5>${props.name}</h5>
              <p>
                📍 ${props.address}<br>
                ${props.distance ? `📏 Расстояние до старта: ${props.distance}` : ''}
              </p>
              <div class="d-flex justify-content-between">
                <button id="scroll-to-section" class="btn btn-sm btn-secondary">Найти на странице</button>
                <button id="view-website" class="btn btn-sm btn-primary">Перейти на сайт</button>
              </div>
            </div>
          `;
        }
        
        largeMapPopupRef.current.innerHTML = popupContent;
        largeMapPopupRef.current.style.display = 'block';
        
        // Close button listener
        const closeButton = largeMapPopupRef.current.querySelector('#close-popup');
        if (closeButton) {
          closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            largeMapPopupRef.current!.style.display = 'none';
            setActiveMapFeature(null);
          });
        }
        
        // Website button listener
        const websiteButton = largeMapPopupRef.current.querySelector('#view-website');
        if (websiteButton && props.website) {
          websiteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(props.website, '_blank');
          });
        }
        
        // Scroll to section button listener
        const scrollButton = largeMapPopupRef.current.querySelector('#scroll-to-section');
        if (scrollButton && props.type !== 'start' && props.type !== 'finish') {
          scrollButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Find the corresponding section on the page
            let section: HTMLElement | null = null;
            if (props.type === 'hotel') {
              section = document.getElementById('accommodations-section');
            } else if (props.type === 'restaurant') {
              section = document.getElementById('restaurants-section');
            } else if (props.type === 'attraction') {
              section = document.getElementById('attractions-section');
            }
            
            if (section) {
              setShowMapModal(false);
              setTimeout(() => {
                section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 500);
            }
          });
        }
        
        // Make entire popup clickable to open website for non-start/finish markers
        const popupContentEl = largeMapPopupRef.current.querySelector('.popup-content');
        if (popupContentEl && props.website && props.type !== 'start' && props.type !== 'finish') {
          popupContentEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            
            // Only open website if we're not clicking buttons
            if (
              target.id !== 'close-popup' && 
              target.id !== 'view-website' && 
              target.id !== 'scroll-to-section' &&
              !target.closest('#close-popup') &&
              !target.closest('#view-website') &&
              !target.closest('#scroll-to-section')
            ) {
              window.open(props.website, '_blank');
            }
          });
        }
      } else {
        largeMapPopupRef.current.style.display = 'none';
        setActiveMapFeature(null);
      }
    });
    
    // Hover interaction for markers
    largeMapInstance.current.on('pointermove', (event) => {
      if (!largeMapInstance.current) return;
      
      if (event.dragging) return;
      
      const pixel = largeMapInstance.current.getEventPixel(event.originalEvent);
      const feature = largeMapInstance.current.forEachFeatureAtPixel(
        pixel, 
        (feat) => feat as Feature
      );
      
      if (feature && feature.getProperties().name) {
        largeMapInstance.current.getTargetElement().style.cursor = 'pointer';
      } else {
        largeMapInstance.current.getTargetElement().style.cursor = '';
      }
    });
    
  }, [showMapModal, marathon]);
  
  if (!marathon) {
    return (
      <div className="container my-5">
        <Link href="/marathons">
          <button className="btn btn-secondary mb-4">&larr; Вернуться к списку марафонов</button>
        </Link>
        <h1 className="text-center">Марафон не найден.</h1>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <Link href="/marathons">
        <button className="btn btn-secondary mb-4">&larr; Вернуться к списку марафонов</button>
      </Link>
      <h1 className="text-center mb-4">{marathon.name}</h1>

      {/* Carousel with standardized image sizes */}
      {marathon.images && marathon.images.length > 0 && (
        <Carousel className="mb-4" interval={2000} fade={true}>
          {marathon.images.map((image, idx) => (
            <Carousel.Item key={idx}>
              <div style={{ 
                width: '100%', 
                height: '500px', 
                overflow: 'hidden', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px'
              }}>
                <img
                  src={image.src}
                  alt={`${marathon.name} slide ${idx + 1}`}
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      )}      

      {/* Marathon Description and Map in a two-column layout */}
      <div className="row mb-5">
        {/* Left column: Marathon Description */}
        <div className="col-md-8">
          <h3>Описание марафона</h3>
          <p>{marathon.description}</p>
          <ul>
            <li>
              <strong>Дата:</strong>{" "}
              {new Date(marathon.date).toLocaleDateString("ru-RU")}
            </li>
            <li>
              <strong>Место:</strong> {marathon.location}
            </li>
            <li>
              <strong>Дистанция:</strong> {marathon.distance}
            </li>
            {marathon.details.map((detail, idx) => (
              <li key={idx}>
                <strong>{detail.label}:</strong> {detail.value}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Right column: Interactive Map */}
        <div className="col-md-4">
          <h3>Карта марафона</h3>
          <div 
            ref={smallMapRef}
            className="mb-3"
            style={{
              width: '100%',
              height: '250px',
              borderRadius: '10px',
              boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              position: 'relative'
            }}
          />
          <div className="text-center">
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowMapModal(true)}
            >
              Открыть полную карту
            </button>
          </div>
        </div>
      </div>

      {/* Section for accommodations with image backgrounds */}
      <section className="mb-5" id="accommodations-section">
        <h3>Места размещения рядом со стартом</h3>
        <p>
          Ниже приведён список отелей и гостиниц, расположенных вблизи старта марафона.
          Выберите вариант, исходя из расстояния до старта и вашего бюджета.
        </p>
        <div className="row">
          {marathon.accommodations.map((item, idx) => (
            <div key={idx} className="col-md-4 mb-3">
              <div 
                className="card p-0 overflow-hidden h-100"
                style={{ 
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  borderRadius: '10px'
                }}
              >
                <div 
                  style={{ 
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '150px'
                  }}
                />
                <div className="card-body">
                  <h5>{item.name}</h5>
                  <p>
                    <strong>Адрес:</strong> {item.address}<br />
                    <strong>Расстояние до старта:</strong> {item.distance} км<br />
                    <strong>Бюджет:</strong> {item.budget}
                  </p>
                  {item.website && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => window.open(item.website, "_blank")}>
                      Перейти на сайт
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section for restaurants with image backgrounds */}
      <section className="mb-5" id="restaurants-section">
        <h3>Рестораны рядом со стартом</h3>
        <p>
          Ниже приведён список ресторанов, где можно пообедать или перекусить перед марафоном.
        </p>
        <div className="row">
          {marathon.restaurants.map((item, idx) => (
            <div key={idx} className="col-md-4 mb-3">
              <div 
                className="card p-0 overflow-hidden h-100"
                style={{ 
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  borderRadius: '10px'
                }}
              >
                <div 
                  style={{ 
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '150px'
                  }}
                />
                <div className="card-body">
                  <h5>{item.name}</h5>
                  <p>
                    <strong>Адрес:</strong> {item.address}<br />
                    <strong>Расстояние до старта:</strong> {item.distance} км<br />
                    <strong>Бюджет:</strong> {item.budget}
                  </p>
                  {item.website && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => window.open(item.website, "_blank")}>
                      Перейти на сайт
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section for attractions with image backgrounds */}
      <section className="mb-5" id="attractions-section">
        <h3>Интересные места для путешествий</h3>
        <p>
          Помимо марафонской трассы, город предлагает множество достопримечательностей.
          Ниже приведён список мест, которые стоит посетить.
        </p>
        <div className="row">
          {marathon.attractions.map((attr, idx) => (
            <div key={idx} className="col-md-4 mb-3">
              <div 
                className="card p-0 overflow-hidden h-100"
                style={{ 
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  borderRadius: '10px'
                }}
              >
                <div 
                  style={{ 
                    backgroundImage: `url(${attr.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '150px'
                  }}
                />
                <div className="card-body">
                  <h5>{attr.name}</h5>
                  <p>{attr.description}</p>
                  <p><strong>Адрес:</strong> {attr.address}</p>
                  {attr.website && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => window.open(attr.website, "_blank")}>
                      Подробнее на сайте
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full Map Modal */}
      <Modal 
        show={showMapModal} 
        onHide={() => setShowMapModal(false)} 
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Карта марафона {marathon.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            ref={largeMapRef}
            style={{
              width: '100%',
              height: '70vh',
              borderRadius: '10px'
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <div>
              <span className="me-3">
                <img src={icons.start} alt="Start" style={{ width: '20px' }} /> Старт марафона
              </span>
              <span className="me-3">
                <img src={icons.finish} alt="Finish" style={{ width: '20px' }} /> Финиш марафона
              </span>
              <span className="me-3">
                <img src={icons.hotel} alt="Hotel" style={{ width: '20px' }} /> Отели
              </span>
              <span className="me-3">
                <img src={icons.restaurant} alt="Restaurant" style={{ width: '20px' }} /> Рестораны
              </span>
              <span>
                <img src={icons.attraction} alt="Attraction" style={{ width: '20px' }} /> Достопримечательности
              </span>
            </div>
            <Button variant="secondary" onClick={() => setShowMapModal(false)}>
              Закрыть
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
