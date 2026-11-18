export const getAppUrl = () => {
  const configured = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let url = configured.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
};
