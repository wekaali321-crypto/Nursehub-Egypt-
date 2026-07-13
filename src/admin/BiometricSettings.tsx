import { useEffect, useState } from "react";
import { useAuth } from "../lib/theme";
import { useToast } from "../components/Toast";
import {
  registerBiometric,
  authenticateBiometric,
  hasBiometricCapability,
  isWebAuthnSupported,
} from "../lib/webauthn";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";

interface Device { id: string; name: string; lastUsed: string }

export function BiometricSettings() {
  const { loggedIn } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [supported, setSupported] = useState(false);
  const [capable, setCapable] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(isWebAuthnSupported());
    hasBiometricCapability().then(setCapable);
    // Load registered devices from localStorage as fallback
    try {
      const stored = localStorage.getItem("nursehub_biometric_devices");
      if (stored) setDevices(JSON.parse(stored));
    } catch {}
  }, []);

  const saveDevices = (list: Device[]) => {
    setDevices(list);
    localStorage.setItem("nursehub_biometric_devices", JSON.stringify(list));
  };

  const register = async () => {
    if (!name.trim()) return notify("أدخل اسم الجهاز", "error");
    setBusy(true);
    try {
      const result = await registerBiometric(name);
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      saveDevices([{ id: result.credentialId.slice(0, 16), name, lastUsed: now }, ...devices]);
      notify("تم تسجيل الجهاز بنجاح", "success");
      setName("");
    } catch (e) {
      notify("فشل التسجيل — تأكد من دعم جهازك للبيومترية", "error");
    }
    setBusy(false);
  };

  const testAuth = async () => {
    setBusy(true);
    try {
      await authenticateBiometric();
      notify("تم التحقق من الهوية بنجاح ✅", "success");
    } catch {
      notify("فشل التحقق", "error");
    }
    setBusy(false);
  };

  const remove = (id: string) => {
    saveDevices(devices.filter((d) => d.id !== id));
    notify("تم حذف الجهاز", "info");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black dark:text-white">🔐 المصادقة البيومترية</h2>

      {!supported && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-600 dark:bg-amber-500/10">
          المتصفح لا يدعم WebAuthn. استخدم Chrome/Safari/Edge المحدث.
        </div>
      )}
      {!capable && supported && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-600 dark:bg-amber-500/10">
          جهازك لا يدعم المصادقة البيومترية (بصمة/وجه). يمكنك استخدام Security Key بديل.
        </div>
      )}

      {supported && capable && loggedIn && (
        <>
          <div className={card}>
            <h3 className="mb-3 font-bold dark:text-white">تسجيل جهاز جديد</h3>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: iPhone 15 الخاص بي"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                onClick={register}
                disabled={busy || !name.trim()}
                className="rounded-lg bg-sky-500 px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                تسجيل
              </button>
            </div>
          </div>

          <div className={card}>
            <h3 className="mb-3 font-bold dark:text-white">اختبار المصادقة</h3>
            <button
              onClick={testAuth}
              disabled={busy}
              className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              🔍 تحقق بيومتري
            </button>
          </div>

          <div className={card}>
            <h3 className="mb-3 font-bold dark:text-white">الأجهزة المسجّلة ({devices.length})</h3>
            {devices.length === 0 ? (
              <p className="text-sm text-slate-400">لم تسجّل أي جهاز بعد.</p>
            ) : (
              <div className="space-y-2">
                {devices.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    <div>
                      <div className="font-semibold dark:text-white">{d.name}</div>
                      <div className="text-xs text-slate-400">آخر استخدام: {d.lastUsed}</div>
                    </div>
                    <button onClick={() => remove(d.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
