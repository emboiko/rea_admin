export const splitPayUrl = (payUrl) => {
  if (typeof payUrl !== 'string') {
    return { sitePrefix: '', code: '' };
  }
  const marker = '/pay/';
  const markerIndex = payUrl.lastIndexOf(marker);
  if (markerIndex === -1) {
    return { sitePrefix: payUrl, code: '' };
  }
  return {
    sitePrefix: payUrl.slice(0, markerIndex + marker.length),
    code: payUrl.slice(markerIndex + marker.length),
  };
};
