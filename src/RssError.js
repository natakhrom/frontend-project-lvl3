class RssError extends Error {
  constructor(message) {
    super(message || 'Не валидный RSS');
    this.name = 'RssError';
    this.errors = [{ key: 'notValidRSS' }];
  }
}

export default RssError;
