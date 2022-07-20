/* eslint-disable no-undef */
import * as yup from 'yup';
import { Modal } from 'bootstrap';
import onChange from 'on-change';
import i18next from 'i18next';
import uniqueId from 'lodash/uniqueId';
import axios from 'axios';
import render from './view.js';
import parse from './parse.js';
import ru from './locales/ru.js';

const buildPath = (url) => {
  const parsedUrl = new URL('/get', 'https://allorigins.hexlet.app');
  parsedUrl.searchParams.append('disableCache', 'true');
  parsedUrl.searchParams.append('url', url);

  return parsedUrl.toString();
};

const createFeed = (dom, urlRss) => {
  const feed = {
    id: uniqueId(),
    title: dom.querySelector('channel').querySelector('title').textContent,
    description: dom.querySelector('description').textContent,
    url: urlRss,
  };

  return feed;
};

const createPost = (item, id) => {
  const post = {
    id: uniqueId(),
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
    feedId: id,
    isVisited: false,
  };

  return post;
};

export default () => {
  const form = document.querySelector('form');
  const elements = {
    input: form.elements.url,
    button: form.querySelector('button'),
    message: document.querySelector('.feedback'),
    postsCard: document.querySelector('.posts'),
    feedsCard: document.querySelector('.feeds'),
    modal: new Modal(document.getElementById('modal')),
    modalTitle: document.querySelector('.modal-title'),
    modalText: document.querySelector('.modal-body'),
    buttonCross: document.querySelector('.btn-close'),
    buttonClose: document.querySelector('.btn-secondary'),
    buttonLink: document.querySelector('.full-article'),
    body: document.querySelector('body'),
  };

  i18next.init({
    lng: 'ru',
    debug: false,
    resources: {
      ru,
    },
  });

  const stateRSS = {
    processState: 'filling',
    field: '',
    feeds: [],
    posts: [],
    listUrl: [],
    visitedLinks: new Set(),
  };

  const watchedState = onChange(stateRSS, () => {
    render(watchedState, elements, i18next);
  });

  elements.input.addEventListener('input', (e) => {
    watchedState.field = e.target.value;

    if (watchedState.field === '') {
      watchedState.processState = 'filling';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.processState = 'processing';

    yup.setLocale({
      mixed: {
        notOneOf: () => ({ key: 'exist' }),
      },
      string: {
        url: () => ({ key: 'notUrl' }),
        required: () => ({ key: 'notEmpty' }),
      },
    });
    const schema = yup.string().url().required().notOneOf(watchedState.listUrl);
    schema
      .validate(watchedState.field)
      .then(() => {
        axios.get(buildPath(watchedState.field))
          .then((res) => {
            let doc;
            try {
              doc = parse(res.data.contents);
            } catch {
              watchedState.processState = 'failed';

              return;
            }

            watchedState.processState = 'processed';
            const validUrlRss = watchedState.field;

            watchedState.feeds.push(createFeed(doc, validUrlRss));

            const posts = doc.querySelectorAll('item');
            posts.forEach((item) => {
              const feedId = watchedState.feeds[watchedState.feeds.length - 1].id;
              watchedState.posts.unshift(createPost(item, feedId));
            });

            watchedState.listUrl.push(validUrlRss);
            form.reset();
          })
          .catch(() => {
            watchedState.processState = 'offline';
          });
      })
      .catch((err) => {
        watchedState.processState = 'failed';
        elements.message.textContent = err.errors.map((error) => i18next.t(error.key));
      });
  });

  function updatePosts() {
    const feedPromises = watchedState.feeds.map(({ url, id }) => axios.get(buildPath(url))
      .then((v) => ({ result: 'success', value: v, id }))
      .catch((e) => ({ result: 'error', value: e })));

    Promise.all(feedPromises)
      .then((responses) => {
        responses.forEach(({ result, value, id }) => {
          if (result === 'success') {
            watchedState.processState = 'processed';
            const filteredPostsFeed = watchedState.posts.filter((post) => post.feedId === id);
            const links = filteredPostsFeed.map((i) => i.link);

            const newDoc = parse(value.data.contents);
            const newPosts = newDoc.querySelectorAll('item');
            Array.from(newPosts)
              .reverse()
              .forEach((item) => {
                const linkNewPost = item.querySelector('link').textContent;
                if (!links.includes(linkNewPost)) {
                  watchedState.posts.push(createPost(item, id));
                }
              });
          } else {
            watchedState.processState = 'offline';
          }
        });
        setTimeout(updatePosts, 5000);
      });
  }

  render(watchedState, elements, i18next);
  updatePosts();
};
