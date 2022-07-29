/* eslint-disable no-undef */
import MyError from './MyError.js';

const parse = (string) => {
  const parser = new DOMParser();
  const content = parser.parseFromString(string, 'application/xml');
  const errorNode = content.querySelector('parsererror');

  if (errorNode) {
    throw new MyError('Не валидный RSS');
  }

  return {
    title: content.querySelector('channel').querySelector('title').textContent,
    description: content.querySelector('description').textContent,
    posts: Array.from(content.querySelectorAll('item')).map((post) => {
      const title = post.querySelector('title').textContent;
      const description = post.querySelector('description').textContent;
      const link = post.querySelector('link').textContent;

      return [title, description, link];
    }),
  };
};

export default parse;
