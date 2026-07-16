/**
 * Canonical global-style entrypoint.
 *
 * Import order is a release contract. Route and feature modules must not import
 * these global sheets directly; add route-owned styles to the ownership map
 * before changing this sequence.
 */
import "@/app/globals.css";
import "@/styles/vibes-3d-maestoso.css";
import "@/styles/figma-final-polish.css";
