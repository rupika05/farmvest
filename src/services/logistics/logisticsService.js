// AI Logistics Roadmap & Driver Matching Service

export const AVAILABLE_DRIVERS = [
  {
    id: 'drv-01',
    name: 'Arun Kumar',
    phone: '+91 98421 88320',
    email: 'driver@farmvest.demo',
    vehicleType: 'Tata Ace Mini Truck (EV / Eco)',
    vehicleNumber: 'TN 45 BK 2049',
    capacityKg: 1000,
    currentLocation: 'Trichy Ring Road, Sector 3',
    distanceFromFarmerKm: 2.4,
    rating: 4.9,
    tripsCompleted: 342,
    status: 'Available',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    currentGps: {
      lat: 10.7905,
      lng: 78.7047
    }
  },
  {
    id: 'drv-02',
    name: 'Vikram Singh',
    phone: '+91 94432 10984',
    email: 'vikram.logistics@farmvest.demo',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    vehicleNumber: 'TN 48 AM 8812',
    capacityKg: 1500,
    currentLocation: 'Kattur Bypass',
    distanceFromFarmerKm: 5.1,
    rating: 4.8,
    tripsCompleted: 198,
    status: 'Available',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    currentGps: {
      lat: 10.8120,
      lng: 78.6850
    }
  }
];

export function generateLogisticsRoadmap({
  farmerLocation = 'Saranathan Farm, Valley Sector 4',
  retailerLocation = 'FreshMart Hyperstore, Main Junction',
  quantityKg = 100,
  productType = 'Tomato'
}) {
  const driver = AVAILABLE_DRIVERS[0]; // Arun Kumar as primary demo driver
  const distanceKm = 12.4;
  const estimatedTravelTimeMin = 32;
  const pickupEtaMin = 8;
  const deliveryEtaMin = 24;

  const transportFee = 500; // Fair transparent base transport tariff

  return {
    roadmapId: `ROUT-${Math.floor(100000 + Math.random() * 900000)}`,
    generatedAt: new Date().toISOString(),
    aiRouteSummary: 'Optimized via Green Highway 45 — avoids 2 school zone congestion pockets',
    pickup: {
      location: farmerLocation,
      contact: 'Green Valley Farm',
      coordinates: { lat: 10.7482, lng: 78.6534 },
      etaMinutes: pickupEtaMin
    },
    driver: {
      id: driver.id,
      name: driver.name,
      vehicle: driver.vehicleType,
      regNumber: driver.vehicleNumber,
      capacityKg: driver.capacityKg,
      currentDistanceKm: driver.distanceFromFarmerKm,
      rating: driver.rating,
      phone: driver.phone
    },
    destination: {
      location: retailerLocation,
      contact: 'FreshMart (Priya Sharma)',
      coordinates: { lat: 10.8350, lng: 78.6920 },
      etaMinutes: deliveryEtaMin
    },
    metrics: {
      totalDistanceKm: distanceKm,
      totalTimeMinutes: estimatedTravelTimeMin,
      transportFee: transportFee,
      carbonFootprintKg: '1.4 kg CO2e (70% lower with EV routing)',
      coldChainRecommended: false,
      optimalSpeedKmh: 42
    },
    waypoints: [
      { name: 'Saranathan Farm (Origin)', lat: 10.7482, lng: 78.6534, status: 'Pickup Point' },
      { name: 'Valley Checkpoint Road', lat: 10.7680, lng: 78.6720, status: 'Transit Waypoint' },
      { name: 'Trichy Ring Arterial Road', lat: 10.7950, lng: 78.6890, status: 'Transit Waypoint' },
      { name: 'Central Distribution Junction', lat: 10.8180, lng: 78.6850, status: 'Transit Waypoint' },
      { name: 'FreshMart Superstore (Destination)', lat: 10.8350, lng: 78.6920, status: 'Delivery Point' }
    ]
  };
}
