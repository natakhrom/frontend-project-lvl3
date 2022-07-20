/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */

const createTitle = (title) => {
  const div = document.createElement('div');
  div.classList.add('card', 'border-0');

  const div2 = document.createElement('div');
  div2.classList.add('card-body');

  div.append(div2);

  const heading = document.createElement('h2');
  heading.classList.add('card-title', 'h4');
  heading.textContent = title;

  div2.append(heading);

  return div;
};

const createUlContainer = () => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  return ul;
};

const renderPosts = (state, elements) => {
  if (state.posts.length !== 0) {
    elements.postsCard.innerHTML = '';
    const ul = createUlContainer();

    state.posts.forEach((post) => {
      const li = document.createElement('li');
      li.classList.add(
        'list-group-item',
        'd-flex',
        'justify-content-between',
        'align-items-start',
        'border-0',
        'border-end-0',
      );

      const a = document.createElement('a');
      a.setAttribute('href', post.link);
      a.setAttribute('data-id', post.id);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener', 'noreferrer');
      a.textContent = post.title;

      if (state.visitedLinks.has(post.id)) {
        a.classList.add('fw-normal', 'link-secondary');
      } else {
        a.classList.add('fw-bold');
      }

      a.addEventListener('click', () => {
        post.isVisited = true;
        state.visitedLinks.add(post.id);
        renderPosts(state, elements);
      });

      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-bs-target', '#modal');
      button.setAttribute('data-id', post.id);
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.textContent = 'Просмотр';

      button.addEventListener('click', () => {
        post.isVisited = true;
        state.visitedLinks.add(post.id);
        renderPosts(state, elements);

        elements.modal.toggle();
        elements.modalTitle.textContent = post.title;
        elements.modalText.textContent = post.description;
        elements.buttonLink.addEventListener('click', () => {
          elements.buttonLink.setAttribute('href', post.link);
        });
      });

      li.append(a, button);
      ul.prepend(li);
    });

    elements.postsCard.append(createTitle('Посты'), ul);
  }
};

const renderFeeds = (state, elements) => {
  if (state.feeds.length !== 0) {
    elements.feedsCard.innerHTML = '';
    const ul = createUlContainer();

    state.feeds.forEach(({ title, description }) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'border-0', 'border-end-0');

      const heading = document.createElement('h6');
      heading.classList.add('h-6', 'm-0');
      heading.textContent = title;

      const p = document.createElement('p');
      p.classList.add('m-0', 'small', 'text-black-50');
      p.textContent = description;

      li.append(heading, p);
      ul.append(li);
    });

    elements.feedsCard.append(createTitle('Фиды'), ul);
  }
};

const render = (state, elements, i18next) => {
  switch (state.processState) {
    case 'filling':
      elements.input.classList.remove('is-invalid');
      elements.message.classList.remove('text-danger', 'text-info');
      elements.message.textContent = '';
      break;

    case 'processing':
      elements.button.setAttribute('disabled', '');
      elements.input.setAttribute('readonly', 'true');
      elements.input.classList.remove('is-invalid');
      elements.message.classList.remove('text-danger', 'text-success');
      elements.message.classList.add('text-info');
      elements.message.textContent = i18next.t('isLoading');
      break;

    case 'processed':
      elements.button.removeAttribute('disabled');
      elements.input.removeAttribute('readonly');
      elements.input.classList.remove('is-invalid');
      elements.input.focus();
      elements.message.classList.remove('text-danger', 'text-info');
      elements.message.classList.add('text-success');
      elements.message.textContent = i18next.t('success');
      renderFeeds(state, elements);
      renderPosts(state, elements);
      break;

    case 'offline':
      elements.message.classList.add('text-danger');
      elements.message.textContent = i18next.t('networkError');
      break;

    case 'failed':
      elements.button.removeAttribute('disabled');
      elements.input.classList.add('is-invalid');
      elements.input.removeAttribute('readonly');
      elements.message.classList.remove('text-success', 'text-info');
      elements.message.classList.add('text-danger');
      elements.message.textContent = i18next.t('notValidRSS');
      break;

    default:
      throw new Error(`Unknown process state: ${state.processState}`);
  }
};

export default render;
