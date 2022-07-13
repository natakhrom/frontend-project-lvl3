/* eslint-disable no-undef */
import * as yup from 'yup';
import { setLocale } from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import uniqueId from 'lodash/uniqueId';
import {
  renderInput,
  renderMessageFeedback,
  renderPosts,
  renderFeeds,
} from './view.js';
import i18 from './resources.js';
import {
  markup,
  buildPath,
  unifyText,
} from './utils.js';

const axios = require('axios').default;

setLocale({
  mixed: {
    notOneOf: () => ({ key: 'exist' }),
  },
  string: {
    url: () => ({ key: 'notUrl' }),
    required: () => ({ key: 'notEmpty' }),
  },
});

export default () => {
  const form = document.querySelector('form');
  const elements = {
    input: form.elements.url,
    button: form.querySelector('button'),
    message: document.querySelector('.feedback'),
    postsCard: document.querySelector('.posts'),
    feedsCard: document.querySelector('.feeds'),
    modal: document.querySelector('.modal'),
    modalTitle: document.querySelector('.modal-title'),
    modalText: document.querySelector('.modal-body'),
    buttonCross: document.querySelector('.btn-close'),
    buttonClose: document.querySelector('.btn-secondary'),
    buttonLink: document.querySelector('.full-article'),
    body: document.querySelector('body'),
  };
  const delay = 5000;
  const stateRSS = {
    processState: 'filling',
    field: '',
    feeds: [],
    posts: [],
    listUrl: [],
    visitedLinks: [],
  };

  const watchedState = onChange(stateRSS, () => {
    renderInput(watchedState, elements);
    renderMessageFeedback(watchedState, elements);
    renderFeeds(watchedState, elements);
    renderPosts(watchedState, elements);
  });

  elements.input.addEventListener('change', (e) => {
    watchedState.field = e.target.value;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.processState = 'processing';

    const schema = yup.string().url().required().notOneOf(watchedState.listUrl);
    schema
      .validate(watchedState.field)
      .then(() => {
        axios.get(buildPath(watchedState.field))
          .then((res) => {
            const doc = markup(res.data.contents);
            const errorNode = doc.querySelector('parsererror');
            if (errorNode) {
              watchedState.processState = 'failed';
              i18.then(() => {
                elements.message.textContent = i18next.t('notValidRSS');
              });
              return;
            }

            watchedState.processState = 'processed';
            const validRss = watchedState.field;
            i18.then(() => {
              elements.message.textContent = i18next.t('success');
            });

            const feed = {
              id: uniqueId(),
              title: unifyText(doc.querySelector('channel').querySelector('title').textContent),
              description: unifyText(doc.querySelector('channel').querySelector('description').innerHTML),
              url: validRss,
            };
            watchedState.feeds.push(feed);

            const posts = doc.querySelectorAll('item');
            posts.forEach((item) => {
              const post = {
                id: uniqueId(),
                title: unifyText(item.querySelector('title').textContent),
                description: unifyText(item.querySelector('description').innerHTML),
                link: unifyText(item.querySelector('link').nextSibling.textContent),
                feedId: watchedState.feeds[watchedState.feeds.length - 1].id,
                isVisited: false,
              };
              watchedState.posts.unshift(post);
            });

            watchedState.listUrl.push(validRss);
            form.reset();
          })
          .catch(() => {
            i18.then(() => {
              watchedState.processState = 'failed';
              elements.message.textContent = i18next.t('networkError');
            });
          });
      })
      .catch((err) => {
        watchedState.processState = 'failed';
        elements.message.textContent = err.errors.map((error) => i18next.t(error.key));
      });
  });

  function updatePosts() {
    watchedState.feeds.forEach(({ url, id }) => {
      axios.get(buildPath(url))
        .then((response) => {
          const filteredPostsFeed = watchedState.posts
            .filter((post) => post.feedId === id);
          const links = filteredPostsFeed.map((i) => i.link);

          const newDoc = markup(response.data.contents);
          const newPosts = newDoc.querySelectorAll('item');
          newPosts.forEach((item) => {
            const linkNewPost = unifyText(item.querySelector('link').nextSibling.textContent);
            const existLink = links.find((link) => link === linkNewPost);
            if (existLink === undefined) {
              const post = {
                id: uniqueId(),
                title: unifyText(item.querySelector('title').textContent),
                description: unifyText(item.querySelector('description').innerHTML),
                link: unifyText(item.querySelector('link').nextSibling.textContent),
                feedId: id,
                isVisited: false,
              };
              watchedState.posts.push(post);
            }
          });
        })
        .catch(() => i18.then(() => {
          watchedState.processState = 'failed';
          elements.message.textContent = i18next.t('networkError');
        }));
    });
    setTimeout(updatePosts, delay);
  }

  renderInput(watchedState, elements);
  renderMessageFeedback(watchedState, elements);
  updatePosts();
};
