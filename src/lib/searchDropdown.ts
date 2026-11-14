/**
 * Shared look & behaviour for every search-suggestions dropdown (SmartSearch, GlobalDrugSearchBar, any future search).
 *
 *  - z-50 + absolute: floats above neighbouring sections/cards.
 *  - max-height follows the viewport and the list scrolls inside itself (overscroll-contain keeps the page from moving).
 *  - Never put overflow-hidden on the container that holds a search — clip decorative layers in their own wrapper
 *    (see DESIGN.md rule 8). Add width/alignment classes at the call site (e.g. "inset-x-0", "w-full", "right-0 w-72").
 */
export const SEARCH_DROPDOWN =
  "absolute z-50 mt-2 max-h-[min(26rem,calc(100dvh-8rem))] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900";
