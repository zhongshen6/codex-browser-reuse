// Browser copy of the desktop Nahida runtime. Disabled by default in extensions/config.json.
(async () => {
  const paths = window.__codexBrowserPaths || { publicPath: value => value };
  // Theme assets follow the same reverse-proxy mount as the renderer.
  const cssResponse = await fetch(paths.publicPath("/__extensions/themes/nahida/theme.css"));
  if (!cssResponse.ok) throw new Error("Nahida CSS failed to load");
  const css = await cssResponse.text();
  const stickerAssets = Array.from({ length: 9 }, (_, i) =>
    paths.publicPath(`/__extensions/themes/nahida/stickers/sticker-${String(i + 1).padStart(2, "0")}.webp`));
  const legacyStyle = document.getElementById('zha-codex-sweet-theme');
  const legacyRemoved = Boolean(legacyStyle);
  legacyStyle?.remove();

  const oldIcon = document.querySelector('button[aria-label="\u641c\u7d22"] svg[data-zha-injected-icon="search-spark"]');
  const oldIconRemoved = Boolean(oldIcon);
  window.__zhaRuntimeIconObserver?.disconnect();
  delete window.__zhaRuntimeIconObserver;
  document.getElementById('zha-runtime-icon-style')?.remove();
  if (oldIcon) {
    oldIcon.outerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-xs" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>';
  }

  let style = document.getElementById('zha-codex-nahida-theme');
  if (!style) {
    style = document.createElement('style');
    style.id = 'zha-codex-nahida-theme';
    document.head.appendChild(style);
  }

  style.textContent = css;
  delete document.documentElement.dataset.zhaSweetTheme;
  document.documentElement.dataset.zhaTheme = 'nahida';

  window.__zhaNahidaRuntime?.dispose?.();
  document.getElementById('zha-nahida-ambient')?.remove();

  const ambientLayer = document.createElement('div');
  ambientLayer.id = 'zha-nahida-ambient';
  ambientLayer.setAttribute('aria-hidden', 'true');
  const particleDefinitions = [
    ['seed', '5%', '10%', '8px', '16s', '-4s', '16px', '-7px', '16deg', '0.52'],
    ['spark', '18%', '24%', '6px', '13s', '-9s', '-12px', '8px', '8deg', '0.44'],
    ['diamond', '31%', '8%', '7px', '19s', '-6s', '14px', '-5px', '24deg', '0.40'],
    ['seed', '45%', '18%', '6px', '15s', '-11s', '-10px', '7px', '-18deg', '0.45'],
    ['spark', '62%', '9%', '7px', '17s', '-2s', '13px', '-8px', '4deg', '0.49'],
    ['seed', '78%', '23%', '9px', '21s', '-14s', '-16px', '10px', '28deg', '0.42'],
    ['diamond', '91%', '12%', '6px', '14s', '-7s', '9px', '-6px', '-12deg', '0.43'],
    ['spark', '12%', '52%', '6px', '18s', '-12s', '15px', '-9px', '14deg', '0.40'],
    ['seed', '28%', '68%', '8px', '20s', '-5s', '-13px', '8px', '-24deg', '0.39'],
    ['spark', '52%', '56%', '5px', '12s', '-8s', '10px', '-7px', '0deg', '0.50'],
    ['diamond', '72%', '74%', '7px', '22s', '-16s', '-15px', '9px', '32deg', '0.37'],
    ['seed', '88%', '59%', '6px', '16s', '-3s', '12px', '-8px', '-8deg', '0.43'],
    ['spark', '8%', '86%', '7px', '19s', '-13s', '14px', '-10px', '18deg', '0.40'],
    ['seed', '95%', '88%', '9px', '23s', '-10s', '-18px', '11px', '36deg', '0.37']
  ];
  particleDefinitions.forEach(([kind, x, y, size, duration, delay, driftX, driftEnd, rotation, opacity]) => {
    const particle = document.createElement('span');
    particle.className = 'nhd-particle nhd-particle--' + kind;
    particle.style.setProperty('--particle-x', x);
    particle.style.setProperty('--particle-y', y);
    particle.style.setProperty('--particle-size', size);
    particle.style.setProperty('--particle-duration', duration);
    particle.style.setProperty('--particle-delay', delay);
    particle.style.setProperty('--particle-drift-x', driftX);
    particle.style.setProperty('--particle-drift-end', driftEnd);
    particle.style.setProperty('--particle-rotation', rotation);
    particle.style.setProperty('--particle-opacity', opacity);
    ambientLayer.appendChild(particle);
  });
  const bubbleDefinitions = [
    ['7%', '28%', '42px', '13s', '-5s', '8px', '0.76', false],
    ['15%', '12%', '30px', '15s', '-10s', '-7px', '0.70', false],
    ['24%', '48%', '34px', '12s', '-6s', '7px', '0.68', false],
    ['34%', '8%', '26px', '11s', '-8s', '-6px', '0.66', false],
    ['39%', '43%', '58px', '17s', '-11s', '10px', '0.64', false],
    ['50%', '22%', '32px', '14s', '-4s', '8px', '0.70', false],
    ['58%', '16%', '36px', '12s', '-3s', '-8px', '0.72', false],
    ['71%', '48%', '44px', '16s', '-13s', '-9px', '0.66', false],
    ['82%', '34%', '68px', '19s', '-14s', '12px', '0.62', false],
    ['92%', '14%', '38px', '13s', '-5s', '8px', '0.68', false],
    ['4%', '62%', '25px', '12s', '-2s', '6px', '0.63', false],
    ['11%', '50%', '36px', '16s', '-12s', '-8px', '0.67', false],
    ['20%', '24%', '20px', '10s', '-7s', '5px', '0.60', false],
    ['29%', '69%', '38px', '15s', '-9s', '9px', '0.64', false],
    ['37%', '31%', '24px', '11s', '-4s', '-6px', '0.62', false],
    ['47%', '54%', '46px', '18s', '-15s', '10px', '0.62', false],
    ['55%', '68%', '22px', '13s', '-6s', '-5px', '0.65', false],
    ['64%', '34%', '30px', '14s', '-10s', '7px', '0.66', false],
    ['75%', '17%', '28px', '12s', '-3s', '-7px', '0.61', false],
    ['87%', '54%', '40px', '17s', '-11s', '8px', '0.64', false],
    ['94%', '68%', '40px', '15s', '-7s', '-10px', '0.68', true],
    ['68%', '82%', '52px', '18s', '-12s', '9px', '0.60', true],
    ['18%', '76%', '34px', '14s', '-9s', '-7px', '0.66', true],
    ['44%', '72%', '28px', '12s', '-3s', '7px', '0.66', true],
    ['78%', '67%', '46px', '17s', '-11s', '-9px', '0.62', true],
    ['88%', '88%', '30px', '15s', '-8s', '8px', '0.64', true],
    ['6%', '88%', '36px', '16s', '-13s', '8px', '0.61', true],
    ['31%', '88%', '42px', '19s', '-5s', '-10px', '0.63', true],
    ['53%', '83%', '32px', '13s', '-10s', '6px', '0.65', true],
    ['61%', '58%', '50px', '18s', '-14s', '-8px', '0.60', true],
    ['73%', '76%', '26px', '11s', '-4s', '7px', '0.64', true],
    ['96%', '46%', '34px', '15s', '-9s', '-6px', '0.62', true]
  ];
  bubbleDefinitions.forEach(([x, y, size, duration, delay, drift, opacity, wideOnly]) => {
    const bubble = document.createElement('span');
    bubble.className = 'nhd-bubble' + (wideOnly ? ' nhd-bubble--wide-only' : '');
    bubble.style.setProperty('--bubble-x', x);
    bubble.style.setProperty('--bubble-y', y);
    bubble.style.setProperty('--bubble-size', size);
    bubble.style.setProperty('--bubble-duration', duration);
    bubble.style.setProperty('--bubble-delay', delay);
    bubble.style.setProperty('--bubble-drift', drift);
    bubble.style.setProperty('--bubble-opacity', '1');
    bubble.style.setProperty('--bubble-push-x', '0px');
    bubble.style.setProperty('--bubble-push-y', '0px');
    ambientLayer.appendChild(bubble);
  });
  const ensureAmbientLayer = () => {
    const appRoot = document.getElementById('root') || document.body;
    if (ambientLayer.parentElement !== appRoot) appRoot.prepend(ambientLayer);
  };
  ensureAmbientLayer();

  const bubbleElements = [...ambientLayer.querySelectorAll('.nhd-bubble')];
  const bubblePushState = new Map(bubbleElements.map((bubble) => [bubble, {x: 0, y: 0}]));
  let bubblePointerX = -10000;
  let bubblePointerY = -10000;
  let bubblePointerFrame = 0;
  let scrollActivityTimer = 0;

  const onThemeScrollActivity = (event) => {
    const target = event.target;
    if (!target?.matches?.('.thread-scroll-container, [data-app-action-sidebar-scroll]')) return;
    document.documentElement.dataset.zhaScrollActive = 'true';
    if (scrollActivityTimer) window.clearTimeout(scrollActivityTimer);
    scrollActivityTimer = window.setTimeout(() => {
      delete document.documentElement.dataset.zhaScrollActive;
      scrollActivityTimer = 0;
    }, 180);
  };
  document.addEventListener('scroll', onThemeScrollActivity, true);

  const updateBubblePush = () => {
    bubblePointerFrame = 0;
    const ambientRect = ambientLayer.getBoundingClientRect();
    const maxPermanentPush = 96;
    bubbleElements.forEach((bubble) => {
      if (!bubble.isConnected || getComputedStyle(bubble).display === 'none') return;
      const rect = bubble.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - bubblePointerX;
      const dy = rect.top + rect.height / 2 - bubblePointerY;
      const distance = Math.hypot(dx, dy);
      const radius = 130 + rect.width;
      if (distance <= 0.1 || distance >= radius) return;

      const state = bubblePushState.get(bubble);
      const force = Math.pow(1 - distance / radius, 2) * Math.min(18, 10 + rect.width * 0.12);
      let deltaX = dx / distance * force;
      let deltaY = dy / distance * force;
      const nextX = Math.max(-maxPermanentPush, Math.min(maxPermanentPush, state.x + deltaX));
      const nextY = Math.max(-maxPermanentPush, Math.min(maxPermanentPush, state.y + deltaY));
      const projectedLeft = rect.left + (nextX - state.x);
      const projectedTop = rect.top + (nextY - state.y);
      const projectedRight = rect.right + (nextX - state.x);
      const projectedBottom = rect.bottom + (nextY - state.y);
      state.x += Math.max(ambientRect.left + 8 - projectedLeft, Math.min(ambientRect.right - 8 - projectedRight, nextX - state.x));
      state.y += Math.max(ambientRect.top + 8 - projectedTop, Math.min(ambientRect.bottom - 8 - projectedBottom, nextY - state.y));
      bubble.style.setProperty('--bubble-push-x', state.x.toFixed(2) + 'px');
      bubble.style.setProperty('--bubble-push-y', state.y.toFixed(2) + 'px');
    });
  };

  const scheduleBubblePush = () => {
    if (!bubblePointerFrame) bubblePointerFrame = window.requestAnimationFrame(updateBubblePush);
  };

  const onBubblePointerMove = (event) => {
    bubblePointerX = event.clientX;
    bubblePointerY = event.clientY;
    scheduleBubblePush();
  };

  window.addEventListener('pointermove', onBubblePointerMove, {passive: true});

  let decorationTimer = 0;
  let composerFollowupTimer = 0;
  let observedComposer = null;
  let composerResizeObserver = null;
  let activeStickerChatKey = null;
  let activeStickerIndex = -1;

  const applyThemeDecorations = () => {
    decorationTimer = 0;
    ensureAmbientLayer();
    const desiredLabels = new Set();
    document.querySelectorAll('aside.app-shell-left-panel span').forEach((label) => {
      const text = (label.textContent || '').trim();
      if (label.children.length === 0 && ['\u7f6e\u9876', '\u9879\u76ee', '\u4efb\u52a1'].includes(text)) {
        desiredLabels.add(label);
      }
    });
    document.querySelectorAll('[data-zha-section-label]').forEach((label) => {
      if (!desiredLabels.has(label)) label.removeAttribute('data-zha-section-label');
    });
    desiredLabels.forEach((label) => label.setAttribute('data-zha-section-label', 'true'));

    const desiredPanels = new Set();
    document.querySelectorAll('main[data-app-shell-main-surface] div.rounded-3xl.bg-surface-elevated-secondary').forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      if (rect.width >= 220 && rect.height >= 96) desiredPanels.add(panel);
    });
    document.querySelectorAll('[data-zha-tool-panel]').forEach((panel) => {
      if (!desiredPanels.has(panel)) panel.removeAttribute('data-zha-tool-panel');
    });
    desiredPanels.forEach((panel) => panel.setAttribute('data-zha-tool-panel', 'true'));

    const desiredChatPanes = new Set();
    const mainSurface = document.querySelector('main[data-app-shell-main-surface]');
    const threadFooter = document.querySelector('[data-thread-scroll-footer]');
    let stickerLayer = document.getElementById('zha-nahida-sticker');
    if (threadFooter && (!stickerLayer || stickerLayer.parentElement !== threadFooter)) {
      stickerLayer?.remove();
      stickerLayer = document.createElement('div');
      stickerLayer.id = 'zha-nahida-sticker';
      stickerLayer.setAttribute('aria-hidden', 'true');
      threadFooter.append(stickerLayer);
    }
    const composer = document.querySelector('[data-composer-surface-variant]');
    const threadScroll = composer?.closest('[data-app-action-timeline-scroll]') || document.querySelector('[data-app-action-timeline-scroll]');
    const chatPane = threadScroll?.parentElement;
    let composerHeight = 0;
    let stickerLeftSpace = 0;
    let stickerLeft = 0;
    let stickerBottom = 0;
    let stickerVisible = false;
    let stickerSize = 0;
    let composerRightGap = 8;
    const cornerSize = 98;
    let cornerTopOffset = 0;
    let cornerRightOffset = 0;
    let chatPaneNarrow = false;
    if (chatPane) {
      desiredChatPanes.add(chatPane);
      const paneRect = chatPane.getBoundingClientRect();
      chatPaneNarrow = paneRect.width < 1200;
      if (composer) composerHeight = composer.getBoundingClientRect().height;
      const activeThread = document.querySelector('aside.app-shell-left-panel [data-app-action-sidebar-thread-active="true"], aside.app-shell-left-panel [aria-current="page"]');
      const chatKey = activeThread?.getAttribute('data-app-action-sidebar-thread-id') || activeThread?.getAttribute('data-app-action-sidebar-thread-title') || document.title;
      if (stickerAssets.length && chatKey !== activeStickerChatKey) {
        let nextStickerIndex = Math.floor(Math.random() * stickerAssets.length);
        if (stickerAssets.length > 1 && nextStickerIndex === activeStickerIndex) {
          nextStickerIndex = (nextStickerIndex + 1 + Math.floor(Math.random() * (stickerAssets.length - 1))) % stickerAssets.length;
        }
        activeStickerChatKey = chatKey;
        activeStickerIndex = nextStickerIndex;
      }
      if (composer) {
        const composerRect = composer.getBoundingClientRect();
        stickerLeftSpace = Math.max(0, Math.floor(composerRect.left - paneRect.left));
        composerRightGap = Math.max(0, Math.floor(paneRect.right - composerRect.right));
        cornerTopOffset = Math.max(0, composerRect.top - paneRect.top - cornerSize);
        cornerRightOffset = Math.max(0, composerRightGap - cornerSize - 12);
        stickerVisible = stickerLeftSpace >= 210;
        stickerSize = stickerVisible ? Math.min(240, stickerLeftSpace - 28) : 0;
      }
      if (threadFooter) {
        const footerRect = threadFooter.getBoundingClientRect();
        stickerLeft = Math.max(0, paneRect.left - footerRect.left + 18);
        stickerBottom = 16;
      }
      chatPane.setAttribute('data-zha-chat-pane', 'true');
      chatPane.toggleAttribute('data-zha-chat-narrow', chatPaneNarrow);
      chatPane.style.setProperty('--zha-corner-size', cornerSize + 'px');
      chatPane.style.setProperty('--zha-composer-right-gap', composerRightGap + 'px');
      chatPane.style.setProperty('--zha-corner-top-offset', cornerTopOffset.toFixed(2) + 'px');
      chatPane.style.setProperty('--zha-corner-right-offset', cornerRightOffset + 'px');
      if (stickerLayer) {
        stickerLayer.style.setProperty('--zha-sticker-left', stickerLeft.toFixed(2) + 'px');
        stickerLayer.style.setProperty('--zha-sticker-bottom', stickerBottom.toFixed(2) + 'px');
        stickerLayer.style.setProperty('--zha-sticker-size', stickerSize + 'px');
        stickerLayer.setAttribute('data-zha-sticker-visible', stickerVisible ? 'true' : 'false');
        if (activeStickerIndex >= 0) {
          stickerLayer.setAttribute('data-zha-sticker-index', String(activeStickerIndex));
          stickerLayer.style.setProperty('--zha-sticker-image', 'url("' + stickerAssets[activeStickerIndex] + '")');
        }
      }
    }
    document.querySelectorAll('[data-zha-chat-pane]').forEach((pane) => {
      if (desiredChatPanes.has(pane)) return;
      pane.removeAttribute('data-zha-chat-pane');
      pane.removeAttribute('data-zha-chat-narrow');
      pane.style.removeProperty('--zha-corner-size');
      pane.style.removeProperty('--zha-composer-right-gap');
      pane.style.removeProperty('--zha-corner-top-offset');
      pane.style.removeProperty('--zha-corner-right-offset');
    });
    if (!chatPane || !threadFooter || !stickerLayer) document.getElementById('zha-nahida-sticker')?.remove();

    if (composerResizeObserver && composer !== observedComposer) {
      if (observedComposer) composerResizeObserver.unobserve(observedComposer);
      observedComposer = composer;
      if (observedComposer) composerResizeObserver.observe(observedComposer);
    }

    return {
      sectionLabels: desiredLabels.size,
      toolPanels: desiredPanels.size,
      chatPanes: desiredChatPanes.size,
      composerHeight,
      cornerSize,
      chatPaneNarrow,
      composerRightGap,
      cornerTopOffset,
      cornerRightOffset,
      stickerLeftSpace,
      stickerVisible,
      stickerSize,
      stickerIndex: activeStickerIndex,
      stickerCount: stickerAssets.length
    };
  };

  const scheduleThemeDecorations = () => {
    if (!decorationTimer) decorationTimer = window.setTimeout(applyThemeDecorations, 24);
  };

  const scheduleComposerDecorations = () => {
    scheduleThemeDecorations();
    if (composerFollowupTimer) window.clearTimeout(composerFollowupTimer);
    composerFollowupTimer = window.setTimeout(() => {
      composerFollowupTimer = 0;
      scheduleThemeDecorations();
    }, 96);
  };

  const onComposerInput = (event) => {
    if (event.target instanceof Element && event.target.closest('[data-codex-composer-root]')) {
      scheduleComposerDecorations();
    }
  };

  window.addEventListener('resize', scheduleComposerDecorations, {passive: true});
  document.addEventListener('input', onComposerInput, true);
  composerResizeObserver = new ResizeObserver(scheduleComposerDecorations);

  const decorationObserver = new MutationObserver(scheduleThemeDecorations);
  decorationObserver.observe(document.getElementById('root') || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label', 'aria-current', 'data-app-action-sidebar-thread-active']
  });
  let decorationDiagnostics = applyThemeDecorations();

  const copyFeedbackTimers = new Set();
  const onCopyClick = (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('[data-markdown-copy="code-block"] > [data-markdown-copy="exclude"] button');
    if (!button) return;

    button.removeAttribute('data-zha-copy-feedback');
    void button.offsetWidth;
    button.setAttribute('data-zha-copy-feedback', 'active');

    const timer = window.setTimeout(() => {
      button.removeAttribute('data-zha-copy-feedback');
      copyFeedbackTimers.delete(timer);
    }, 700);
    copyFeedbackTimers.add(timer);
  };

  document.addEventListener('click', onCopyClick, true);
  window.__zhaNahidaRuntime = {
    refreshDecorations: applyThemeDecorations,
    dispose() {
      decorationObserver.disconnect();
      if (decorationTimer) window.clearTimeout(decorationTimer);
      if (composerFollowupTimer) window.clearTimeout(composerFollowupTimer);
      composerResizeObserver.disconnect();
      window.removeEventListener('resize', scheduleComposerDecorations);
      document.removeEventListener('input', onComposerInput, true);
      if (bubblePointerFrame) window.cancelAnimationFrame(bubblePointerFrame);
      if (scrollActivityTimer) window.clearTimeout(scrollActivityTimer);
      window.removeEventListener('pointermove', onBubblePointerMove);
      document.removeEventListener('scroll', onThemeScrollActivity, true);
      delete document.documentElement.dataset.zhaScrollActive;
      ambientLayer.remove();
      document.getElementById('zha-nahida-sticker')?.remove();
      document.querySelectorAll('[data-zha-section-label]').forEach((label) => label.removeAttribute('data-zha-section-label'));
      document.querySelectorAll('[data-zha-tool-panel]').forEach((panel) => panel.removeAttribute('data-zha-tool-panel'));
      document.querySelectorAll('[data-zha-chat-pane]').forEach((pane) => {
        pane.removeAttribute('data-zha-chat-pane');
        pane.removeAttribute('data-zha-chat-narrow');
        pane.style.removeProperty('--zha-corner-size');
        pane.style.removeProperty('--zha-composer-right-gap');
        pane.style.removeProperty('--zha-corner-top-offset');
        pane.style.removeProperty('--zha-corner-right-offset');
      });
      document.removeEventListener('click', onCopyClick, true);
      copyFeedbackTimers.forEach((timer) => window.clearTimeout(timer));
      copyFeedbackTimers.clear();
      document.querySelectorAll('[data-zha-copy-feedback]').forEach((element) => {
        element.removeAttribute('data-zha-copy-feedback');
      });
    }
  };

  await new Promise((resolve) => window.setTimeout(resolve, 90));
  decorationDiagnostics = applyThemeDecorations();

  return {
    injected: true,
    bytes: css.length,
    legacyRemoved,
    oldIconRemoved,
    runtimeEffects: true,
    decorationDiagnostics,
    ambientParticles: ambientLayer.querySelectorAll('.nhd-particle').length,
    ambientBubbles: ambientLayer.querySelectorAll('.nhd-bubble').length,
    theme: document.documentElement.dataset.zhaTheme,
    title: document.title,
    url: location.href
  };
})()
