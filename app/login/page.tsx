import { GoogleOneTap } from "@/components/google-one-tap";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="mx-auto max-w-md border-leaf/40 py-12 text-center shadow-glow">
      <div className="hud-corners mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-leaf bg-leaf/10 font-serif text-5xl font-bold text-leaf">λ</div>
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-leaf">Restricted access</p>
      <h1 className="mt-3 font-serif text-5xl font-bold uppercase">Operator login</h1>
      <p className="mt-3 text-sm text-concrete">Chỉ email có trong biến môi trường ADMIN_EMAILS được phép đăng nhập.</p>
      <GoogleOneTap clientId={process.env.GOOGLE_CLIENT_ID ?? ""} />
    </Card>
  );
}
