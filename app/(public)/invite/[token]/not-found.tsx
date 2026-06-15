export default function InviteNotFound() {
  return (
    <div className="min-h-screen bg-gradient-wedding flex items-center justify-center p-6 text-center">
      <div className="space-y-4">
        <p className="text-6xl">💔</p>
        <h1 className="text-2xl font-bold text-primary-700" style={{ fontFamily: "'Amiri', serif" }}>
          هذه الدعوة غير موجودة
        </h1>
        <p className="text-muted-foreground max-w-xs">
          يبدو أن الرابط غير صحيح أو انتهت صلاحيته.
          يرجى التواصل مع أصحاب الفرح.
        </p>
      </div>
    </div>
  );
}
