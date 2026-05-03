/**
 * js/text-filters.js — SVG filter definitions for text effects
 *
 * Loaded as a synchronous <script> at the top of <body> so filter IDs
 * are in the DOM before CSS rules that reference them (e.g. url(#tight-bubble))
 * are applied on first paint. Do not add defer or async.
 *
 * Filters
 * ───────
 *  #tight-bubble  Bio keywords highlight bubble.
 *                 CSS: .bio-keywords-bg { filter: url(#tight-bubble) }
 *                 Produces a single gooey background shape behind the keyword
 *                 text. The visible text is rendered on a separate, unfiltered
 *                 layer for full sharpness.
 *
 *  #blob          Free-form noise displacement primitive (unused; available).
 */
(function () {
  'use strict';

  var markup = /* html */`
<svg width="0" height="0" aria-hidden="true" focusable="false"
     id="site-svg-filters"
     style="position:absolute;width:0;height:0;overflow:hidden">
  <defs>

    <filter id="blob" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04"
                    numOctaves="1" result="noise" seed="4"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="12"
                         xChannelSelector="R" yChannelSelector="G"/>
    </filter>

    <filter id="tight-bubble" x="-50%" y="-50%" width="200%" height="200%"
            color-interpolation-filters="sRGB">
      <!-- Dilate → noise warp → heavy blur → steep alpha ramp = gooey unified blob -->
      <feMorphology operator="dilate" radius="5"
                    in="SourceAlpha" result="dilated"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.04"
                    numOctaves="1" result="noise" seed="4"/>
      <feDisplacementMap in="dilated" in2="noise" scale="2"
                         xChannelSelector="R" yChannelSelector="G"
                         result="displaced"/>
      <feGaussianBlur stdDeviation="7" in="displaced" result="blurred"/>
      <feColorMatrix type="matrix"
                     values="0 0 0 0 0
                             0 0 0 0 0
                             0 0 0 0 0
                             0 0 0 80 -35"
                     in="blurred" result="gooey"/>
      <feFlood flood-color="#b3e0f2" result="highlight"/>
      <feComposite in="highlight" in2="gooey" operator="in"/>
    </filter>

  </defs>
</svg>`.trim();

  var host = document.createElement('div');
  host.innerHTML = markup;
  document.body.appendChild(host.firstChild);

}());

