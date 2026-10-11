import { Share } from 'react-native';

export const shareService = {
  shareDonation: async (amount: number): Promise<void> => {
    try {
      await Share.share({
        message: `I just donated $${amount.toFixed(2)} to the Scam Fighter Fund to help eliminate online scammers! 💪\n\nJoin me in protecting vulnerable people from scams.\n\nDonate via Cash App: $JACKSCHITT1134\n\n#ScamFighters #StopScams #MakeADifference`,
        title: 'Fighting Scams Together',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  },

  shareImpact: async (scamsInvestigated: number, peopleProtected: number): Promise<void> => {
    try {
      await Share.share({
        message: `The Scam Fighter Fund has investigated ${scamsInvestigated}+ scams and protected ${peopleProtected.toLocaleString()}+ people! 🛡️\n\nHelp us eliminate online scammers.\n\nDonate: $JACKSCHITT1134\n\n#ScamFighters #OnlineSafety`,
        title: 'Scam Fighter Impact',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  },

  shareMonthlyReport: async (month: string, highlights: string[]): Promise<void> => {
    try {
      const message = `${month} Scam Fighter Impact Report 📊\n\n${highlights.join('\n✓ ')}\n\nJoin the fight against scammers!\nDonate: $JACKSCHITT1134\n\n#ScamFighters`;
      
      await Share.share({
        message,
        title: `${month} Impact Report`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  },
};
