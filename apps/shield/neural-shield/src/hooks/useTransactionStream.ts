import { useState, useEffect, useCallback, useRef } from "react";
import { Transaction } from "@/types";
import { generateTransaction, generateInitialTransactions } from "@/lib/mockData";
import { persistTransaction, fetchRecentTransactions } from "@/lib/api";

const MAX_BUFFER = 200;

export function useTransactionStream(autoPlay = true) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => generateInitialTransactions(40));
  const [isLive, setIsLive] = useState(autoPlay);
  const [tps, setTps] = useState(0);
  const countRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate from Supabase on mount
  useEffect(() => {
    fetchRecentTransactions(40).then(dbTxns => {
      if (dbTxns.length > 0) {
        console.log(`[stream] hydrated ${dbTxns.length} transactions from Supabase`);
        setTransactions(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newOnes = dbTxns.filter(t => !existingIds.has(t.id));
          return [...newOnes, ...prev].slice(0, MAX_BUFFER);
        });
      }
    });
  }, []);

  const addTransaction = useCallback(() => {
    const tx = generateTransaction();
    countRef.current += 1;
    setTransactions(prev => [tx, ...prev].slice(0, MAX_BUFFER));
    // Persist to Supabase (fire-and-forget)
    persistTransaction(tx);
  }, []);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(addTransaction, 2800 + Math.random() * 800);
      tpsIntervalRef.current = setInterval(() => {
        setTps(countRef.current);
        countRef.current = 0;
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tpsIntervalRef.current) clearInterval(tpsIntervalRef.current);
    };
  }, [isLive, addTransaction]);

  const toggleLive = () => setIsLive(v => !v);
  const refresh = () => setTransactions(generateInitialTransactions(40));

  return { transactions, isLive, toggleLive, refresh, tps };
}
