import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, Lock, Phone } from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';
import { SITE_CONFIG } from '../config/site';

type Step = 'request' | 'verify' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (step === 'request') return phone.trim().length >= 10;
    if (step === 'verify') return otp.trim().length === 6;
    if (step === 'reset') return newPassword.length >= 8;
    return false;
  }, [loading, step, phone, otp, newPassword]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (step === 'request') {
        const res = await fetch(apiUrl('/api/auth/password-reset/request'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ phone: phone.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || 'No se pudo enviar el código.');
        }
        if (data?.debugOtp) setDebugOtp(String(data.debugOtp));
        setStep('verify');
        return;
      }

      if (step === 'verify') {
        const res = await fetch(apiUrl('/api/auth/password-reset/verify'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || 'Código inválido.');
        }
        if (!data?.resetToken) throw new Error('Respuesta inválida.');
        setResetToken(String(data.resetToken));
        setStep('reset');
        return;
      }

      if (step === 'reset') {
        const res = await fetch(apiUrl('/api/auth/password-reset/confirm'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ resetToken, newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || 'No se pudo actualizar la contraseña.');
        }
        setStep('done');
        window.setTimeout(() => navigate('/login', { replace: true }), 1400);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link to="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a login
          </Link>
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="DameCódigo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-gray-900 ml-3">{SITE_CONFIG.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
          <p className="text-sm text-gray-600 mt-1">Verificación en 2 pasos por SMS</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          {error ? (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {debugOtp ? (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900">
              <strong>Debug OTP:</strong> {debugOtp} (solo dev / sin Twilio keys)
            </div>
          ) : null}

          {step === 'done' ? (
            <div className="text-center py-6">
              <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-2" aria-hidden />
              <p className="font-semibold text-gray-900">Contraseña actualizada</p>
              <p className="text-sm text-gray-600 mt-1">Redirigiendo a login…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp / Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={step !== 'request'}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="5215512345678"
                  />
                </div>
              </div>

              {step !== 'request' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código SMS (6 dígitos)</label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={step !== 'verify'}
                    inputMode="numeric"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="123456"
                  />
                </div>
              ) : null}

              {step === 'reset' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type="password"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Min 8, mayúscula, minúscula y número"
                    />
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                <span className={loading ? 'ml-2' : ''}>
                  {step === 'request' ? 'Enviar código' : step === 'verify' ? 'Verificar código' : 'Actualizar contraseña'}
                </span>
              </button>

              {step === 'verify' ? (
                <button
                  type="button"
                  className="w-full text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setStep('request');
                    setOtp('');
                    setError(null);
                  }}
                >
                  Volver y reenviar código
                </button>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

