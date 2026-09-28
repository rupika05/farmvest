import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { blockchain } from '../services/blockchain/blockchainService';
import { calculateEscrowBreakdown, simulateEscrowRelease } from '../services/payments/escrowService';
import { getCropImage } from '../utils/cropImages';

const FarmVestContext = createContext();

const PRODUCTS_KEY = 'farmvest_products_v4';
const ORDERS_KEY = 'farmvest_orders_v4';
const BATCHES_KEY = 'farmvest_batches_v4';
const API_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'farmvest_token_v3';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function apiCall(path, method = 'GET', body = null) {
  const token = getToken();
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  };
  const res = await fetch(`${API_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `API error ${res.status}`);
  return data;
}

export function FarmVestProvider({ children }) {
  // Core data
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(p => ({ ...p, image: getCropImage(p) }));
      }
      return [];
    } catch { return []; }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [batches, setBatches] = useState(() => {
    try {
      const saved = localStorage.getItem(BATCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [blocks, setBlocks] = useState(blockchain.getRecentTransactions());

  // UI state
  const [notifications, setNotifications] = useState([{
    id: 'notif-init',
    title: 'FarmVest Supply Chain Ready 🌱',
    message: 'AI quality grading, blockchain provenance, and custody handovers initialized.',
    time: 'Just now', role: 'all', type: 'info'
  }]);
  const [activeToast, setActiveToast] = useState(null);
  const [selectedQrBatch, setSelectedQrBatch] = useState(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Persist state
  useEffect(() => {
    try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); } catch {}
  }, [products]);
  useEffect(() => {
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch {}
  }, [orders]);
  useEffect(() => {
    try { localStorage.setItem(BATCHES_KEY, JSON.stringify(batches)); } catch {}
  }, [batches]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === PRODUCTS_KEY && e.newValue) setProducts(JSON.parse(e.newValue).map(p => ({ ...p, image: getCropImage(p) })));
      if (e.key === ORDERS_KEY && e.newValue) setOrders(JSON.parse(e.newValue));
      if (e.key === BATCHES_KEY && e.newValue) setBatches(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Boot: fetch products from backend
  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(data => {
        setBackendOnline(true);
        if (data?.products?.length > 0) {
          setProducts(prev => {
            const map = new Map();
            // backend products first, then local overrides
            data.products.forEach(p => map.set(p.batchId || p.id, { ...p, image: getCropImage(p) }));
            prev.forEach(p => { if (!map.has(p.batchId || p.id)) map.set(p.batchId || p.id, { ...p, image: getCropImage(p) }); });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => setBackendOnline(false));
  }, []);

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const addNotification = useCallback((title, message, role = 'all', type = 'success') => {
    const notif = { id: 'notif-' + Date.now(), title, message, time: 'Just now', role, type };
    setNotifications(prev => [notif, ...prev]);
    setActiveToast(notif);
    setTimeout(() => setActiveToast(c => c?.id === notif.id ? null : c), 4500);
  }, []);

  // ── PUBLISH PRODUCT (Farmer) ───────────────────────────────────────────────
  const publishProduct = useCallback(async (productData) => {
    const newBatchId = productData.batchId || `FV-${(productData.name || 'CRP').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    
    // Record genesis block in local blockchain
    const tx = blockchain.recordTransaction('BatchCreated_GenesisBlock', {
      batchId: newBatchId,
      farmer: productData.farmerName,
      product: productData.name,
      grade: productData.aiGrade?.grade || 'Ungraded',
      quantity: `${productData.totalQuantity} ${productData.unit}`,
      authenticityLevel: productData.authenticityReport?.level || 'unknown'
    }, newBatchId, productData.farmerName);

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
      currentCustodian: productData.farmerId,
      currentCustodianName: productData.farmerName,
      currentCustodianRole: 'farmer',
      journeyStatus: 'With Farmer',
      createdAt: new Date().toISOString(),
      genesisBlockHash: tx.hash || tx.txHash
    };

    // Create local batch record
    const newBatch = {
      id: 'batch-' + Date.now(),
      batchId: newBatchId,
      productId: newProd.id,
      farmerId: productData.farmerId,
      farmerName: productData.farmerName,
      productName: productData.name,
      category: productData.category,
      quantity: productData.totalQuantity,
      unit: productData.unit,
      pricePerKg: productData.pricePerKg,
      harvestDate: productData.harvestDate,
      cultivationDate: productData.cultivationDate || '',
      location: productData.location,
      aiGrade: productData.aiGrade || {},
      authenticityReport: productData.authenticityReport || null,
      fairPriceRecommendation: productData.fairPriceRecommendation || null,
      currentCustodian: productData.farmerId,
      currentCustodianName: productData.farmerName,
      currentCustodianRole: 'farmer',
      status: 'Created',
      journeyStatus: 'With Farmer',
      orderId: null,
      merchantId: null,
      merchantName: null,
      journey: [
        {
          event: 'BatchCreated',
          actor: productData.farmerName,
          role: 'farmer',
          timestamp: new Date().toISOString(),
          note: `Genesis block created. AI grade: ${productData.aiGrade?.grade || 'Pending'}. Authenticity: ${productData.authenticityReport?.levelLabel || 'Not verified'}`
        }
      ],
      genesisBlockHash: tx.hash || tx.txHash,
      createdAt: new Date().toISOString()
    };

    setProducts(prev => [newProd, ...prev]);
    setBatches(prev => [newBatch, ...prev]);
    setBlocks(blockchain.getRecentTransactions());

    // Sync to backend
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: newProd.name,
            category: newProd.category,
            totalQuantity: newProd.totalQuantity,
            unit: newProd.unit,
            pricePerKg: newProd.pricePerKg,
            harvestDate: newProd.harvestDate,
            cultivationDate: newProd.cultivationDate || '',
            location: newProd.location,
            description: newProd.description,
            image: newProd.image,
            aiGrade: newProd.aiGrade,
            authenticityReport: newProd.authenticityReport,
            fairPriceRecommendation: newProd.fairPriceRecommendation,
            batchId: newBatchId
          })
        }).catch(() => {});
      } catch {}
    }

    addNotification(
      '🌾 Batch Created & Listed!',
      `${newProd.name} (${newProd.totalQuantity} ${newProd.unit}) — Batch ${newBatchId} — Grade: ${newProd.aiGrade?.grade || 'Pending'} — Now live in Merchant Marketplace.`,
      'farmer', 'success'
    );

    return { product: newProd, batch: newBatch };
  }, [addNotification]);

  // ── PLACE ORDER (Merchant) ─────────────────────────────────────────────────
  const placeOrder = useCallback(async ({ product, quantityKg, merchantUser }) => {
    const merchantName = merchantUser?.businessName || merchantUser?.name || 'Merchant';
    const merchantLocation = merchantUser?.location || 'Merchant Location';

    const escrow = calculateEscrowBreakdown(quantityKg, product.pricePerKg, 0);

    const tx = blockchain.recordTransaction('OrderPlaced_MerchantOrder', {
      batchId: product.batchId,
      merchant: merchantName,
      quantity: `${quantityKg} ${product.unit}`,
      totalAmount: `₹${escrow.grandTotal}`
    }, product.batchId, merchantName);

    const newOrder = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      batchId: product.batchId,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      farmerId: product.farmerId,
      farmerName: product.farmerName,
      farmerLocation: product.location,
      merchantId: merchantUser?.id,
      merchantName,
      merchantLocation,
      quantity: quantityKg,
      unit: product.unit,
      pricePerKg: product.pricePerKg,
      totalAmount: escrow.grandTotal,
      farmerAmount: escrow.productTotal,
      platformFee: escrow.platformFee,
      aiGrade: product.aiGrade,
      status: 'Ordered',
      pickupHandoverRequested: false,
      pickupHandoverAccepted: false,
      deliveryHandoverRequested: false,
      deliveryHandoverAccepted: false,
      damageInspection: null,
      paymentStatus: 'Pending',
      paymentTxId: null,
      createdAt: new Date().toISOString(),
      blockchainTx: tx.hash || tx.txHash
    };

    // Update product stock
    setProducts(prev => prev.map(p => p.id === product.id
      ? { ...p, availableQuantity: Math.max(0, (p.availableQuantity || p.totalQuantity) - quantityKg) }
      : p
    ));

    // Update batch
    setBatches(prev => prev.map(b => b.batchId === product.batchId ? {
      ...b,
      orderId: newOrder.id,
      merchantId: merchantUser?.id,
      merchantName,
      status: 'Ordered',
      journeyStatus: 'Order Placed',
      journey: [...(b.journey || []), {
        event: 'OrderPlaced',
        actor: merchantName,
        role: 'merchant',
        timestamp: new Date().toISOString(),
        note: `Order for ${quantityKg} ${product.unit}. Amount: ₹${escrow.grandTotal}`
      }]
    } : b));

    setOrders(prev => [newOrder, ...prev]);
    setBlocks(blockchain.getRecentTransactions());

    // Backend sync
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: product.id, quantity: quantityKg, deliveryAddress: merchantLocation })
        }).catch(() => {});
      } catch {}
    }

    addNotification('🛒 Order Placed!', `${quantityKg} ${product.unit} of ${product.name} ordered. Farmer will be notified.`, 'merchant', 'success');
    return newOrder;
  }, [addNotification]);

  // ── REQUEST HANDOVER (Farmer) ──────────────────────────────────────────────
  const requestHandover = useCallback(async (orderId) => {
    blockchain.recordTransaction('FarmerRequestedHandover', { orderId }, null, 'Farmer');

    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, status: 'Waiting for Handover', pickupHandoverRequested: true, pickupRequestedAt: new Date().toISOString() }
      : o
    ));
    setBatches(prev => prev.map(b => {
      const order = orders.find(o => o.id === orderId);
      if (!order || b.batchId !== order.batchId) return b;
      return {
        ...b,
        status: 'Waiting for Handover',
        journeyStatus: 'Farmer Requested Handover',
        journey: [...(b.journey || []), {
          event: 'FarmerRequestedHandover',
          actor: 'Farmer',
          role: 'farmer',
          timestamp: new Date().toISOString(),
          note: 'Farmer initiated custody transfer to Merchant.'
        }]
      };
    }));
    setBlocks(blockchain.getRecentTransactions());

    // Backend sync
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'request_pickup' })
        }).catch(() => {});
      } catch {}
    }

    addNotification('📦 Handover Requested', 'You requested custody handover to the merchant. Awaiting merchant acceptance.', 'farmer', 'info');
  }, [orders, addNotification]);

  // ── ACCEPT HANDOVER (Merchant) ─────────────────────────────────────────────
  const acceptHandover = useCallback(async (orderId, merchantUser) => {
    const merchantName = merchantUser?.businessName || merchantUser?.name || 'Merchant';

    blockchain.recordTransaction('MerchantAcceptedHandover', { orderId, newCustodian: merchantName }, null, merchantName);

    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, status: 'Handover Accepted', pickupHandoverAccepted: true, deliveryHandoverAccepted: true, handoverAcceptedAt: new Date().toISOString() }
      : o
    ));
    setBatches(prev => prev.map(b => {
      const order = orders.find(o => o.id === orderId) || prev.find(bb => bb.orderId === orderId);
      if (!order || (b.batchId !== order?.batchId && b.orderId !== orderId)) return b;
      return {
        ...b,
        status: 'With Merchant',
        journeyStatus: 'Handover Accepted by Merchant',
        currentCustodian: merchantUser?.id,
        currentCustodianName: merchantName,
        currentCustodianRole: 'merchant',
        journey: [...(b.journey || []), {
          event: 'MerchantAcceptedHandover',
          actor: merchantName,
          role: 'merchant',
          timestamp: new Date().toISOString(),
          note: 'Merchant accepted custody. Product now with merchant.'
        }]
      };
    }));
    setBlocks(blockchain.getRecentTransactions());

    // Backend sync
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'accept_handover' })
        }).catch(() => {});
      } catch {}
    }

    addNotification('✅ Handover Accepted', 'You accepted custody of the product. Proceed to inspection.', 'merchant', 'success');
  }, [orders, addNotification]);

  // ── RECORD DAMAGE INSPECTION (Merchant) ───────────────────────────────────
  const recordDamageInspection = useCallback(async (orderId, damageReport) => {
    blockchain.recordTransaction('QualityInspectionCompleted', { orderId, damage: damageReport }, null, 'Merchant');

    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, status: 'Inspected', damageInspection: damageReport, inspectedAt: new Date().toISOString() }
      : o
    ));
    setBatches(prev => prev.map(b => {
      const order = orders.find(o => o.id === orderId);
      if (!order || b.batchId !== order?.batchId) return b;
      return {
        ...b,
        journey: [...(b.journey || []), {
          event: 'QualityInspected',
          actor: 'Merchant',
          role: 'merchant',
          timestamp: new Date().toISOString(),
          note: damageReport?.summary || 'Inspection completed.'
        }]
      };
    }));
    setBlocks(blockchain.getRecentTransactions());

    addNotification('🔍 Inspection Recorded', `Inspection complete. ${damageReport?.summary || 'No damage found.'}`, 'merchant', 'info');
  }, [orders, addNotification]);

  // ── RELEASE PAYMENT (Merchant) ─────────────────────────────────────────────
  const releasePayment = useCallback(async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const damageAdjPct = order.damageInspection?.adjustmentPct || 0;
    const finalFarmerAmount = Math.round(order.farmerAmount * (1 - damageAdjPct / 100));
    const txId = 'TXN-FV-' + Date.now();

    blockchain.recordTransaction('PaymentReleased_OrderComplete', {
      orderId,
      txId,
      farmerPaid: `₹${finalFarmerAmount}`,
      batchId: order.batchId
    }, order.batchId, 'Merchant');

    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, status: 'Delivered', paymentStatus: 'Paid', paymentTxId: txId, finalFarmerAmount, paidAt: new Date().toISOString() }
      : o
    ));
    setBatches(prev => prev.map(b => {
      if (b.batchId !== order.batchId) return b;
      return {
        ...b,
        status: 'Delivered',
        journeyStatus: 'Delivered & Payment Released',
        journey: [...(b.journey || []), {
          event: 'PaymentReleased',
          actor: 'Merchant',
          role: 'merchant',
          timestamp: new Date().toISOString(),
          note: `₹${finalFarmerAmount} released to farmer. TxID: ${txId}`
        }]
      };
    }));
    setBlocks(blockchain.getRecentTransactions());
    setProducts(prev => prev.map(p => p.id === order.productId ? { ...p, status: 'Sold' } : p));

    // Backend sync
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'release_payment', damageReport: order.damageInspection })
        }).catch(() => {});
      } catch {}
    }

    addNotification('🎉 Payment Released!', `₹${finalFarmerAmount} sent to farmer. Order complete. TxID: ${txId}`, 'merchant', 'success');
    return { txId, finalFarmerAmount };
  }, [orders, addNotification]);

  // ── LOAD SAMPLE HARVEST (Demo) ─────────────────────────────────────────────
  const loadSampleHarvest = useCallback(() => {
    const sample = {
      id: 'prod-tomato-demo',
      batchId: 'FV-TOM-DEMO',
      name: 'Heritage Red Tomato',
      category: 'Vegetables',
      unit: 'kg',
      totalQuantity: 500,
      availableQuantity: 500,
      pricePerKg: 40,
      location: 'Saranathan Farm, Valley Sector 4, Trichy',
      farmerName: 'Green Valley Farm',
      farmerPhone: '+91 94210 55821',
      harvestDate: '21 Sept 2026',
      description: 'Vine-ripened organic heritage red tomatoes, pesticide-free harvest.',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
      aiGrade: { score: 92, grade: 'Grade A', freshness: 94, visualQuality: 92, defects: 6, confidence: 95 },
      status: 'Available',
      currentCustodianRole: 'farmer',
      journeyStatus: 'With Farmer',
      createdAt: new Date().toISOString()
    };
    setProducts(prev => {
      if (prev.find(p => p.batchId === sample.batchId)) return prev;
      return [sample, ...prev];
    });
    addNotification('🌱 Demo Harvest Loaded', 'Heritage Red Tomato sample loaded into marketplace.', 'all', 'info');
  }, [addNotification]);

  // ── CLEAR ALL DATA ─────────────────────────────────────────────────────────
  const clearAllData = useCallback(() => {
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(ORDERS_KEY);
    localStorage.removeItem(BATCHES_KEY);
    localStorage.removeItem('farmvest_ledger_v4');
    setProducts([]);
    setOrders([]);
    setBatches([]);
    blockchain.clearLedger();
    setBlocks(blockchain.getRecentTransactions());
    addNotification('🧹 Data Cleared', 'All products, orders and batches reset.', 'all', 'info');
  }, [addNotification]);

  // ── GET BATCH FOR PRODUCT ──────────────────────────────────────────────────
  const getBatchForProduct = useCallback((batchId) => {
    return batches.find(b => b.batchId === batchId) || null;
  }, [batches]);

  // ── GET ORDER FOR BATCH ────────────────────────────────────────────────────
  const getOrderForBatch = useCallback((batchId) => {
    return orders.find(o => o.batchId === batchId) || null;
  }, [orders]);

  // ── VERIFY CHAIN ───────────────────────────────────────────────────────────
  const verifyChain = useCallback(() => {
    return blockchain.verifyChainIntegrity();
  }, []);

  return (
    <FarmVestContext.Provider value={{
      // Data
      products, setProducts,
      orders, setOrders,
      batches, setBatches,
      blocks,
      backendOnline,
      // Actions
      publishProduct,
      placeOrder,
      requestHandover,
      acceptHandover,
      recordDamageInspection,
      releasePayment,
      loadSampleHarvest,
      clearAllData,
      // Selectors
      getBatchForProduct,
      getOrderForBatch,
      verifyChain,
      // Blockchain
      blockchain,
      // Notifications
      notifications,
      activeToast,
      setActiveToast,
      addNotification,
      // UI state
      isSellModalOpen, setIsSellModalOpen,
      selectedProductForDetail, setSelectedProductForDetail,
      selectedQrBatch, setSelectedQrBatch,
      // Legacy compat (kept for components that reference these)
      activeOrder: orders.find(o => !['Delivered', 'Cancelled'].includes(o.status)) || null,
      gpsData: { isActive: false, progress: 0, status: 'N/A' },
    }}>
      {children}
    </FarmVestContext.Provider>
  );
}

export function useFarmVest() {
  const ctx = useContext(FarmVestContext);
  if (!ctx) throw new Error('useFarmVest must be used within FarmVestProvider');
  return ctx;
}
