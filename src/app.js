/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import { Modal } from 'bootstrap';
import i18next from 'i18next';
import _ from 'lodash';
import axios from 'axios';
import { watch, showModal } from './view.js';
import parse from './parse.js';
import ru from './locales/ru.js';
import MyError from './MyError.js';

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
          state.processState = 'update';
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
          state.processState = 'offline';
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
    postsContainer: document.querySelector('.posts'),
    feedsContainer: document.querySelector('.feeds'),
    modal: new Modal(document.getElementById('modal')),
    modalTitle: document.querySelector('.modal-title'),
    modalText: document.querySelector('.modal-body'),
    buttonLink: document.querySelector('.full-article'),
  };

  i18next.init({
    lng: 'ru',
    debug: false,
    resources: {
      ru,
    },
  });

  const initialState = {
    processState: 'filling',
    feeds: [],
    posts: [],
    listRss: [],
    visitedLinks: new Set(),
    errors: [],
    autoUpdateStarted: false,
  };

  const watchedState = watch(initialState, elements, i18next);
  console.log(watchedState.errors);

  elements.input.addEventListener('input', () => {
    if (elements.input.value === '') {
      watchedState.processState = 'filling';
    }
  });

  elements.postsContainer.addEventListener('click', (e) => {
    const elem = e.target;
    const { id } = elem.dataset;
    const currentPost = watchedState.posts.find((p) => p.id === id);

    if (elem.tagName === 'BUTTON') {
      showModal(elements, currentPost);
      watchedState.visitedLinks.add(id);
    } else if (elem.tagName === 'A') {
      watchedState.visitedLinks.add(id);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.processState = 'processing';

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
            watchedState.processState = 'processed';
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
            watchedState.errors = err.errors;
            if (err instanceof MyError) {
              watchedState.processState = 'failed';
            } else {
              watchedState.processState = 'offline';
            }
          });
      })
      .catch((err) => {
        watchedState.errors = err.errors;
        watchedState.processState = 'failed';
      });
  });
};
