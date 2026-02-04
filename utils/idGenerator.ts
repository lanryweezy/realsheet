export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generateTimestampId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
};