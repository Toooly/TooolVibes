/**
 * Canonical global-style entrypoint.
 *
 * Import order is a release contract. Route and feature modules must not import
 * these global sheets directly; add route-owned styles to the ownership map
 * before changing this sequence.
 */
import "@/app/globals.css";
import "@/styles/vibes-3d-maestoso.css";
import "@/styles/shell.css";
import "@/styles/home.css";
import "@/styles/catalog.css";
import "@/styles/compare.css";
import "@/styles/radar.css";
import "@/styles/tool-detail.css";
import "@/styles/public-routes.css";
import "@/styles/premium-motion.css";
