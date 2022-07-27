/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import { Modal } from 'bootstrap';
import i18next from 'i18next';
import _ from 'lodash';
import axios from 'axios';
import watch from './view.js';
import parse from './parse.js';
import ru from './locales/ru.js';

const buildPath = (url) => {
  const parsedUrl = new URL('/get', 'https://allorigins.hexlet.app');
  parsedUrl.searchParams.append('disableCache', 'true');
  parsedUrl.searchParams.append('url', url);

  return parsedUrl.toString();
};

const createFeed = (title, description, urlRss) => {
  const feed = {
    id: _.uniqueId(),
    title,
    description,
    url: urlRss,
  };

  return feed;
};

const createPost = (title, description, link, id) => {
  const post = {
    id: _.uniqueId(),
    title,
    description,
    link,
    feedId: id,
    isVisited: false,
  };

  return post;
};

const updatePosts = (state) => {
  const feedPromises = state.feeds.map(({ url, id }) => axios.get(buildPath(url))
    .then((v) => ({ result: 'success', value: v, id }))
    .catch((e) => ({ result: 'error', value: e })));

  Promise.all(feedPromises)
    .then((responses) => {
      responses.forEach((response) => {
        if (response.result === 'success') {
          state.processState = { failedError: null, status: 'update' };
          const links = state.posts.map((i) => i.link);

          const newDoc = parse(response.value.data.contents);
          const { posts } = newDoc;
          posts
            .reverse()
            .forEach(([title, description, link]) => {
              if (!links.includes(link)) {
                state.posts.push(createPost(title, description, link, response.id));
              }
            });
        } else {
          state.processState = { failedError: null, status: 'offline' };
        }
      });
    })
    .catch((e) => console.log(e))
    .finally(() => setTimeout(() => updatePosts(state), 5000));
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

  const initialState = {
    processState: {
      status: 'filling',
      failedError: null,
    },
    feeds: [],
    posts: [],
    listRss: [],
    visitedLinks: new Set(),
    autoUpdateStarted: false,
  };

  const watchedState = watch(initialState, elements, i18next);

  elements.input.addEventListener('input', () => {
    if (elements.input.value === '') {
      watchedState.processState.status = 'filling';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.processState = { failedError: null, status: 'processing' };

    const formData = new FormData(e.target);
    const urlRss = formData.get('url');

    yup.setLocale({
      mixed: {
        notOneOf: () => ({ key: 'exist' }),
      },
      string: {
        url: () => ({ key: 'notUrl' }),
        required: () => ({ key: 'notEmpty' }),
      },
    });

    const schema = yup.string().url().required().notOneOf(watchedState.listRss);
    schema
      .validate(urlRss)
      .then(() => {
        axios.get(buildPath(urlRss))
          .then((res) => {
            watchedState.processState = { failedError: null, status: 'processed' };
            const doc = parse(res.data.contents);
            const { title, description, posts } = doc;

            watchedState.feeds.push(createFeed(title, description, urlRss));

            const feedId = watchedState.feeds[watchedState.feeds.length - 1].id;
            posts.forEach(([titlePost, descriptionPost, linkPost]) => {
              watchedState.posts.unshift(createPost(titlePost, descriptionPost, linkPost, feedId));
            });

            watchedState.listRss.push(urlRss);
            form.reset();

            if (!watchedState.autoUpdateStarted) {
              watchedState.autoUpdateStarted = true;
              setTimeout(() => updatePosts(watchedState), 5000);
            }
          })
          .catch((err) => {
            if (err.message === 'ParseError') {
              watchedState.processState = { failedError: null, status: 'failed' };
            } else {
              watchedState.processState = { failedError: null, status: 'offline' };
            }
          });
      })
      .catch((err) => {
        watchedState.processState = { failedError: err, status: 'failed' };
      });
  });
};
