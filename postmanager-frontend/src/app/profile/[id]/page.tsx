'use client';
import Profile from '../Profile';
import { useParams } from 'next/navigation';

export default function ProfileByIdPage() {
  const params = useParams();
  const userId = Number(params.id);
  return <Profile userId={userId} />;
} 