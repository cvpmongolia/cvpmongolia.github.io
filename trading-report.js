// ============================================
// TRADING REPORT MODULE
// ============================================
// Independent analytics module for trading journal data
// Fetches data from localStorage and calculates comprehensive metrics

const TradingReport = (() => {
  const JOURNAL_STORAGE_KEY = 'tradingJournalEntries';

  // Utility: Calculate date boundaries
  const getDateBoundaries = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return { today, weekStart, monthStart };
  };

  // Utility: Filter entries by date range
  const filterByDateRange = (entries, startDate) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate;
    });
  };

  // Load journal entries from localStorage
  const loadEntries = () => {
    try {
      const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading journal entries:', error);
      return [];
    }
  };

  // Calculate financial metrics
  const calculateFinancialMetrics = (entries) => {
    // Identify Break-Even trades (Loss + Safe Rule followed = $0 P/L)
    const beTrades = entries.filter(e => 
      e.answers.result === 'Loss' && e.answers.safe_rule === 'Тийм'
    );
    
    // Only process non-BE trades for financial metrics
    const trades = entries.filter(e => {
      // Must have result, reward, and risk
      if (!e.answers.result || !e.answers.reward || !e.answers.risk) return false;
      // Exclude BE trades (they contribute $0 to P/L)
      if (e.answers.result === 'Loss' && e.answers.safe_rule === 'Тийм') return false;
      return true;
    });
    
    let totalPL = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    let largestWin = 0;
    let largestLoss = 0;
    let totalRisk = 0;
    let totalReward = 0;
    let totalRR = 0;
    let rrCount = 0;

    trades.forEach(trade => {
      const risk = parseFloat(trade.answers.risk) || 0;
      const reward = parseFloat(trade.answers.reward) || 0;
      const rr = parseFloat(trade.answers.risk_reward) || 0;
      const isWin = trade.answers.result === 'Win';

      totalRisk += risk;
      totalReward += reward;
      
      if (rr > 0) {
        totalRR += rr;
        rrCount++;
      }

      if (isWin) {
        const winAmount = reward;
        totalPL += winAmount;
        totalWins++;
        totalWinAmount += winAmount;
        if (winAmount > largestWin) largestWin = winAmount;
      } else {
        const lossAmount = risk;
        totalPL -= lossAmount;
        totalLosses++;
        totalLossAmount += lossAmount;
        if (lossAmount > largestLoss) largestLoss = lossAmount;
      }
    });

    // Total trades includes BE trades (they count toward trade count but not P/L)
    const totalTrades = totalWins + totalLosses + beTrades.length;
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    const avgWin = totalWins > 0 ? totalWinAmount / totalWins : 0;
    const avgLoss = totalLosses > 0 ? totalLossAmount / totalLosses : 0;
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? Infinity : 0;
    const avgRR = rrCount > 0 ? totalRR / rrCount : 0;

    return {
      totalPL,
      totalTrades,
      totalWins,
      totalLosses,
      winRate,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      profitFactor,
      avgRR,
      totalRisk,
      totalReward
    };
  };

  // Calculate trade breakdown
  const calculateTradeBreakdown = (entries) => {
    const breakEvenCount = entries.filter(e => 
      e.answers.safe_rule === 'Тийм' && e.answers.result === 'Loss'
    ).length;

    const longTrades = entries.filter(e => e.answers.entry_direction === 'BUY');
    const shortTrades = entries.filter(e => e.answers.entry_direction === 'SELL');

    const longMetrics = calculateFinancialMetrics(longTrades);
    const shortMetrics = calculateFinancialMetrics(shortTrades);

    const safeRuleFollowed = entries.filter(e => e.answers.safe_rule === 'Тийм').length;
    const safeRulePercentage = entries.length > 0 ? (safeRuleFollowed / entries.length) * 100 : 0;

    return {
      breakEvenCount,
      longMetrics,
      shortMetrics,
      safeRuleFollowed,
      safeRulePercentage
    };
  };

  // Calculate session performance
  const calculateSessionPerformance = (entries) => {
    const sessions = ['Asia', 'Europe', 'US'];
    const sessionStats = {};

    sessions.forEach(session => {
      const sessionTrades = entries.filter(e => e.answers.session === session);
      sessionStats[session] = calculateFinancialMetrics(sessionTrades);
    });

    return sessionStats;
  };

  // Calculate setup performance
  const calculateSetupPerformance = (entries) => {
    const setupStats = {};
    const setupCategories = {
      'WPOC Manipulation': [1, 2, 3, 4],
      'Test Manipulation': [5, 6, 7, 8],
      'Manipulation дагаж орох': [9],
      'Блокны гаралт/Zone-оос дагаж орох': [10, 11],
      'Break дагаж орох': [12, 13],
      'Counter-Trend': [14, 15]
    };

    // Per setup stats
    entries.forEach(entry => {
      const setupId = entry.setupId;
      if (!setupStats[setupId]) {
        setupStats[setupId] = {
          setupId,
          setupName: entry.setupName,
          trades: [],
          totalScore: 0,
          avgScore: 0
        };
      }
      setupStats[setupId].trades.push(entry);
      setupStats[setupId].totalScore += entry.score || 0;
    });

    // Calculate metrics for each setup
    Object.values(setupStats).forEach(setup => {
      const metrics = calculateFinancialMetrics(setup.trades);
      setup.avgScore = setup.trades.length > 0 ? setup.totalScore / setup.trades.length : 0;
      Object.assign(setup, metrics);
    });

    // Category stats
    const categoryStats = {};
    Object.entries(setupCategories).forEach(([category, setupIds]) => {
      const categoryTrades = entries.filter(e => setupIds.includes(e.setupId));
      categoryStats[category] = calculateFinancialMetrics(categoryTrades);
      categoryStats[category].tradeCount = categoryTrades.length;
    });

    return {
      perSetup: Object.values(setupStats),
      perCategory: categoryStats
    };
  };

  // Calculate ticker performance
  const calculateTickerPerformance = (entries) => {
    const tickers = ['NQ', 'ES', 'GC', '6E', 'BTC', 'CL'];
    const tickerStats = {};

    tickers.forEach(ticker => {
      const tickerTrades = entries.filter(e => e.answers.ticker === ticker);
      tickerStats[ticker] = calculateFinancialMetrics(tickerTrades);
      tickerStats[ticker].tradeCount = tickerTrades.length;
    });

    return tickerStats;
  };

  // Calculate quality metrics
  const calculateQualityMetrics = (entries) => {
    const avgScore = entries.length > 0 
      ? entries.reduce((sum, e) => sum + (e.score || 0), 0) / entries.length 
      : 0;

    const scoreRanges = {
      excellent: entries.filter(e => (e.score || 0) >= 70).length,
      good: entries.filter(e => (e.score || 0) >= 50 && (e.score || 0) < 70).length,
      average: entries.filter(e => (e.score || 0) >= 30 && (e.score || 0) < 50).length,
      poor: entries.filter(e => (e.score || 0) >= 0 && (e.score || 0) < 30).length,
      negative: entries.filter(e => (e.score || 0) < 0).length
    };

    // Correlation: Score vs Outcome (exclude BE trades for consistency)
    const tradesWithResult = entries.filter(e => {
      if (!e.answers.result || e.score === undefined) return false;
      // Exclude BE trades from correlation (they're neutral $0 outcomes)
      if (e.answers.result === 'Loss' && e.answers.safe_rule === 'Тийм') return false;
      return true;
    });
    const winningTrades = tradesWithResult.filter(e => e.answers.result === 'Win');
    const losingTrades = tradesWithResult.filter(e => e.answers.result === 'Loss');

    const avgScoreWins = winningTrades.length > 0
      ? winningTrades.reduce((sum, e) => sum + e.score, 0) / winningTrades.length
      : 0;
    const avgScoreLosses = losingTrades.length > 0
      ? losingTrades.reduce((sum, e) => sum + e.score, 0) / losingTrades.length
      : 0;

    return {
      avgScore,
      scoreRanges,
      avgScoreWins,
      avgScoreLosses,
      scoreCorrelation: avgScoreWins - avgScoreLosses
    };
  };

  // Calculate streaks
  const calculateStreaks = (entries) => {
    if (entries.length === 0) return { currentStreak: 0, longestWinStreak: 0, longestLossStreak: 0 };

    // Sort by timestamp (oldest first) and exclude BE trades (they don't affect streaks)
    const sorted = [...entries]
      .filter(e => {
        if (!e.answers.result) return false;
        // Exclude BE trades from streak calculation
        if (e.answers.result === 'Loss' && e.answers.safe_rule === 'Тийм') return false;
        return true;
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let currentStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    sorted.forEach((entry, index) => {
      const isWin = entry.answers.result === 'Win';

      if (isWin) {
        tempWinStreak++;
        tempLossStreak = 0;
        if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
      } else {
        tempLossStreak++;
        tempWinStreak = 0;
        if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
      }

      // Current streak (most recent)
      if (index === sorted.length - 1) {
        currentStreak = isWin ? tempWinStreak : -tempLossStreak;
      }
    });

    return { currentStreak, longestWinStreak, longestLossStreak };
  };

  // Calculate risk management metrics
  const calculateRiskMetrics = (entries) => {
    const tradesWithRisk = entries.filter(e => e.answers.risk);
    const avgRisk = tradesWithRisk.length > 0
      ? tradesWithRisk.reduce((sum, e) => sum + parseFloat(e.answers.risk), 0) / tradesWithRisk.length
      : 0;

    // Calculate max drawdown (consecutive losses)
    const sorted = [...entries]
      .filter(e => e.answers.result && e.answers.risk)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let maxDrawdown = 0;
    let currentDrawdown = 0;

    sorted.forEach(entry => {
      if (entry.answers.result === 'Loss') {
        currentDrawdown += parseFloat(entry.answers.risk) || 0;
        if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;
      } else {
        currentDrawdown = 0;
      }
    });

    return {
      avgRisk,
      maxDrawdown
    };
  };

  // Extract common themes from psychology and lessons
  const extractCommonThemes = (entries) => {
    const psychologyNotes = entries
      .filter(e => e.answers.psychology)
      .map(e => e.answers.psychology.toLowerCase());

    const lessonNotes = entries
      .filter(e => e.answers.lesson)
      .map(e => e.answers.lesson.toLowerCase());

    // Simple word frequency analysis (can be enhanced)
    const getTopWords = (notes, limit = 10) => {
      const wordCount = {};
      const commonWords = ['хий', 'гэж', 'эсэх', 'байна', 'болно', 'нь', 'тул', 'дээр', 'руу', 'таа'];
      
      notes.forEach(note => {
        const words = note.split(/\s+/).filter(w => w.length > 2 && !commonWords.includes(w));
        words.forEach(word => {
          wordCount[word] = (wordCount[word] || 0) + 1;
        });
      });

      return Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word, count]) => ({ word, count }));
    };

    return {
      psychologyThemes: getTopWords(psychologyNotes),
      lessonThemes: getTopWords(lessonNotes),
      totalPsychologyNotes: psychologyNotes.length,
      totalLessonNotes: lessonNotes.length
    };
  };

  // Generate comprehensive report
  const generateReport = (dateRange = 'all') => {
    const allEntries = loadEntries();
    
    if (allEntries.length === 0) {
      return {
        error: 'No trading data available',
        isEmpty: true
      };
    }

    const { today, weekStart, monthStart } = getDateBoundaries();
    
    let entries = allEntries;
    let periodLabel = 'Бүх цаг үеэр';

    if (dateRange === 'today') {
      entries = filterByDateRange(allEntries, today);
      periodLabel = 'Өнөөдөр';
    } else if (dateRange === 'week') {
      entries = filterByDateRange(allEntries, weekStart);
      periodLabel = 'Энэ долоо хоног';
    } else if (dateRange === 'month') {
      entries = filterByDateRange(allEntries, monthStart);
      periodLabel = 'Энэ сар';
    }

    // Calculate all metrics
    const financial = calculateFinancialMetrics(entries);
    const breakdown = calculateTradeBreakdown(entries);
    const sessions = calculateSessionPerformance(entries);
    const setups = calculateSetupPerformance(entries);
    const tickers = calculateTickerPerformance(entries);
    const quality = calculateQualityMetrics(entries);
    const streaks = calculateStreaks(entries);
    const risk = calculateRiskMetrics(entries);
    const themes = extractCommonThemes(entries);

    // Find best/worst performers
    const setupsByWinRate = setups.perSetup
      .filter(s => s.totalTrades > 0)
      .sort((a, b) => b.winRate - a.winRate);
    
    const setupsByPL = setups.perSetup
      .filter(s => s.totalTrades > 0)
      .sort((a, b) => b.totalPL - a.totalPL);

    const tickersByWinRate = Object.entries(tickers)
      .filter(([_, stats]) => stats.tradeCount > 0)
      .sort((a, b) => b[1].winRate - a[1].winRate);

    const tickersByPL = Object.entries(tickers)
      .filter(([_, stats]) => stats.tradeCount > 0)
      .sort((a, b) => b[1].totalPL - a[1].totalPL);

    return {
      isEmpty: false,
      period: periodLabel,
      dateRange: {
        start: dateRange === 'all' ? (allEntries.length > 0 ? allEntries[allEntries.length - 1].timestamp : null) : 
               dateRange === 'today' ? today.toISOString() :
               dateRange === 'week' ? weekStart.toISOString() :
               monthStart.toISOString(),
        end: new Date().toISOString()
      },
      totalEntries: entries.length,
      financial,
      breakdown,
      sessions,
      setups,
      tickers,
      quality,
      streaks,
      risk,
      themes,
      rankings: {
        bestSetupByWinRate: setupsByWinRate[0] || null,
        worstSetupByWinRate: setupsByWinRate[setupsByWinRate.length - 1] || null,
        bestSetupByPL: setupsByPL[0] || null,
        worstSetupByPL: setupsByPL[setupsByPL.length - 1] || null,
        bestTickerByWinRate: tickersByWinRate[0] || null,
        worstTickerByWinRate: tickersByWinRate[tickersByWinRate.length - 1] || null,
        bestTickerByPL: tickersByPL[0] || null,
        worstTickerByPL: tickersByPL[tickersByPL.length - 1] || null
      }
    };
  };

  // Public API
  return {
    generateReport,
    loadEntries,
    
    // Expose individual calculators for custom reporting
    calculateFinancialMetrics,
    calculateTradeBreakdown,
    calculateSessionPerformance,
    calculateSetupPerformance,
    calculateTickerPerformance,
    calculateQualityMetrics,
    calculateStreaks,
    calculateRiskMetrics,
    extractCommonThemes
  };
})();

// Make available globally
if (typeof window !== 'undefined') {
  window.TradingReport = TradingReport;
}
