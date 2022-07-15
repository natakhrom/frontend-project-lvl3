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

const createFeed = (dom, rss) => {
  const feed = {
    id: uniqueId(),
    title: unifyText(dom.querySelector('channel').querySelector('title').textContent),
    description: unifyText(dom.querySelector('channel').querySelector('description').innerHTML),
    url: rss,
  };

  return feed;
};

const createPost = (item, id) => {
  const post = {
    id: uniqueId(),
    title: unifyText(item.querySelector('title').textContent),
    description: unifyText(item.querySelector('description').innerHTML),
    link: unifyText(item.querySelector('link').nextSibling.textContent),
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

  elements.input.addEventListener('input', (e) => {
    watchedState.field = e.target.value;
    if (watchedState.field === '') {
      watchedState.processState = 'filling';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.processState = 'processing';
    i18.then(() => {
      elements.message.textContent = i18next.t('isLoading');
    });

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

            watchedState.feeds.push(createFeed(doc, validRss));

            const posts = doc.querySelectorAll('item');
            posts.forEach((item) => {
              const feedId = watchedState.feeds[watchedState.feeds.length - 1].id;
              watchedState.posts.unshift(createPost(item, feedId));
            });

            watchedState.listUrl.push(validRss);
            form.reset();
          })
          .catch(() => {
            i18.then(() => {
              watchedState.processState = 'offline';
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
    const feedPromises = watchedState.feeds.map(({ url, id }) => axios.get(buildPath(url))
      .then((v) => ({ result: 'success', value: v, id }))
      .catch((e) => ({ result: 'error', value: e })));

    Promise.all(feedPromises)
      .then((responses) => {
        responses.forEach(({ result, value, id }) => {
          if (result === 'success') {
            watchedState.processState = 'filling';
            const filteredPostsFeed = watchedState.posts.filter((post) => post.feedId === id);
            const links = filteredPostsFeed.map((i) => i.link);

            const newDoc = markup(value.data.contents);
            const newPosts = newDoc.querySelectorAll('item');
            Array.from(newPosts)
              .reverse()
              .forEach((item) => {
                const linkNewPost = unifyText(item.querySelector('link').nextSibling.textContent);
                console.log(linkNewPost);
                if (!links.includes(linkNewPost)) {
                  watchedState.posts.push(createPost(item, id));
                }
              });
          } else {
            i18.then(() => {
              watchedState.processState = 'offline';
              elements.message.textContent = i18next.t('networkError');
            });
          }
        });
        setTimeout(updatePosts, delay);
      });
  }

  renderInput(watchedState, elements);
  renderMessageFeedback(watchedState, elements);
  updatePosts();
};
