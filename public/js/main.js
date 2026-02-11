/**
 * BrainDock Website - Shared JavaScript
 * Handles mobile menu toggle, responsive nav, and FAQ accordion functionality
 */

/** Detect user's OS and return the matching direct download URL. */
function getDownloadUrl() {
  const ua = navigator.userAgent || ''
  if (/Mac|iPhone|iPad|iPod/.test(ua)) return 'https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-macOS.dmg'
  if (/Win/.test(ua)) return 'https://github.com/Morayya-Jain/BrainDock/releases/latest/download/BrainDock-Setup.exe'
  return null // unknown OS - keep default #download anchor
}

// Mobile menu toggle and responsive navigation
document.addEventListener('DOMContentLoaded', function() {
  const nav = document.querySelector('.nav');
  const navContainer = document.querySelector('.nav-container');
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.getElementById('nav-mobile');
  const navLinks = document.querySelector('.nav-links');
  const navLogo = document.querySelector('.nav-logo');
  const navCta = document.querySelector('.nav-cta');

  // Point header download button directly to OS-specific download
  const downloadUrl = getDownloadUrl()
  if (downloadUrl) {
    const navDownloadBtn = document.querySelector('a[href="#download"].btn-primary.nav-cta')
    if (navDownloadBtn) navDownloadBtn.href = downloadUrl
  }

  /**
   * Dynamically check if navigation elements fit in the container.
   * Adds 'nav-compact' class to nav when elements would overflow.
   */
  function checkNavFit() {
    if (!navContainer || !navLinks || !navLogo) return;

    // Temporarily remove compact mode to measure true widths
    nav.classList.remove('nav-compact');

    // Force a reflow to get accurate measurements
    void navContainer.offsetWidth;

    // Get the container's available width (accounting for padding)
    const containerStyle = getComputedStyle(navContainer);
    const containerPadding = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
    const availableWidth = navContainer.clientWidth - containerPadding;

    // Measure each element's width
    const logoWidth = navLogo.offsetWidth;
    const linksWidth = navLinks.scrollWidth;
    const ctaWidth = navCta ? navCta.offsetWidth : 0;

    // Get gap size from CSS custom property or fallback
    const gap = parseFloat(getComputedStyle(navContainer).gap) || 32;

    // Calculate total required width (elements + gaps between them)
    // Elements: logo, links, cta = 2 gaps between 3 elements
    let elementCount = 1; // logo always present
    if (linksWidth > 0) elementCount++;
    if (ctaWidth > 0) elementCount++;
    const totalGaps = (elementCount - 1) * gap;

    const requiredWidth = logoWidth + linksWidth + ctaWidth + totalGaps;

    // Add buffer for safety (20px)
    const buffer = 20;

    // If not enough space, switch to compact/mobile mode
    if (requiredWidth + buffer > availableWidth) {
      nav.classList.add('nav-compact');
    }
  }

  // Mark that JS is handling responsive nav (for CSS fallback)
  if (nav) {
    nav.setAttribute('data-js-ready', 'true');
  }

  /**
   * Dynamically check if hero CTA buttons fit in a row.
   * Adds 'hero-compact' class to body when buttons would wrap.
   */
  const heroCtas = document.querySelector('.hero-ctas');
  const heroCtaButtons = heroCtas ? heroCtas.querySelectorAll('.btn') : [];

  function checkHeroCtasFit() {
    if (!heroCtas || heroCtaButtons.length < 2) return;

    // Temporarily remove compact mode to measure true widths
    document.body.classList.remove('hero-compact');

    // Force a reflow to get accurate measurements
    void heroCtas.offsetWidth;

    // Get the container's available width
    const containerWidth = heroCtas.clientWidth;

    // Measure total width of all buttons plus gaps
    let totalButtonsWidth = 0;
    heroCtaButtons.forEach(btn => {
      totalButtonsWidth += btn.offsetWidth;
    });

    // Get gap between buttons
    const gap = parseFloat(getComputedStyle(heroCtas).gap) || 16;
    const totalGaps = (heroCtaButtons.length - 1) * gap;

    const requiredWidth = totalButtonsWidth + totalGaps;

    // Add buffer for safety (10px)
    const buffer = 10;

    // If not enough space, switch to compact/stacked mode
    if (requiredWidth + buffer > containerWidth) {
      document.body.classList.add('hero-compact');
    }
  }

  // Run all responsive checks
  function runAllResponsiveChecks() {
    checkNavFit();
    checkHeroCtasFit();
    drawRoadmapPath();
  }

  // Run checks on load and after fonts are ready
  runAllResponsiveChecks();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(runAllResponsiveChecks);
  }

  // Debounced resize handler for all responsive checks
  let responsiveResizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(responsiveResizeTimeout);
    responsiveResizeTimeout = setTimeout(runAllResponsiveChecks, 50);
  });

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function() {
      const isOpen = navMobile.classList.toggle('active');
      this.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-mobile a').forEach(link => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMobile.classList.contains('active') && 
          !navMobile.contains(e.target) && 
          !navToggle.contains(e.target)) {
        navMobile.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close mobile menu when nav exits compact mode
    let menuResizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(menuResizeTimeout);
      menuResizeTimeout = setTimeout(function() {
        if (!nav.classList.contains('nav-compact') && navMobile.classList.contains('active')) {
          navMobile.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      }, 100);
    });
  }

  // FAQ accordion toggle (only on pages with FAQ)
  const faqQuestions = document.querySelectorAll('.faq-question');
  if (faqQuestions.length > 0) {
    faqQuestions.forEach(button => {
      button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
          item.classList.remove('active');
          item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        
        // Toggle current item
        if (!isActive) {
          faqItem.classList.add('active');
          button.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // Roadmap S-curve path
  drawRoadmapPath();

  // Made For You audience pill switcher
  initMadeForYou();

  // Linux coming soon popup
  initComingSoonPopup();
});

/**
 * Draw the organic S-curve SVG path connecting roadmap dots.
 * Measures dot positions dynamically so the path adapts to any content height.
 * Only active on desktop (768px+); mobile uses a CSS fallback line.
 */
function drawRoadmapPath() {
  const container = document.querySelector('.roadmap-container');
  const svg = document.querySelector('.roadmap-svg');
  const path = document.querySelector('.roadmap-path');
  const dots = document.querySelectorAll('.roadmap-dot');

  if (!container || !svg || !path || dots.length < 2) return;

  // Only draw the SVG curve on desktop (768px+)
  if (window.innerWidth < 768) {
    path.removeAttribute('d');
    return;
  }

  const containerRect = container.getBoundingClientRect();

  // Collect the center coordinates of each dot relative to the container
  const points = [];
  dots.forEach(dot => {
    const dotRect = dot.getBoundingClientRect();
    points.push({
      x: dotRect.left + dotRect.width / 2 - containerRect.left,
      y: dotRect.top + dotRect.height / 2 - containerRect.top
    });
  });

  // Build the SVG path using cubic Bezier curves
  // Start at the first dot
  let d = `M ${points[0].x},${points[0].y}`;

  // Connect each consecutive pair with a smooth S-curve
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const verticalGap = (next.y - current.y) / 2;

    // Control points create a vertical-tangent curve (smooth S shape)
    const cp1x = current.x;
    const cp1y = current.y + verticalGap;
    const cp2x = next.x;
    const cp2y = next.y - verticalGap;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }

  // Update the SVG viewBox to match the container dimensions
  svg.setAttribute('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`);
  path.setAttribute('d', d);
}

/**
 * Initialize the "Made For You" audience pill switcher.
 * Implements WAI-ARIA Tabs pattern with arrow key navigation.
 * Also rewrites download buttons to OS-specific URLs.
 */
function initMadeForYou() {
  const pills = document.querySelectorAll('.mfy-pill');
  const panels = document.querySelectorAll('.mfy-panel');

  if (!pills.length || !panels.length) return;

  /** Activate a pill and show its corresponding panel. */
  function activateTab(pill) {
    // Deactivate all pills
    pills.forEach(p => {
      p.classList.remove('active');
      p.setAttribute('aria-selected', 'false');
      p.setAttribute('tabindex', '-1');
    });

    // Hide all panels
    panels.forEach(p => p.classList.remove('active'));

    // Activate the selected pill
    pill.classList.add('active');
    pill.setAttribute('aria-selected', 'true');
    pill.setAttribute('tabindex', '0');
    pill.focus();

    // Show the matching panel
    const panelId = pill.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('active');
  }

  // Click handler for each pill
  pills.forEach(pill => {
    pill.addEventListener('click', () => activateTab(pill));
  });

  // Arrow key navigation (WAI-ARIA Tabs pattern)
  pills.forEach((pill, index) => {
    pill.addEventListener('keydown', (e) => {
      let newIndex;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = (index + 1) % pills.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = (index - 1 + pills.length) % pills.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = pills.length - 1;
      }
      if (newIndex !== undefined) {
        activateTab(pills[newIndex]);
      }
    });
  });

  // Rewrite download buttons to OS-specific URL (same as nav CTA)
  const downloadUrl = getDownloadUrl();
  if (downloadUrl) {
    document.querySelectorAll('.mfy-download-btn').forEach(btn => {
      btn.href = downloadUrl;
    });
  }
}

/**
 * Initialize the "Coming Soon" popup for the Linux download button.
 */
function initComingSoonPopup() {
  const linuxBtn = document.getElementById('linux-download-btn');
  const popup = document.getElementById('coming-soon-popup');
  const overlay = document.getElementById('coming-soon-overlay');
  const closeBtn = document.getElementById('popup-close-btn');

  if (!linuxBtn || !popup || !overlay || !closeBtn) {
    return;
  }

  /**
   * Show the coming soon popup.
   */
  function showPopup() {
    popup.classList.add('active');
    overlay.classList.add('active');
  }

  /**
   * Hide the coming soon popup.
   */
  function hidePopup() {
    popup.classList.remove('active');
    overlay.classList.remove('active');
  }

  // Show popup when clicking the Linux download button
  linuxBtn.addEventListener('click', showPopup);

  // Close popup when clicking the close button
  closeBtn.addEventListener('click', hidePopup);

  // Close popup when clicking the overlay
  overlay.addEventListener('click', hidePopup);

  // Close popup on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('active')) {
      hidePopup();
    }
  });
}
