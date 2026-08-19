import { GoogleOneTap } from "@/components/google-one-tap";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="mx-auto max-w-md py-12 text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-leaf">Admin only</p>
      <h1 className="mt-3 font-serif text-4xl font-black">Đăng nhập quản trị</h1>
      <p className="mt-3 text-ink/60">Chỉ email có trong biến môi trường ADMIN_EMAILS được phép đăng nhập.</p>
      <GoogleOneTap clientId={process.env.GOOGLE_CLIENT_ID ?? ""} />
    </Card>
  );
}
