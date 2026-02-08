/**
 * BrainDock Website - Shared JavaScript
 * Handles mobile menu toggle, responsive nav, and FAQ accordion functionality
 */

// Mobile menu toggle and responsive navigation
document.addEventListener('DOMContentLoaded', function() {
  const nav = document.querySelector('.nav');
  const navContainer = document.querySelector('.nav-container');
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.getElementById('nav-mobile');
  const navLinks = document.querySelector('.nav-links');
  const navLogo = document.querySelector('.nav-logo');
  const navCta = document.querySelector('.nav-cta');

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

  // Benefit card popup functionality
  initBenefitCards();

  // Linux coming soon popup
  initComingSoonPopup();
});

/**
 * Initialize benefit card popups for the "Why Use BrainDock?" section.
 * Shows floating card on click/tap. Centers card if it won't fit beside the item.
 */
function initBenefitCards() {
  const benefitItems = document.querySelectorAll('.benefits-list li[data-explanation]');
  const benefitCard = document.getElementById('benefit-card');
  const benefitCardText = benefitCard?.querySelector('.benefit-card-text');
  const benefitCardOverlay = document.getElementById('benefit-card-overlay');
  
  if (!benefitItems.length || !benefitCard || !benefitCardText || !benefitCardOverlay) {
    return;
  }

  let activeItem = null;
  let previouslyFocusedElement = null;

  /**
   * Show the benefit card centered on screen.
   * Manages focus for accessibility.
   */
  function showCard(item, explanation) {
    // Store the previously focused element to restore later
    previouslyFocusedElement = document.activeElement;
    
    benefitCardText.textContent = explanation;
    benefitCard.classList.add('active');
    benefitCardOverlay.classList.add('active');
    activeItem = item;
    
    // Move focus to the card for accessibility
    benefitCard.focus();
  }

  /**
   * Hide the benefit card.
   * Restores focus to the previously focused element.
   */
  function hideCard() {
    benefitCard.classList.remove('active');
    benefitCardOverlay.classList.remove('active');
    activeItem = null;
    
    // Restore focus to the element that opened the card
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  }

  benefitItems.forEach(item => {
    const explanation = item.getAttribute('data-explanation');

    // Click/tap to show or hide
    item.addEventListener('click', () => {
      if (activeItem === item) {
        hideCard();
      } else {
        showCard(item, explanation);
      }
    });

    // Keyboard activation (Enter/Space) for accessibility
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeItem === item) {
          hideCard();
        } else {
          showCard(item, explanation);
        }
      }
    });
  });

  // Close card when clicking overlay (outside the card)
  benefitCardOverlay.addEventListener('click', hideCard);

  // Prevent clicks inside the card from closing it
  benefitCard.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Close card on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && benefitCard.classList.contains('active')) {
      hideCard();
    }
  });
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
