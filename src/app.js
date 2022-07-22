/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import { Modal } from 'bootstrap';
import onChange from 'on-change';
import i18next from 'i18next';
import _ from 'lodash';
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
    id: _.uniqueId(),
    title: dom.querySelector('channel').querySelector('title').textContent,
    description: dom.querySelector('description').textContent,
    url: urlRss,
  };

  return feed;
};

const createPost = (item, id) => {
  const post = {
    id: _.uniqueId(),
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
    feedId: id,
    isVisited: false,
  };

  return post;
};

const updatePosts = (state) => {
  console.log('updatePosts called.');
  const feedPromises = state.feeds.map(({ url, id }) => axios.get(buildPath(url))
    .then((v) => ({ result: 'success', value: v, id }))
    .catch((e) => ({ result: 'error', value: e })));

  Promise.all(feedPromises)
    .then((responses) => {
      state.processState = 'processed';
      responses.forEach((response) => {
        if (response.result === 'success') {
          const links = state.posts.map((i) => i.link);

          const newDoc = parse(response.value.data.contents);
          const newPosts = newDoc.querySelectorAll('item');
          Array.from(newPosts)
            .reverse()
            .forEach((item) => {
              const linkNewPost = item.querySelector('link').textContent;
              if (!links.includes(linkNewPost)) {
                state.posts.push(createPost(item, response.id));
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
    feeds: [],
    posts: [],
    listRss: [],
    visitedLinks: new Set(),
    autoUpdateStarted: false,
  };

  const watchedState = onChange(stateRSS, () => {
    render(watchedState, elements, i18next);
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
            let doc;
            try {
              doc = parse(res.data.contents);
            } catch {
              watchedState.processState = 'failed';

              return;
            }

            watchedState.processState = 'processed';
            watchedState.feeds.push(createFeed(doc, urlRss));

            const posts = doc.querySelectorAll('item');
            const feedId = watchedState.feeds[watchedState.feeds.length - 1].id;
            posts.forEach((item) => {
              watchedState.posts.unshift(createPost(item, feedId));
            });

            watchedState.listRss.push(urlRss);
            form.reset();

            if (!watchedState.autoUpdateStarted) {
              watchedState.autoUpdateStarted = true;
              setTimeout(() => updatePosts(watchedState), 5000);
            }
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

  render(watchedState, elements, i18next);
};
