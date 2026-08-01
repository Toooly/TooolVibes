import {
  ToolDetailFinalPage,
  generateMetadata,
  generateStaticParams,
} from "@/components/tool-detail-final/tool-detail-final-page";

/**
 * Tool Detail — Clean baseline route.
 *
 * Thin re-export to the new owner tree.
 * No legacy class names, no Archive card markup.
 */

export const dynamic = "force-static";

export { generateMetadata, generateStaticParams };

export default ToolDetailFinalPage;
