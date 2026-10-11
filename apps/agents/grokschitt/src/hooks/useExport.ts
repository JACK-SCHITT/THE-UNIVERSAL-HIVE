import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useExport() {
  
  const exportChatAsPDF = async (conversationId: string) => {
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*, messages(*)')
        .eq('id', conversationId)
        .single();

      if (!conversation) throw new Error('Conversation not found');

      // Create text content for PDF
      let content = `GROK-MAX Conversation\nTitle: ${conversation.title}\n\n`;
      conversation.messages.forEach((msg: any) => {
        content += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
      });

      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grokmax-chat-${Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Chat exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export chat');
    }
  };

  const exportChatAsMarkdown = async (conversationId: string) => {
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*, messages(*)')
        .eq('id', conversationId)
        .single();

      if (!conversation) throw new Error('Conversation not found');

      let markdown = `# GROK-MAX Conversation\n\n**Title:** ${conversation.title}\n\n---\n\n`;
      conversation.messages.forEach((msg: any) => {
        markdown += `### ${msg.role === 'user' ? '👤 User' : '🤖 GROK-MAX'}\n\n${msg.content}\n\n---\n\n`;
      });

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grokmax-chat-${Date.now()}.md`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Chat exported as Markdown!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export chat');
    }
  };

  const exportTransactionsCSV = async () => {
    try {
      const { data: transactions } = await supabase
        .from('fraud_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!transactions || transactions.length === 0) {
        toast.info('No transactions to export');
        return;
      }

      // Create CSV content
      const headers = ['Date', 'Amount', 'Decision', 'Risk Level', 'Reason', 'Trust Score Before', 'Trust Score After'];
      const rows = transactions.map(tx => [
        new Date(tx.created_at).toLocaleString(),
        tx.amount,
        tx.decision,
        tx.deviation > 3.5 ? 'HIGH' : tx.deviation > 2.0 ? 'MEDIUM' : 'LOW',
        tx.reason,
        tx.trust_score_before,
        tx.trust_score_after
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fraud-transactions-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Transactions exported as CSV!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export transactions');
    }
  };

  return {
    exportChatAsPDF,
    exportChatAsMarkdown,
    exportTransactionsCSV
  };
}
