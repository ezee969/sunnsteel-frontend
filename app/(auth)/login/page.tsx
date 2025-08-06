import type { Metadata } from 'next';
import { LoginHeader } from './components/LoginHeader';
import { LoginForm } from './components/LoginForm';

export const metadata: Metadata = {
  title: 'Sunnsteel - Login',
  description: 'Login to your fitness journey',
};

export default function LoginPage() {
  return (
    <div className="animate-fade-in">
      <LoginHeader />
      <LoginForm />
    </div>
  );
}
