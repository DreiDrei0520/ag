import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { restorePendingQuotation } from '../../lib/pendingQuotation';

export default function PendingQuotationRestore() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const attempted = useRef(false);

  useEffect(() => {
    if (!user || attempted.current) return;
    attempted.current = true;
    void restorePendingQuotation(user)
      .then((saved) => {
        if (saved) {
          toast.success('Your pending quotation was saved to your account.');
          navigate(`/client/quotations/${saved.id}`);
        }
      })
      .catch(() => toast.error('Unable to restore your pending quotation.'));
  }, [user, navigate]);

  return null;
}
