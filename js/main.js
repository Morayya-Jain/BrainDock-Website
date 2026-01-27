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
});

/**
 * Initialize benefit card popups for the "Why Use BrainDock?" section.
 * Shows floating card on click/tap.
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
   * Measure the width of text as rendered.
   */
  function measureTextWidth(text, font) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
  }

  /**
   * Show the benefit card positioned next to the given item.
   */
  function showCard(item, explanation) {
    benefitCardText.textContent = explanation;
    
    // Determine if item is in left or right column
    const list = item.closest('.benefits-list');
    const benefitsGrid = item.closest('.benefits-grid');
    const lists = benefitsGrid.querySelectorAll('.benefits-list');
    const isLeftColumn = list === lists[0];
    
    // Get item position and computed styles
    const itemRect = item.getBoundingClientRect();
    const styles = window.getComputedStyle(item);
    const font = styles.font;
    const paddingLeft = parseFloat(styles.paddingLeft);
    
    // Measure actual text width
    const textWidth = measureTextWidth(item.textContent, font);
    const textEndX = itemRect.left + paddingLeft + textWidth;
    
    const gap = 16;
    
    // Position card next to the item
    if (isLeftColumn) {
      // Card appears right after the text ends
      benefitCard.style.left = (textEndX + gap) + 'px';
      benefitCard.style.right = 'auto';
    } else {
      // Card appears to the left of right column items (before the bullet)
      benefitCard.style.left = 'auto';
      benefitCard.style.right = (window.innerWidth - itemRect.left + gap) + 'px';
    }
    
    // Align top of card with the item
    benefitCard.style.top = itemRect.top + 'px';
    
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
