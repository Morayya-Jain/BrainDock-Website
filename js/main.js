/**
 * BrainDock Website - Shared JavaScript
 * Handles mobile menu toggle and FAQ accordion functionality
 */

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.getElementById('nav-mobile');
  
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

    // Close mobile menu when viewport widens past mobile breakpoint
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 950 && navMobile.classList.contains('active')) {
        navMobile.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
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

  /**
   * Show the benefit card centered on screen.
   */
  function showCard(item, explanation) {
    benefitCardText.textContent = explanation;
    benefitCard.classList.add('active');
    benefitCardOverlay.classList.add('active');
    activeItem = item;
  }

  /**
   * Hide the benefit card.
   */
  function hideCard() {
    benefitCard.classList.remove('active');
    benefitCardOverlay.classList.remove('active');
    activeItem = null;
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
  });

  // Close card when clicking overlay
  benefitCardOverlay.addEventListener('click', hideCard);

  // Close card when clicking the card itself
  benefitCard.addEventListener('click', hideCard);

  // Close card on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
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
