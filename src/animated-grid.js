/**
 * Animated SVG grid background.
 * Draws subtle grid lines with squares that fade in/out at random positions.
 * Vanilla JS port of the React AnimatedGridPattern component.
 */

const SVG_NS = 'http://www.w3.org/2000/svg'

let gridCounter = 0

/**
 * Create and inject an animated SVG grid background into document.body.
 * @param {Object} [options]
 * @param {number} [options.cellSize=40]       Grid cell size in px
 * @param {number} [options.squareCount=20]    Number of animated squares
 * @param {number} [options.minDuration=3]     Min animation cycle in seconds
 * @param {number} [options.maxDuration=8]     Max animation cycle in seconds
 */
export function initAnimatedGrid(options = {}) {
  const {
    cellSize = 40,
    squareCount = 20,
    minDuration = 3,
    maxDuration = 8,
  } = options

  // Prevent duplicate grids on the same page
  if (document.querySelector('.animated-grid-bg')) return

  const patternId = `grid-pattern-${gridCounter++}`

  // Build SVG
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'animated-grid-bg')
  svg.setAttribute('aria-hidden', 'true')

  // Pattern definition for grid lines
  const defs = document.createElementNS(SVG_NS, 'defs')
  const pattern = document.createElementNS(SVG_NS, 'pattern')
  pattern.setAttribute('id', patternId)
  pattern.setAttribute('width', cellSize)
  pattern.setAttribute('height', cellSize)
  pattern.setAttribute('patternUnits', 'userSpaceOnUse')
  pattern.setAttribute('x', '-1')
  pattern.setAttribute('y', '-1')

  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', `M.5 ${cellSize}V.5H${cellSize}`)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '1')
  pattern.appendChild(path)
  defs.appendChild(pattern)
  svg.appendChild(defs)

  // Background rect filled with grid pattern
  const bgRect = document.createElementNS(SVG_NS, 'rect')
  bgRect.setAttribute('width', '100%')
  bgRect.setAttribute('height', '100%')
  bgRect.setAttribute('fill', `url(#${patternId})`)
  svg.appendChild(bgRect)

  // Animated squares
  const squaresGroup = document.createElementNS(SVG_NS, 'svg')
  squaresGroup.setAttribute('class', 'grid-squares-group')
  squaresGroup.style.overflow = 'visible'

  const squares = []
  for (let i = 0; i < squareCount; i++) {
    const rect = document.createElementNS(SVG_NS, 'rect')
    rect.setAttribute('class', 'grid-square')
    rect.setAttribute('width', cellSize - 1)
    rect.setAttribute('height', cellSize - 1)
    rect.setAttribute('fill', 'rgba(176, 176, 176, 1)')
    rect.setAttribute('stroke-width', '0')

    const duration = minDuration + Math.random() * (maxDuration - minDuration)
    const delay = Math.random() * duration
    rect.style.setProperty('--grid-duration', `${duration.toFixed(1)}s`)
    rect.style.setProperty('--grid-delay', `${delay.toFixed(1)}s`)

    squaresGroup.appendChild(rect)
    squares.push(rect)
  }

  svg.appendChild(squaresGroup)

  // Position a square at a random grid cell within current viewport
  function positionSquare(rect) {
    const cols = Math.floor(window.innerWidth / cellSize)
    const rows = Math.floor(window.innerHeight / cellSize)
    if (cols < 1 || rows < 1) {
      rect.setAttribute('x', -cellSize)
      rect.setAttribute('y', -cellSize)
      return
    }
    const x = Math.floor(Math.random() * cols) * cellSize + 1
    const y = Math.floor(Math.random() * rows) * cellSize + 1
    rect.setAttribute('x', x)
    rect.setAttribute('y', y)
  }

  // Initial positioning
  squares.forEach(positionSquare)

  // Reposition each square after every animation cycle
  squares.forEach((rect) => {
    rect.addEventListener('animationiteration', () => positionSquare(rect))
  })

  // Reposition all squares on resize (debounced)
  let resizeTimer = null
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => squares.forEach(positionSquare), 250)
  })

  // Pause animations when tab is hidden
  document.addEventListener('visibilitychange', () => {
    const state = document.hidden ? 'paused' : 'running'
    squares.forEach((rect) => {
      rect.style.animationPlayState = state
    })
  })

  // Inject as first child of body so it sits behind everything
  document.body.insertBefore(svg, document.body.firstChild)
}
