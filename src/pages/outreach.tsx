import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function OutreachPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/ops?tab=outreach');
  }, [router]);

  return null;
}
