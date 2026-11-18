export const buildAddressKey = (streetAddress, lotNumber) => {
  const street = streetAddress.trim().replace(/\s+/g, ' ').toLowerCase();
  const lot = String(lotNumber || '').trim().replace(/\s+/g, ' ').toLowerCase();
  return `${street}|${lot}`;
};

export const formatMailingAddress = (streetAddress, lotNumber) => {
  const lot = String(lotNumber || '').trim();
  if (lot) {
    return `${streetAddress}, lot ${lot}`;
  }
  return streetAddress;
};
