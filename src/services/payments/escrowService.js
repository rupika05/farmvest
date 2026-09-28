// Smart Escrow Service
// Multi-signature automated settlement for Fair Agricultural Trade

export function calculateEscrowBreakdown(quantityKg, pricePerKg, transportFee = 500) {
  const productTotal = quantityKg * pricePerKg;
  const driverShare = transportFee;
  const platformFee = 0; // FarmVest Fair Trade policy: 0% intermediary cut
  const grandTotal = productTotal + driverShare + platformFee;

  const farmerPercentage = Math.round((productTotal / grandTotal) * 100);
  const driverPercentage = Math.round((driverShare / grandTotal) * 100);
  const platformPercentage = 0;

  return {
    productTotal,
    driverShare,
    platformFee,
    grandTotal,
    farmerPercentage,
    driverPercentage,
    platformPercentage,
    vaultStatus: 'Secured by Smart Contract Escrow',
    payoutMethod: 'Instant Real-time Settlement (UPI / Direct Bank / Crypto Token)'
  };
}

export function simulateEscrowRelease(order) {
  const breakdown = calculateEscrowBreakdown(order.quantity, order.pricePerKg, order.transportFee || 500);
  
  return {
    status: 'Settled',
    releasedAt: new Date().toISOString(),
    escrowTxId: 'ESCROW-TX-' + Math.floor(10000000 + Math.random() * 90000000),
    transfers: [
      {
        recipient: order.farmerName || 'Green Valley Farm',
        role: 'Farmer',
        amount: breakdown.productTotal,
        account: 'UPI: greenvalley@axis / Bank IFSC: UTIB000214',
        status: 'Credited Instantly',
        receiptId: 'RCPT-FARM-' + Math.floor(10000 + Math.random() * 90000)
      },
      {
        recipient: order.driverName || 'Arun Kumar',
        role: 'Driver / Logistics Partner',
        amount: breakdown.driverShare,
        account: 'UPI: arun.logistics@okicici',
        status: 'Credited Instantly',
        receiptId: 'RCPT-DRV-' + Math.floor(10000 + Math.random() * 90000)
      },
      {
        recipient: 'FarmVest Network (Zero-Fee Intermediary)',
        role: 'Platform',
        amount: breakdown.platformFee,
        status: 'Zero Cut Charged',
        receiptId: 'FEE-0-PROMO'
      }
    ]
  };
}
