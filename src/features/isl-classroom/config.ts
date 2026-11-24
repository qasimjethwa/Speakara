/** Kill switch: set NEXT_PUBLIC_ISL_CLASSROOM=off to hide the classroom. Nothing else in Speakara depends on it. */
export const ISL_CLASSROOM_ENABLED = process.env.NEXT_PUBLIC_ISL_CLASSROOM !== "off";
