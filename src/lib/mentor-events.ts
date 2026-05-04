export const MENTOR_OPEN_EVENT = "cariva:open-mentor" as const;

export function openMentorPanel() {
  window.dispatchEvent(new CustomEvent(MENTOR_OPEN_EVENT));
}
