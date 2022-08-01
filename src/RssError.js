class RssError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RssError';
    this.errors = [{ key: 'notValidRSS' }];
  }
}

export default RssError;
