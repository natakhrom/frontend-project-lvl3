const markup = (string) => {
  // eslint-disable-next-line no-undef
  const parser = new DOMParser();
  const doc = parser.parseFromString(string, 'text/html');

  return doc;
};

const buildPath = (url) => {
  const parsedUrl = new URL('/get', 'https://allorigins.hexlet.app');
  parsedUrl.searchParams.append('disableCache', 'true');
  parsedUrl.searchParams.append('url', url);
  return parsedUrl.toString();
};

const unifyText = (text) => {
  if (text.includes('CDATA')) {
    return text.substring(text.lastIndexOf('[') + 1, text.indexOf(']'));
  }
  return text;
};

export { markup, buildPath, unifyText };
