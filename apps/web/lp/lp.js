/**
 * ClipTap LP script.
 * 演出用のギミックは持たない。ヘッダーの固定表示、モバイルメニュー、
 * スクロール表示だけを担当する。
 */
document.documentElement.classList.add('js');

const onReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
};

onReady(() => {
  const supportsObserver = 'IntersectionObserver' in window;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /** スクロールでヘッダーに境界線と影を付ける。 */
  const header = document.querySelector('[data-header]');
  const sentinel = document.querySelector('[data-header-sentinel]');

  if (header && sentinel && supportsObserver) {
    const headerObserver = new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-stuck', !entry.isIntersecting);
    });
    headerObserver.observe(sentinel);
  }

  /** 画面に入った要素をフェードインさせる。JSなし・低モーション設定では常に表示。 */
  const revealElements = [...document.querySelectorAll('.reveal')];
  const revealAll = () => {
    revealElements.forEach((element) => element.classList.add('is-revealed'));
  };

  if (!supportsObserver || reducedMotion.matches) {
    revealAll();
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    revealElements.forEach((element) => revealObserver.observe(element));
    reducedMotion.addEventListener?.('change', ({ matches }) => {
      if (!matches) return;
      revealAll();
      revealObserver.disconnect();
    });
  }

  /** モバイルメニュー。dialog非対応環境ではopen属性で開閉する。 */
  const navDialog = document.querySelector('[data-mobile-nav]');
  const navOpen = document.querySelector('[data-nav-open]');

  if (navDialog && navOpen) {
    const setNavState = (isOpen) => {
      navDialog.classList.toggle('is-open', isOpen);
      navOpen.classList.toggle('is-open', isOpen);
      navOpen.setAttribute('aria-expanded', String(isOpen));
    };
    const closeNav = () => {
      if (typeof navDialog.close === 'function' && navDialog.open) {
        navDialog.close();
      } else {
        navDialog.removeAttribute('open');
        setNavState(false);
      }
    };

    navOpen.addEventListener('click', () => {
      if (navDialog.open) return;
      if (typeof navDialog.showModal === 'function') {
        navDialog.showModal();
      } else {
        navDialog.setAttribute('open', '');
      }
      setNavState(true);
    });
    navDialog.querySelectorAll('[data-nav-close], a[href]').forEach((element) => {
      element.addEventListener('click', closeNav);
    });
    navDialog.addEventListener('cancel', () => setNavState(false));
    navDialog.addEventListener('close', () => setNavState(false));
    navDialog.addEventListener('click', (event) => {
      if (event.target === navDialog) closeNav();
    });
    setNavState(navDialog.open);
  }
});
