import { UpdatePasswordForm } from './UpdatePasswordForm';

export default function UpdatePasswordPage() {
  return (
    <section className="login-screen">
      <div className="login-card">
        <img className="login-logo" src="/trip-hub-icon.svg" alt="" width="72" height="72" />
        <div className="login-heading"><h1>New password</h1><p>Choose the password you’ll both use for Trip Hub.</p></div>
        <UpdatePasswordForm />
      </div>
    </section>
  );
}
