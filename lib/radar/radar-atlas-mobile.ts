import type { AtlasBeaconTier } from "./radar-atlas-beacons";
import { rankAtlasBeacons } from "./radar-atlas-beacons";
import { planRadarAtlasConstellation } from "./radar-atlas-constellation";
import type { RadarLocalFocusSignal } from "./radar-local-focus";
import type { RadarPoint2 } from "./radar-projection";

export const ATLAS_MOBILE_HIT_PX = 48;
export const ATLAS_MOBILE_GAP_PX = 6;
export const ATLAS_MICRO_PAGE_SIZE = 8;
export type AtlasMobileSignal = RadarLocalFocusSignal & { attention: number; ageHours: number | null };
export type AtlasStack = RadarPoint2 & { id: string; memberIds: string[]; ageLabel: string; radiusRatio: number };
export type AtlasMobilePlan = { positions: Map<string, RadarPoint2>; stacks: AtlasStack[]; visibleIds: Set<string>; radii: Map<string, number> };

/** Visible body and interactive target are independent physical dimensions. */
export function atlasMobileBodyPx(tier: AtlasBeaconTier, attention: number, strongest: number) {
  const ratio = Math.sqrt(Math.max(0, attention) / Math.max(1, strongest));
  if (tier === "primary") return 40 + 2 * ratio;
  if (tier === "secondary") return 28 + 4 * ratio;
  if (tier === "ambient") return 22 + 2 * ratio;
  return 24 + 4 * ratio;
}
export function atlasMobileRadii(signals: readonly AtlasMobileSignal[], width: number, local = true) {
  const tiers = rankAtlasBeacons(signals);
  const strongest = Math.max(1, ...signals.map(s => s.attention));
  return new Map(signals.map(s => {
    const tier = local ? tiers.get(s.id)! : "global";
    const glyphScale = tier === "ambient" ? .73 : 1;
    return [s.id, atlasMobileBodyPx(tier, s.attention, strongest) * 50 / Math.max(1, width) / (.85 * glyphScale)];
  }));
}
export function atlasStackAgeLabel(signals: readonly AtlasMobileSignal[]) {
  const ages = signals.map(s => s.ageHours);
  if (ages.some(age => age === null)) return "Età mista";
  const newest = Math.min(...ages as number[]), oldest = Math.max(...ages as number[]);
  if (oldest < 1) return "<1h";
  if (oldest < 24 && newest >= 1) return `${Math.floor(newest)}–${Math.ceil(oldest)}h`;
  if (oldest < 24) return `<${Math.ceil(oldest)}h`;
  return `${Math.floor(newest / 24)}–${Math.ceil(oldest / 24)}g`;
}

/** Angular-only Local layout. Physically inseparable targets become explicit groups.
 * Replan the group anchors until every remaining interactive object is separated.
 * Tool data, temporal ratios and desktop geometry are never mutated. */
export function planAtlasMobile(signals: readonly AtlasMobileSignal[], width: number): AtlasMobilePlan {
  const sorted = [...signals].sort((a,b) => b.attention - a.attention || a.id.localeCompare(b.id));
  const radii = atlasMobileRadii(sorted, width);
  let groups = sorted.map(s => [s]);
  let positions = new Map<string, RadarPoint2>();
  const key = (group: readonly AtlasMobileSignal[]) => group.length === 1 ? group[0].id : `atlas-stack:${group.map(s => s.id).sort().join("|")}`;
  for (let pass = 0; pass <= sorted.length; pass++) {
    const representatives = groups.map(group => ({ id: key(group), semanticAngle: group[0].semanticAngle, radiusRatio: group.reduce((sum,s) => sum+s.radiusRatio,0)/group.length, radius: ATLAS_MOBILE_HIT_PX * 50 / Math.max(1,width) }));
    const plan = planRadarAtlasConstellation(representatives, { rect: {left:0,top:0,width,height:width}, minGapPx: ATLAS_MOBILE_GAP_PX });
    positions = new Map(plan.nodes.map(n => [n.id,{x:n.displayX,y:n.displayY}]));
    const parents = groups.map((_,i) => i);
    const root = (i: number): number => parents[i] === i ? i : (parents[i] = root(parents[i]));
    for (let i=0;i<groups.length;i++) for(let j=i+1;j<groups.length;j++) {
      const a=positions.get(key(groups[i]))!,b=positions.get(key(groups[j]))!;
      if (Math.hypot(a.x-b.x,a.y-b.y)*width/100 < ATLAS_MOBILE_HIT_PX+ATLAS_MOBILE_GAP_PX-.01) parents[root(j)]=root(i);
    }
    const merged = new Map<number,AtlasMobileSignal[]>();
    groups.forEach((g,i) => merged.set(root(i),[...(merged.get(root(i))??[]),...g]));
    if (merged.size === groups.length) break;
    groups = [...merged.values()];
  }
  const stacks=groups.filter(g=>g.length>1).map(g=>({id:key(g),memberIds:g.map(s=>s.id),...positions.get(key(g))!,ageLabel:atlasStackAgeLabel(g),radiusRatio:g.reduce((sum,s)=>sum+s.radiusRatio,0)/g.length}));
  return {positions,stacks,visibleIds:new Set(groups.filter(g=>g.length===1).map(g=>g[0].id)),radii};
}

/** Micro Focus explicitly opens a temporal group; orbit positions are display-only. */
export function planAtlasMicroFocus(memberIds: readonly string[], page = 0) {
  const visible = memberIds.slice(page*ATLAS_MICRO_PAGE_SIZE,(page+1)*ATLAS_MICRO_PAGE_SIZE);
  return new Map(visible.map((id,i)=>{
    const angle = ((i*360/Math.max(1,visible.length))+22.5)*Math.PI/180;
    return [id,{x:50+29*Math.sin(angle),y:50-29*Math.cos(angle)}];
  }));
}

/** Global remains a territory navigator. Never paint overlapping representative hits. */
export function atlasMobileGlobalIds(points: readonly (RadarPoint2 & {id:string;attention:number;clusterId?:string})[], width:number) {
  const kept: typeof points[number][]=[];
  for(const p of [...points].sort((a,b)=>b.attention-a.attention||a.id.localeCompare(b.id))) {
    if(kept.every(q=>(!p.clusterId || q.clusterId!==p.clusterId) && Math.hypot(p.x-q.x,p.y-q.y)*width/100>=ATLAS_MOBILE_HIT_PX+ATLAS_MOBILE_GAP_PX)) kept.push(p);
  }
  return new Set(kept.map(p=>p.id));
}
