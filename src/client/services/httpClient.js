export class RequestError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'RequestError';
    this.statusCode = statusCode;
  }
}

export const requestJson = async (path, options = {}) => {
  const requestOptions = {
    method: options.method || 'GET',
    credentials: 'include',
    headers: {},
  };
  if (options.body !== undefined) {
    requestOptions.headers['Content-Type'] = 'application/json';
    requestOptions.body = JSON.stringify(options.body);
  }
  const response = await fetch(path, requestOptions);
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new RequestError('The server returned an unreadable response.', response.status);
    }
  }
  if (!response.ok) {
    const message = payload.error || 'Request failed.';
    throw new RequestError(message, response.status);
  }
  return payload;
};

export const downloadFile = async (path, filename) => {
  const response = await fetch(path, { credentials: 'include' });
  if (!response.ok) {
    let message = 'Request failed.';
    try {
      const payload = await response.json();
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      message = 'Request failed.';
    }
    throw new RequestError(message, response.status);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
