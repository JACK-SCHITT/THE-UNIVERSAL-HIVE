export interface MonthlyReport {
  month: string;
  year: number;
  totalDonations: number;
  donorCount: number;
  scamsInvestigated: number;
  moneySaved: number;
  peopleProtected: number;
  takedowns: number;
  highlights: string[];
}

const STORAGE_KEY = 'scamfighter_reports';

export const reportService = {
  getCurrentMonthReport: (): MonthlyReport => {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    
    // Get donation stats from payment history
    const donationHistory = JSON.parse(localStorage.getItem('scamfighter_donation_history') || '[]');
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthDonations = donationHistory.filter((d: any) => d.timestamp >= monthStart);
    
    const totalDonations = monthDonations.reduce((sum: number, d: any) => sum + d.amount, 0);
    
    // Simulated impact metrics based on donations
    const scamsInvestigated = Math.floor(totalDonations / 10) + 15;
    const moneySaved = totalDonations * 50;
    const peopleProtected = scamsInvestigated * 12;
    const takedowns = Math.floor(scamsInvestigated / 8);
    
    return {
      month: monthName,
      year: now.getFullYear(),
      totalDonations,
      donorCount: new Set(monthDonations.map((d: any) => d.id)).size,
      scamsInvestigated,
      moneySaved,
      peopleProtected,
      takedowns,
      highlights: [
        `Shut down ${takedowns} major scam operations`,
        `Prevented $${moneySaved.toLocaleString()} in potential losses`,
        `Protected ${peopleProtected} vulnerable individuals`,
        `Investigated ${scamsInvestigated} reported scam cases`,
      ],
    };
  },

  getAllReports: (): MonthlyReport[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const reports = stored ? JSON.parse(stored) : [];
      
      // Always include current month
      const current = reportService.getCurrentMonthReport();
      const existing = reports.find((r: MonthlyReport) => 
        r.month === current.month && r.year === current.year
      );
      
      if (!existing) {
        reports.unshift(current);
        reportService.saveReports(reports);
      }
      
      return reports;
    } catch {
      return [reportService.getCurrentMonthReport()];
    }
  },

  saveReports: (reports: MonthlyReport[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save reports:', error);
    }
  },
};
