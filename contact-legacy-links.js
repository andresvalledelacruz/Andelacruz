(function () {
  'use strict';
  const destinations = {
    '#participar': '/profesionales.html#participar',
    '#profesionales': '/profesionales.html#solicitud',
    '#colaboraciones': '/profesionales.html#colaboraciones',
    '#recursos': '/profesionales.html#recursos'
  };
  function forwardLegacyLink() {
    const destination = destinations[window.location.hash];
    if (destination) window.location.replace(destination);
  }
  forwardLegacyLink();
  window.addEventListener('hashchange', forwardLegacyLink);
})();
