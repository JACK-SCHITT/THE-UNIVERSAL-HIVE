import { useState, useEffect } from 'react';
import { paymentService, PaymentRecord, PaymentResult } from '@/services/paymentService';

export function usePayment() {
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const loadedHistory = paymentService.getPaymentHistory();
    setHistory(loadedHistory);
  };

  const processDonation = async (donationAmount: number, donorName?: string): Promise<PaymentResult> => {
    setIsProcessing(true);
    try {
      const result = await paymentService.processDonation(donationAmount, donorName);
      loadHistory();
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearHistory = () => {
    paymentService.clearHistory();
    setHistory([]);
  };

  return {
    amount,
    setAmount,
    isProcessing,
    history,
    processDonation,
    clearHistory,
  };
}
