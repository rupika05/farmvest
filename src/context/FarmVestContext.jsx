import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { io } from 'socket.io-client';
import { generateLogisticsRoadmap } from '../services/logistics/logisticsService';
import { blockchain } from '../services/blockchain/blockchainService';
import { calculateEscrowBreakdown, simulateEscrowRelease } from '../services/payments/escrowService';
import { getCropImage } from '../utils/cropImages';

const FarmVestContext = createContext();

const PRODUCTS_KEY = 'farmvest_products_v2';
const ORDERS_KEY = 'farmvest_orders_v2';
const ACTIVE_ORDER_KEY = 'farmvest_active_order_v2';

export function FarmVestProvider({ children }) {
  // Products list (starts fresh from localStorage with verified vegetable images)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(p => ({ ...p, image: getCropImage(p) }));
      }
      return [];
    } catch {
      return [];
    }
  });

  // Orders list
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active ongoing order undergoing the 10-step lifecycle
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_ORDER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Real-time notifications
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-init',
      title: 'FarmVest Network Ready 🌱',
      message: 'AI quality grading, live GPS routing, and smart escrow initialized.',
      time: 'Just now',
      role: 'all',
      type: 'info'
    }
  ]);
  const [activeToast, setActiveToast] = useState(null);

  // Live GPS simulation state
  const [gpsData, setGpsData] = useState({
    isActive: false,
    progress: 0,
    currentLat: 10.7482,
    currentLng: 78.6534,
    speedKmh: 0,
    distanceRemainingKm: 12.4,
    etaMinutes: 32,
    heading: 'North-East',
    status: 'Idle',
    lastUpdate: new Date().toLocaleTimeString()
  });

  const [blocks, setBlocks] = useState(blockchain.getRecentTransactions());
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [selectedQrBatch, setSelectedQrBatch] = useState(null);

  const gpsIntervalRef = useRef(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem(ACTIVE_ORDER_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeOrder]);

  // Sync state across multiple open tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === PRODUCTS_KEY && e.newValue) {
        setProducts(JSON.parse(e.newValue));
      }
      if (e.key === ORDERS_KEY && e.newValue) {
        setOrders(JSON.parse(e.newValue));
      }
      if (e.key === ACTIVE_ORDER_KEY) {
        setActiveOrder(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch products from backend database & connect socket
  useEffect(() => {
    // 1. Fetch products from backend database
    fetch('http://localhost:5000/api/products')
      .then(r => r.json())
      .then(data => {
        if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(prev => {
            const map = new Map();
            data.products.forEach(p => map.set(p.batchId || p.id, { ...p, image: getCropImage(p) }));
            prev.forEach(p => map.set(p.batchId || p.id, { ...p, image: getCropImage(p) }));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    // 2. Real-time Socket.io listener
    let socket;
    try {
      socket = io('http://localhost:5000', {
        reconnectionAttempts: 3,
        transports: ['websocket', 'polling']
      });

      socket.on('notification:new_order', (data) => {
        if (data?.order) {
          addNotification(
            '🛒 New Order Placed!',
            `Retailer ordered ${data.order.quantity} kg of ${data.order.productName}.`,
            'farmer',
            'info'
          );
        }
      });
    } catch (e) {
      console.warn('Socket error:', e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const addNotification = (title, message, role = 'all', type = 'success') => {
    const notif = {
      id: 'notif-' + Date.now(),
      title,
      message,
      time: 'Just now',
      role,
      type
    };
    setNotifications(prev => [notif, ...prev]);
    setActiveToast(notif);
    setTimeout(() => {
      setActiveToast(current => (current?.id === notif.id ? null : current));
    }, 4500);
  };

  // 1. Farmer publishes product
  const publishProduct = (productData) => {
    const newBatchId = productData.batchId || `FV-${productData.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const tx = blockchain.recordTransaction('BatchRegistered & AIQualityCertified', {
      batchId: newBatchId,
      product: productData.name,
      aiScore: productData.aiGrade?.score || 92,
      grade: productData.aiGrade?.grade || 'Grade A',
      farmer: productData.farmerName || 'Green Valley Farm',
      quantity: `${productData.totalQuantity} ${productData.unit}`
    });

    const imageToUse = (productData.image && productData.image.startsWith('http')) 
      ? productData.image 
      : getCropImage(productData);

    const newProd = {
      ...productData,
      id: 'prod-' + Date.now(),
      batchId: newBatchId,
      image: imageToUse,
      availableQuantity: productData.totalQuantity,
      status: 'Available',
      createdAt: new Date().toISOString(),
      blockchainTx: tx.txHash
    };

    setProducts(prev => [newProd, ...prev]);
    setBlocks(blockchain.getRecentTransactions());
    
    // Sync with backend API if user is authenticated
    try {
      const token = localStorage.getItem('farmvest_token_v3');
      if (token) {
        fetch('http://localhost:5000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newProd.name,
            category: newProd.category,
            totalQuantity: newProd.totalQuantity,
            unit: newProd.unit,
            pricePerKg: newProd.pricePerKg,
            harvestDate: newProd.harvestDate,
            location: newProd.location,
            description: newProd.description,
            image: newProd.image || '',
            aiGrade: newProd.aiGrade,
            batchId: newProd.batchId
          })
        }).catch(err => console.warn('Backend sync failed:', err));
      }
    } catch (e) {
      console.warn(e);
    }

    addNotification(
      '🌾 Product Listed for Sale!',
      `${newProd.name} (${newProd.totalQuantity} ${newProd.unit}) is now live in the Retailer Marketplace. AI Grade: ${newProd.aiGrade?.grade || 'Grade A'}`,
      'farmer',
      'success'
    );

    return newProd;
  };

  // 2. Retailer places order
  const placeOrder = ({ product, quantityKg, retailerName = 'FreshMart Superstores', deliveryAddress = 'FreshMart Hyperstore, Main Junction' }) => {
    const roadmap = generateLogisticsRoadmap({
      farmerLocation: product.location,
      retailerLocation: deliveryAddress,
      quantityKg,
      productType: product.name
    });

    const escrow = calculateEscrowBreakdown(quantityKg, product.pricePerKg, roadmap.metrics.transportFee);

    const tx = blockchain.recordTransaction('OrderEscrowLocked', {
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      batchId: product.batchId,
      product: product.name,
      quantity: `${quantityKg} kg`,
      totalEscrow: `₹${escrow.grandTotal}`,
      farmerLocked: `₹${escrow.productTotal}`,
      driverLocked: `₹${escrow.driverShare}`,
      retailer: retailerName
    });

    const newOrder = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      batchId: product.batchId,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      quantity: quantityKg,
      pricePerKg: product.pricePerKg,
      transportFee: roadmap.metrics.transportFee,
      totalAmount: escrow.grandTotal,
      farmerAmount: escrow.productTotal,
      driverAmount: escrow.driverShare,
      farmerName: product.farmerName,
      farmerLocation: product.location,
      retailerName: retailerName,
      retailerLocation: deliveryAddress,
      aiGrade: product.aiGrade,
      status: 'Ordered', // Ordered -> Waiting for Pickup -> Pickup Requested -> In Transit -> Driver Arrived -> Delivery Requested -> Delivered
      timelineStatus: 'AI Logistics Roadmap Created',
      roadmap,
      escrow,
      driver: roadmap.driver,
      createdAt: new Date().toISOString(),
      blockchainTx: tx.txHash,
      history: [
        { status: 'Product Listed', time: 'Harvest Recorded', done: true },
        { status: 'AI Quality Verified', time: 'AI Certified', done: true, detail: `Score: ${product.aiGrade?.score}/100 (${product.aiGrade?.grade})` },
        { status: 'Retailer Ordered', time: 'Just now', done: true, detail: `${quantityKg} kg ordered by ${retailerName}` },
        { status: 'Driver Assigned', time: 'Pending Driver Acceptance', done: false },
        { status: 'Pickup Handover', time: 'Pending Pickup', done: false },
        { status: 'In Transit & Live GPS', time: 'Pending Pickup Handover', done: false },
        { status: 'Delivery Handover', time: 'Pending Delivery', done: false },
        { status: 'Delivered & Escrow Settled', time: 'Pending Acceptance', done: false }
      ]
    };

    // Update product available quantity
    setProducts(prev => prev.map(p => {
      if (p.id === product.id) {
        return {
          ...p,
          availableQuantity: Math.max(0, p.availableQuantity - quantityKg)
        };
      }
      return p;
    }));

    setOrders(prev => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    setBlocks(blockchain.getRecentTransactions());

    addNotification(
      '🛒 New Order Placed!',
      `Retailer ordered ${quantityKg} kg of ${product.name}. ₹${escrow.grandTotal} secured in Escrow. AI roadmap created & driver dispatched!`,
      'retailer',
      'success'
    );

    addNotification(
      '🚚 Trip Request Available!',
      `New cargo delivery from ${product.farmerName} to ${retailerName} (${quantityKg} kg ${product.name}). Est. Earnings: ₹${roadmap.metrics.transportFee}`,
      'driver',
      'info'
    );

    return newOrder;
  };

  // 3. Driver accepts trip
  const acceptTrip = (orderId) => {
    setActiveOrder(prev => {
      if (!prev || prev.id !== orderId) return prev;
      
      const tx = blockchain.recordTransaction('DriverAssigned & TripAccepted', {
        orderId: prev.id,
        driver: prev.driver.name,
        vehicle: prev.driver.vehicle,
        etaToFarmer: `${prev.roadmap.pickup.etaMinutes} min`
      });

      const updated = {
        ...prev,
        status: 'Waiting for Pickup',
        timelineStatus: `Driver ${prev.driver.name} en-route to farm for pickup`,
        history: prev.history.map(h => {
          if (h.status === 'Driver Assigned') return { ...h, done: true, time: 'Just now', detail: `${prev.driver.name} accepted trip (₹${prev.driverAmount})` };
          return h;
        })
      };

      setBlocks(blockchain.getRecentTransactions());
      return updated;
    });

    addNotification(
      '🚚 Trip Accepted by Driver',
      'Driver Arun Kumar is navigating to farm. Estimated arrival: 8 minutes.',
      'all',
      'info'
    );
  };

  // 4. Pickup Handover: Farmer Requests Handover
  const requestPickupHandover = (orderId) => {
    setActiveOrder(prev => {
      if (!prev || prev.id !== orderId) return prev;
      return {
        ...prev,
        status: 'Pickup Requested',
        timelineStatus: 'Farmer requested pickup handover. Awaiting driver confirmation.'
      };
    });

    addNotification(
      '📦 Pickup Handover Requested by Farmer',
      'Farmer has initiated physical cargo handover. Driver inspection requested.',
      'driver',
      'warning'
    );
  };

  // 5. Pickup Handover: Driver Accepts Handover -> Starts In Transit & GPS
  const acceptPickupHandover = (orderId) => {
    setActiveOrder(prev => {
      if (!prev || prev.id !== orderId) return prev;

      const tx = blockchain.recordTransaction('PickupHandoverConfirmed & InTransit', {
        orderId: prev.id,
        batchId: prev.batchId,
        handoverFrom: prev.farmerName,
        handoverTo: prev.driver.name,
        cargoVerified: `${prev.quantity} kg ${prev.productName}`,
        gpsStatus: 'Live Telemetry Activated'
      });

      const updated = {
        ...prev,
        status: 'In Transit',
        timelineStatus: 'In Transit to Retailer (GPS Active)',
        pickedUpAt: new Date().toISOString(),
        history: prev.history.map(h => {
          if (h.status === 'Pickup Handover') return { ...h, done: true, time: 'Just now', detail: 'Farmer handed over cargo to Driver' };
          if (h.status === 'In Transit & Live GPS') return { ...h, done: true, time: 'Live Now', detail: 'Truck en-route (Speed: 42 km/h)' };
          return h;
        })
      };

      setBlocks(blockchain.getRecentTransactions());
      return updated;
    });

    startGpsSimulation();

    addNotification(
      '✅ Pickup Handover Complete — In Transit!',
      'Cargo verified & loaded. Live GPS tracking is now active for Farmer and Retailer.',
      'all',
      'success'
    );
  };

  // Start live GPS movement
  const startGpsSimulation = () => {
    if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);

    setGpsData({
      isActive: true,
      progress: 5,
      currentLat: 10.7482,
      currentLng: 78.6534,
      speedKmh: 42,
      distanceRemainingKm: 12.0,
      etaMinutes: 24,
      heading: 'North-East',
      status: 'In Transit on Green Highway 45',
      lastUpdate: new Date().toLocaleTimeString()
    });

    let currentProgress = 5;

    gpsIntervalRef.current = setInterval(() => {
      currentProgress += 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(gpsIntervalRef.current);
        
        setActiveOrder(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'Driver Arrived at Destination',
            timelineStatus: 'Driver arrived at Retailer'
          };
        });

        setGpsData(prev => ({
          ...prev,
          progress: 100,
          currentLat: 10.8350,
          currentLng: 78.6920,
          speedKmh: 0,
          distanceRemainingKm: 0.0,
          etaMinutes: 0,
          status: 'Arrived at Retail Destination',
          lastUpdate: new Date().toLocaleTimeString()
        }));

        addNotification(
          '📍 Driver Arrived at Destination',
          'Arun Kumar has arrived at store. Ready for delivery handover.',
          'all',
          'info'
        );
      } else {
        const startLat = 10.7482, startLng = 78.6534;
        const endLat = 10.8350, endLng = 78.6920;
        const ratio = currentProgress / 100;
        const lat = startLat + (endLat - startLat) * ratio;
        const lng = startLng + (endLng - startLng) * ratio;
        const remainingKm = +(12.4 * (1 - ratio)).toFixed(1);
        const remainingMin = Math.ceil(24 * (1 - ratio));

        setGpsData({
          isActive: true,
          progress: currentProgress,
          currentLat: +lat.toFixed(4),
          currentLng: +lng.toFixed(4),
          speedKmh: 38 + Math.floor(Math.random() * 8),
          distanceRemainingKm: remainingKm,
          etaMinutes: remainingMin,
          heading: 'North-East',
          status: 'In Transit on Green Highway 45',
          lastUpdate: new Date().toLocaleTimeString()
        });
      }
    }, 1500);
  };

  // 6. Delivery Handover: Driver Requests Handover
  const requestDeliveryHandover = (orderId) => {
    setActiveOrder(prev => {
      if (!prev || prev.id !== orderId) return prev;
      return {
        ...prev,
        status: 'Delivery Requested',
        timelineStatus: 'Driver requested delivery handover. Awaiting retailer inspection.'
      };
    });

    addNotification(
      '🏪 Delivery Handover Requested by Driver',
      'Driver Arun Kumar is ready to deliver produce. Retailer inspection requested.',
      'retailer',
      'warning'
    );
  };

  // 7. Delivery Handover: Retailer Accepts Handover -> Smart Escrow Release
  const acceptDeliveryHandover = (orderId) => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    const escrowReceipt = simulateEscrowRelease(activeOrder || { quantity: 100, pricePerKg: 40, transportFee: 500 });

    const tx = blockchain.recordTransaction('DeliveryAccepted & EscrowSettled', {
      orderId: activeOrder?.id,
      batchId: activeOrder?.batchId,
      deliveredTo: activeOrder?.retailerName,
      receivedBy: 'Store Manager (Retailer)',
      escrowSplit: {
        farmerAmount: `₹${activeOrder?.farmerAmount || 4000}`,
        driverAmount: `₹${activeOrder?.driverAmount || 500}`,
        platformFee: '₹0 (Fair Trade)'
      },
      payoutStatus: 'Completed Instantly via UPI / Smart Contract'
    });

    setActiveOrder(prev => {
      if (!prev || prev.id !== orderId) return prev;
      const updated = {
        ...prev,
        status: 'Delivered',
        timelineStatus: 'Order Complete — Escrow Distributed',
        deliveredAt: new Date().toISOString(),
        escrowSettlement: escrowReceipt,
        history: prev.history.map(h => {
          if (h.status === 'Delivery Handover') return { ...h, done: true, time: 'Just now', detail: 'Retailer inspected and accepted delivery' };
          if (h.status === 'Delivered & Escrow Settled') return { ...h, done: true, time: 'Just now', detail: `₹${activeOrder?.farmerAmount || 4000} paid to Farmer, ₹${activeOrder?.driverAmount || 500} paid to Driver` };
          return h;
        })
      };

      setBlocks(blockchain.getRecentTransactions());
      return updated;
    });

    addNotification(
      '🎉 Delivery Accepted & Escrow Settled!',
      `₹${activeOrder?.farmerAmount || 4000} released to Farmer, ₹${activeOrder?.driverAmount || 500} released to Driver. Blockchain record mined!`,
      'all',
      'success'
    );
  };

  // Load sample initial crop for quick demonstration if user wants
  const loadSampleHarvest = () => {
    const sampleTomato = {
      id: 'prod-tomato-sample',
      batchId: 'FV-TOM-101',
      name: 'Heritage Red Tomato',
      category: 'Vegetables',
      unit: 'kg',
      totalQuantity: 500,
      availableQuantity: 500,
      pricePerKg: 40,
      minOrderQty: 50,
      location: 'Saranathan Farm, Valley Sector 4, Trichy',
      farmerName: 'Green Valley Farm',
      farmerPhone: '+91 94210 55821',
      harvestDate: '21 Sept 2026',
      description: 'Vine-ripened organic heritage red tomatoes, pesticide-free harvest.',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
      aiGrade: {
        score: 92,
        grade: 'Grade A',
        freshness: 94,
        visualQuality: 92,
        defects: 6,
        confidence: 95,
        observations: ['✓ Firm skin tension', '✓ Minimal visible defects (< 6%)', '✓ Ready for retail']
      },
      status: 'Available',
      createdAt: new Date().toISOString()
    };
    setProducts([sampleTomato]);
    addNotification('🌱 Sample Harvest Loaded', 'Heritage Red Tomato added to marketplace for testing.', 'farmer', 'info');
  };

  const clearAllData = () => {
    if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(ORDERS_KEY);
    localStorage.removeItem(ACTIVE_ORDER_KEY);
    setProducts([]);
    setOrders([]);
    setActiveOrder(null);
    setGpsData({
      isActive: false,
      progress: 0,
      currentLat: 10.7482,
      currentLng: 78.6534,
      speedKmh: 0,
      distanceRemainingKm: 12.4,
      etaMinutes: 32,
      heading: 'North-East',
      status: 'Idle',
      lastUpdate: new Date().toLocaleTimeString()
    });
    addNotification('🧹 Storage Cleared', 'All products, orders, and sessions reset to fresh clean state.', 'all', 'info');
  };

  return (
    <FarmVestContext.Provider value={{
      products,
      orders,
      activeOrder,
      setActiveOrder,
      publishProduct,
      placeOrder,
      acceptTrip,
      requestPickupHandover,
      acceptPickupHandover,
      requestDeliveryHandover,
      acceptDeliveryHandover,
      startGpsSimulation,
      gpsData,
      blocks,
      notifications,
      activeToast,
      setActiveToast,
      isSellModalOpen,
      setIsSellModalOpen,
      selectedProductForDetail,
      setSelectedProductForDetail,
      selectedQrBatch,
      setSelectedQrBatch,
      loadSampleHarvest,
      clearAllData
    }}>
      {children}
    </FarmVestContext.Provider>
  );
}

export function useFarmVest() {
  const context = useContext(FarmVestContext);
  if (!context) {
    throw new Error('useFarmVest must be used within a FarmVestProvider');
  }
  return context;
}
