import type { Metadata } from 'next';
import { SignupHeader } from './components/SignupHeader';
import { SignupForm } from './components/SignupForm';

export const metadata: Metadata = {
  title: 'Sunnsteel - Sign Up',
  description: 'Join Sunnsteel and begin your fitness journey',
};

export default function SignupPage() {
  return (
    <div className="animate-fade-in">
      <SignupHeader />
      <SignupForm />
    </div>
  );
}
