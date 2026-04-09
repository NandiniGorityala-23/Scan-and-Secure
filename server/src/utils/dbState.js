const mongoStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getMongoState = (readyState) => mongoStates[readyState] || 'unknown';

