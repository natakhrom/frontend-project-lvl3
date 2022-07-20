/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
function parse(string) {
  const parser = new DOMParser();
  const content = parser.parseFromString(string, 'application/xml');
  const errorNode = content.querySelector('parsererror');

  if (errorNode) {
    throw new Error('Invalid data format');
  }

  return content;
}

export default parse;
