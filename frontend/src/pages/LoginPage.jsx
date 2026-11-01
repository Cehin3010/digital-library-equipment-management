import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, LoaderCircle, MailCheck, ShieldCheck } from 'lucide-react';
import { requestLoginOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';

function getRoleName(user) {
  return user?.role?.role_name || user?.role_name || user?.role || '';
}

function getHomeForRole(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'LIBRARIAN') return '/librarian/circulation';
  return '/catalog';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [hasSessionAtMount] = useState(isAuthenticated);
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (hasSessionAtMount) navigate(getHomeForRole(getRoleName(user)), { replace: true });
  }, [hasSessionAtMount, navigate, user]);

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((remaining) => Math.max(remaining - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsLeft]);

  const requestCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setRequestingCode(true);
    setError('');
    setNotice('');
    setStep('otp');
    setOtp('');
    setSecondsLeft(0);
    setNotice('Đang yêu cầu gửi mã OTP...');
    try {
      await requestLoginOtp(email.trim().toLowerCase());
      setSecondsLeft(60);
      setNotice('Mã OTP đã được gửi. Hãy kiểm tra hộp thư Mailpit.');
    } catch (requestError) {
      if (requestError.status === 429) {
        setSecondsLeft(requestError.errors?.resend_after_seconds || 0);
        setNotice('Hệ thống đã nhận yêu cầu gửi mã trước đó. Hãy kiểm tra Mailpit; bạn có thể gửi lại khi hết thời gian chờ.');
        return;
      }
      if (requestError.code === 'ECONNABORTED' || requestError.code === 'ETIMEDOUT') {
        setSecondsLeft(0);
        setNotice('Máy chủ chưa kịp xác nhận yêu cầu, nhưng mã có thể đã được gửi. Hãy kiểm tra Mailpit trước; nếu chưa thấy, bạn có thể gửi lại mã.');
        return;
      }
      if (requestError.status) {
        setStep('email');
        setNotice('');
      } else {
        setNotice('Chưa nhận được xác nhận từ máy chủ. Hãy kiểm tra Mailpit trước khi gửi lại mã.');
        return;
      }
      setError(requestError.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setRequestingCode(false);
      setBusy(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const user = await login({ email: email.trim().toLowerCase(), otp });
      navigate(getHomeForRole(getRoleName(user)), { replace: true });
    } catch (requestError) {
      setNotice('');
      setError(requestError.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await requestLoginOtp(email.trim().toLowerCase());
      setOtp('');
      setSecondsLeft(60);
      setNotice('Mã OTP mới đã được gửi. Hãy kiểm tra hộp thư Mailpit.');
    } catch (requestError) {
      if (requestError.status === 429) {
        setSecondsLeft(requestError.errors?.resend_after_seconds || 0);
        setNotice('Mã OTP trước đó đã được gửi. Hãy kiểm tra Mailpit và chờ hết thời gian để gửi lại.');
        return;
      }
      if (requestError.code === 'ECONNABORTED' || requestError.code === 'ETIMEDOUT') {
        setNotice('Máy chủ chưa kịp xác nhận yêu cầu. Hãy kiểm tra Mailpit trước khi thử gửi lại.');
        return;
      }
      setError(requestError.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="bg-slate-950 px-7 py-8 text-white">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Thư viện Đại học</p>
          <h1 className="mt-2 text-2xl font-extrabold">Đăng nhập tài khoản</h1>
          <p className="mt-2 text-sm text-slate-300">Xác thực bằng mã dùng một lần gửi đến email trường.</p>
        </div>

        <div className="space-y-5 p-7">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${step === 'email' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>1</span>
            <span className={step === 'email' ? 'text-slate-900' : 'text-slate-400'}>Email trường</span>
            <span className="h-px flex-1 bg-slate-200" />
            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${step === 'otp' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
            <span className={step === 'otp' ? 'text-slate-900' : 'text-slate-400'}>Mã OTP</span>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              {notice}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={requestCode} className="space-y-4">
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700">
                Email trường
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="MSSV@student.tdtu.edu.vn"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm font-normal outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <p className="text-xs leading-relaxed text-slate-500">Dùng email @student.tdtu.edu.vn hoặc @tdtu.edu.vn. Mã xác thực có hiệu lực trong 5 phút; hãy kiểm tra cả thư mục thư rác nếu chưa thấy email.</p>
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                {busy ? 'Đang gửi mã...' : 'Gửi mã OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                Mã xác thực đã được gửi đến <strong className="text-slate-900">{email}</strong>.
              </div>
              <label htmlFor="login-otp" className="block text-sm font-semibold text-slate-700">
                Mã OTP gồm 6 chữ số
                <input
                  id="login-otp"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-center font-mono text-2xl font-bold tracking-[0.5em] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setStep('email'); setError(''); setNotice(''); }} className="flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800">
                  <ArrowLeft className="h-3.5 w-3.5" /> Đổi email
                </button>
                <button type="button" disabled={busy || secondsLeft > 0} onClick={resendCode} className="font-semibold text-emerald-700 hover:text-emerald-900 disabled:text-slate-400">
                  {secondsLeft > 0 ? `Gửi lại sau ${secondsLeft}s` : 'Gửi lại mã OTP'}
                </button>
              </div>
              <button disabled={busy || otp.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {requestingCode ? 'Đang gửi mã...' : busy ? 'Đang xác thực...' : 'Xác thực và đăng nhập'}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

          <p className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            Đang xem thử giao diện? <Link to="/" className="font-semibold text-emerald-700 hover:underline">Quay lại danh mục</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
