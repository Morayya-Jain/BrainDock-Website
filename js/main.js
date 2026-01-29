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
  const CARD_WIDTH = 340;
  const GAP = 16;
  const VIEWPORT_PADDING = 16;

  /**
   * Measure the width of text as rendered.
   */
  function measureTextWidth(text, font) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
  }

  /**
   * Check if the card can fit beside the item (either left or right).
   * Returns { fits: boolean, side: 'left' | 'right' | null, position: object }
   */
  function calculateCardPosition(item) {
    const list = item.closest('.benefits-list');
    const benefitsGrid = item.closest('.benefits-grid');
    const lists = benefitsGrid.querySelectorAll('.benefits-list');
    const isLeftColumn = list === lists[0];
    
    const itemRect = item.getBoundingClientRect();
    const styles = window.getComputedStyle(item);
    const font = styles.font;
    const paddingLeft = parseFloat(styles.paddingLeft);
    
    const textWidth = measureTextWidth(item.textContent, font);
    const textEndX = itemRect.left + paddingLeft + textWidth;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate available space on each side
    const spaceOnRight = viewportWidth - textEndX - GAP - VIEWPORT_PADDING;
    const spaceOnLeft = itemRect.left - GAP - VIEWPORT_PADDING;
    
    // Check if card fits on the preferred side based on column
    if (isLeftColumn) {
      // Prefer right side for left column items
      if (spaceOnRight >= CARD_WIDTH) {
        return {
          fits: true,
          side: 'right',
          position: {
            left: textEndX + GAP,
            top: Math.min(itemRect.top, viewportHeight - 200)
          }
        };
      }
      // Try left side as fallback
      if (spaceOnLeft >= CARD_WIDTH) {
        return {
          fits: true,
          side: 'left',
          position: {
            right: viewportWidth - itemRect.left + GAP,
            top: Math.min(itemRect.top, viewportHeight - 200)
          }
        };
      }
    } else {
      // Prefer left side for right column items
      if (spaceOnLeft >= CARD_WIDTH) {
        return {
          fits: true,
          side: 'left',
          position: {
            right: viewportWidth - itemRect.left + GAP,
            top: Math.min(itemRect.top, viewportHeight - 200)
          }
        };
      }
      // Try right side as fallback
      if (spaceOnRight >= CARD_WIDTH) {
        return {
          fits: true,
          side: 'right',
          position: {
            left: textEndX + GAP,
            top: Math.min(itemRect.top, viewportHeight - 200)
          }
        };
      }
    }
    
    // Card doesn't fit on either side, will be centered
    return { fits: false, side: null, position: null };
  }

  /**
   * Show the benefit card. Always centers it on the screen.
   */
  function showCard(item, explanation) {
    benefitCardText.textContent = explanation;
    
    // Always center the card on the page
    benefitCard.classList.add('centered');
    // Clear any inline styles so CSS centering takes over
    benefitCard.style.left = '';
    benefitCard.style.right = '';
    benefitCard.style.top = '';
    
    benefitCard.classList.add('active');
    benefitCardOverlay.classList.add('active');
    activeItem = item;
  }

  /**
   * Hide the benefit card.
   */
  function hideCard() {
    benefitCard.classList.remove('active');
    benefitCard.classList.remove('centered');
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
