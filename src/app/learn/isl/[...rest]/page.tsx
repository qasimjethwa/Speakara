import { redirect } from "next/navigation";
/** Old ISL course, scenario and practice URLs now open the live classroom. */
export default function OldIslRoute() { redirect("/learn/isl"); }
