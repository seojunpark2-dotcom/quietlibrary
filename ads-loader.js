(() => {
  // Advertising is limited to reading pages. The timer and personal record
  // form intentionally never load Google's advertising runtime.
  if (!/^\/guides\/[^/]+(?:\.html)?\/?$/.test(window.location.pathname)) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8424336588951055';
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
})();
