/**
 * Animated SVG grid background (self-executing).
 * Landing page version - runs immediately on script load.
 * Dashboard/auth pages use the ES module at src/animated-grid.js instead.
 */
;(function () {
  'use strict'

  var SVG_NS = 'http://www.w3.org/2000/svg'
  var CELL_SIZE = 40
  var SQUARE_COUNT = 20
  var MIN_DURATION = 3
  var MAX_DURATION = 8

  if (document.querySelector('.animated-grid-bg')) return

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Build SVG
  var svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'animated-grid-bg')
  svg.setAttribute('aria-hidden', 'true')

  // Pattern for grid lines
  var defs = document.createElementNS(SVG_NS, 'defs')
  var pattern = document.createElementNS(SVG_NS, 'pattern')
  pattern.setAttribute('id', 'grid-pattern-landing')
  pattern.setAttribute('width', CELL_SIZE)
  pattern.setAttribute('height', CELL_SIZE)
  pattern.setAttribute('patternUnits', 'userSpaceOnUse')
  pattern.setAttribute('x', '-1')
  pattern.setAttribute('y', '-1')

  var path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', 'M.5 ' + CELL_SIZE + 'V.5H' + CELL_SIZE)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '1')
  pattern.appendChild(path)
  defs.appendChild(pattern)
  svg.appendChild(defs)

  // Background rect
  var bgRect = document.createElementNS(SVG_NS, 'rect')
  bgRect.setAttribute('width', '100%')
  bgRect.setAttribute('height', '100%')
  bgRect.setAttribute('fill', 'url(#grid-pattern-landing)')
  svg.appendChild(bgRect)

  // Animated squares
  if (!reducedMotion) {
    var squaresGroup = document.createElementNS(SVG_NS, 'svg')
    squaresGroup.setAttribute('class', 'grid-squares-group')
    squaresGroup.style.overflow = 'visible'

    var squares = []

    function positionSquare(rect) {
      var cols = Math.floor(window.innerWidth / CELL_SIZE)
      var rows = Math.floor(window.innerHeight / CELL_SIZE)
      if (cols < 1 || rows < 1) {
        rect.setAttribute('x', -CELL_SIZE)
        rect.setAttribute('y', -CELL_SIZE)
        return
      }
      rect.setAttribute('x', Math.floor(Math.random() * cols) * CELL_SIZE + 1)
      rect.setAttribute('y', Math.floor(Math.random() * rows) * CELL_SIZE + 1)
    }

    for (var i = 0; i < SQUARE_COUNT; i++) {
      var rect = document.createElementNS(SVG_NS, 'rect')
      rect.setAttribute('class', 'grid-square')
      rect.setAttribute('width', CELL_SIZE - 1)
      rect.setAttribute('height', CELL_SIZE - 1)
      rect.setAttribute('fill', 'rgba(176, 176, 176, 1)')
      rect.setAttribute('stroke-width', '0')

      var duration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION)
      var delay = Math.random() * duration
      rect.style.setProperty('--grid-duration', duration.toFixed(1) + 's')
      rect.style.setProperty('--grid-delay', delay.toFixed(1) + 's')

      squaresGroup.appendChild(rect)
      squares.push(rect)
    }

    svg.appendChild(squaresGroup)
    squares.forEach(positionSquare)

    // Reposition after each animation cycle
    squares.forEach(function (rect) {
      rect.addEventListener('animationiteration', function () { positionSquare(rect) })
    })

    // Debounced resize
    var resizeTimer = null
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(function () { squares.forEach(positionSquare) }, 250)
    })

    // Pause when tab hidden
    document.addEventListener('visibilitychange', function () {
      var state = document.hidden ? 'paused' : 'running'
      squares.forEach(function (rect) { rect.style.animationPlayState = state })
    })
  }

  document.body.insertBefore(svg, document.body.firstChild)
})()
