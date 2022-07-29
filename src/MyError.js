class MyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MyError';
    this.errors = [{ key: 'notValidRSS' }];
  }
}

export default MyError;
