import { redirect } from "next/navigation";

// The 3D reference avatar was retired: it only animated the arms (hands stayed
// in a claw-like bind pose), so it could never show ASL handshape. The "How
// it's signed" reference is now the real signer video on /practice and /lesson.
export default function AvatarPage() {
  redirect("/practice");
}
