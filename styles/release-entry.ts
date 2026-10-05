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
import "@/styles/definitive-home.css";
import "@/styles/compare.css";
import "@/styles/radar.css";
import "@/styles/radar-full.css";
import "@/styles/tool-detail-final.css";
import "@/styles/public-routes.css";
import "@/styles/public-system.css";
import "@/styles/secondary-pages.css";
import "@/styles/admin-shell.css";
import "@/styles/partner-placements.css";
import "@/styles/premium-motion.css";
import "@/styles/member-experience.css";
import "@/styles/visual-character.css";
import "@/styles/visual-system.css";
import "@/styles/mockup-parity.css";
import "@/styles/mockup-parity-v3.css";
import "@/styles/mockup-parity-v4.css";
