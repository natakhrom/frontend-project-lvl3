import i18next from 'i18next';

export default i18next.init({
  lng: 'ru',
  debug: false,
  resources: {
    ru: {
      translation: {
        isLoading: 'Идёт загрузка...',
        success: 'RSS успешно загружен',
        notUrl: 'Ссылка должна быть валидным URL',
        notValidRSS: 'Ресурс не содержит валидный RSS',
        exist: 'RSS уже существует',
        notEmpty: 'Не должно быть пустым',
        networkError: 'Ошибка сети',
      },
    },
  },
});
