export const duesName = (year, description) => {
  if (typeof description !== 'string' || !description.trim()) {
    return 'Annual dues';
  }
  const trimmed = description.trim();
  const yearPrefix = `${year} `;
  let name = trimmed;
  if (trimmed.startsWith(yearPrefix)) {
    name = trimmed.slice(yearPrefix.length).trim();
  }
  if (!name) {
    return 'Annual dues';
  }
  const firstCharacter = name.charAt(0);
  return `${firstCharacter.toUpperCase()}${name.slice(1)}`;
};

export const duesLine = (year, description) => {
  return `${year} ${duesName(year, description)}`;
};
