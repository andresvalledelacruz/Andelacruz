(function () {
  'use strict';

  // Shared, markup-free runtime for public content pages.
  // Keep this intentionally small: public guides should not need to duplicate
  // analytics wiring or change their editorial HTML to gain aggregate metrics.
  const script = document.createElement('script');
  script.src = '/visitor-analytics.js';
  script.async = true;
  script.onerror = () => console.error('No se ha podido cargar /visitor-analytics.js');
  document.body.append(script);
})();
