const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// 获取总体统计
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 获取交易统计
    const transactionStats = await Transaction.getUserStats(
      req.user._id,
      startDate,
      endDate
    );

    // 获取预算统计
    const budgetStats = await Budget.getUserBudgetStats(req.user._id);

    // 获取月度趋势
    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'active',
          transactionDate: {
            $gte: new Date(new Date().getFullYear(), 0, 1), // 今年开始
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
            type: '$type'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$totalAmount', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$totalAmount', 0]
            }
          },
          transactionCount: { $sum: '$count' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 获取分类支出排名
    const categoryRanking = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'active',
          type: 'expense',
          transactionDate: {
            $gte: startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1),
            $lte: endDate ? new Date(endDate) : new Date()
          }
        }
      },
      {
        $group: {
          _id: '$categoryId',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryName: '$category.name',
          categoryIcon: '$category.icon',
          categoryColor: '$category.color',
          totalAmount: 1,
          count: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        transactionStats,
        budgetStats,
        monthlyTrends,
        categoryRanking
      }
    });

  } catch (error) {
    console.error('获取总体统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

// 获取月度报告
router.get('/monthly-report', async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // 本月统计
    const currentMonthStats = await Transaction.getUserStats(
      req.user._id,
      startDate,
      endDate
    );

    // 上月统计（用于对比）
    const prevMonthStart = new Date(targetYear, targetMonth - 2, 1);
    const prevMonthEnd = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59);
    const prevMonthStats = await Transaction.getUserStats(
      req.user._id,
      prevMonthStart,
      prevMonthEnd
    );

    // 分类详细统计
    const categoryStats = await Transaction.getCategoryStats(
      req.user._id,
      startDate,
      endDate
    );

    // 预算执行情况
    const budgetStats = await Budget.getUserBudgetStats(req.user._id, endDate);

    // 计算变化率
    const incomeChange = prevMonthStats.totalIncome > 0 ?
      ((currentMonthStats.totalIncome - prevMonthStats.totalIncome) / prevMonthStats.totalIncome * 100) : 0;
    
    const expenseChange = prevMonthStats.totalExpense > 0 ?
      ((currentMonthStats.totalExpense - prevMonthStats.totalExpense) / prevMonthStats.totalExpense * 100) : 0;

    res.json({
      success: true,
      data: {
        period: {
          year: targetYear,
          month: targetMonth,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        currentMonth: currentMonthStats,
        previousMonth: prevMonthStats,
        changes: {
          income: incomeChange,
          expense: expenseChange,
          netIncome: currentMonthStats.netIncome - prevMonthStats.netIncome
        },
        categoryStats,
        budgetStats
      }
    });

  } catch (error) {
    console.error('获取月度报告错误:', error);
    res.status(500).json({
      success: false,
      message: '生成月度报告失败'
    });
  }
});

// 获取消费习惯分析
router.get('/spending-habits', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // 按支付方式统计
    const paymentMethodStats = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'active',
          type: 'expense',
          transactionDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // 按时间段统计（工作日 vs 周末）
    const timePatternStats = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          status: 'active',
          type: 'expense',
          transactionDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          amount: 1,
          isWeekend: {
            $in: [{ $dayOfWeek: '$transactionDate' }, [1, 7]] // 1=周日, 7=周六
          },
          hour: { $hour: '$transactionDate' },
          timeOfDay: {
            $switch: {
              branches: [
                { case: { $lt: [{ $hour: '$transactionDate' }, 6] }, then: '深夜' },
                { case: { $lt: [{ $hour: '$transactionDate' }, 12] }, then: '上午' },
                { case: { $lt: [{ $hour: '$transactionDate' }, 18] }, then: '下午' },
                { case: { $lt: [{ $hour: '$transactionDate' }, 24] }, then: '晚上' }
              ],
              default: '未知'
            }
          }
        }
      },
      {
        $group: {
          _id: {
            isWeekend: '$isWeekend',
            timeOfDay: '$timeOfDay'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.isWeekend': 1, '_id.timeOfDay': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period: {
          months: parseInt(months),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        paymentMethodStats,
        timePatternStats
      }
    });

  } catch (error) {
    console.error('获取消费习惯分析错误:', error);
    res.status(500).json({
      success: false,
      message: '分析消费习惯失败'
    });
  }
});

module.exports = router;