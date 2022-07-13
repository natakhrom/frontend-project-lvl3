/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
const renderInput = (state, elements) => {
  if (state.processState === 'processing') {
    elements.button.setAttribute('disabled', '');
    elements.input.setAttribute('readonly', 'true');
  }
  if (state.processState === 'processed') {
    elements.button.removeAttribute('disabled');
    elements.input.removeAttribute('readonly');
    elements.input.classList.remove('is-invalid');
    elements.input.focus();
  }
  if (state.processState === 'failed') {
    elements.button.removeAttribute('disabled');
    elements.input.classList.add('is-invalid');
    elements.input.removeAttribute('readonly');
  }
};

const renderMessageFeedback = (state, elements) => {
  elements.message.innerHTML = '';
  if (state.processState === 'processed') {
    elements.message.classList.remove('text-danger');
    elements.message.classList.add('text-success');
  }
  if (state.processState === 'failed') {
    elements.message.classList.remove('text-success');
    elements.message.classList.add('text-danger');
  }
};

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

const createBackgroundShadow = (elements) => {
  const div = document.createElement('div');
  div.classList.add('modal-backdrop', 'fade', 'show');

  elements.body.append(div);
};

const removeBackgroundShadow = (elements) => {
  const div = elements.body.querySelector('.modal-backdrop');

  if (div === null) {
    return;
  }

  div.remove();
};

const closeModal = (elements) => {
  elements.modal.classList.remove('show');
  elements.modal.setAttribute('style', 'display: none');
  elements.modal.removeAttribute('aria-modal');
  elements.modal.setAttribute('aria-hidden', true);

  removeBackgroundShadow(elements);
};

const showModal = (elements, title, description, link) => {
  elements.modal.classList.add('show');
  elements.modal.removeAttribute('aria-hidden');
  elements.modal.setAttribute('style', 'display: block');
  elements.modal.setAttribute('aria-modal', true);
  elements.modalTitle.textContent = title;
  elements.modalText.textContent = description;

  elements.buttonCross.addEventListener('click', () => closeModal(elements));
  elements.buttonClose.addEventListener('click', () => closeModal(elements));
  elements.buttonLink.addEventListener('click', () => {
    elements.buttonLink.setAttribute('href', link);
  });
};

const renderPosts = (state, elements) => {
  if (state.posts.length !== 0) {
    elements.postsCard.innerHTML = '';
    const ul = createUlContainer();

    state.posts.slice().reverse().forEach((feedPost) => {
      feedPost.forEach((post) => {
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

        if (state.visitedLinks.includes(post.id)) {
          a.classList.add('fw-normal', 'link-secondary');
        } else {
          a.classList.add('fw-bold');
        }

        a.addEventListener('click', () => {
          post.isVisited = true;
          state.visitedLinks.push(post.id);
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
          state.visitedLinks.push(post.id);
          renderPosts(state, elements);

          createBackgroundShadow(elements);
          showModal(elements, post.title, post.description, post.link);
        });

        li.append(a, button);
        ul.append(li);
      });
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
      ul.prepend(li);
    });

    elements.feedsCard.append(createTitle('Фиды'), ul);
  }
};

export {
  renderInput,
  renderMessageFeedback,
  renderPosts,
  renderFeeds,
};
