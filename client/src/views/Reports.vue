<template>
  <div class="reports">
    <div class="page-header">
      <h2>{{ t('reports.title') }}</h2>
      <p>{{ t('reports.description') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!quarterlyData.length && !monthlyData.length" class="no-data">
      {{ t('reports.noData') }}
    </div>
    <div v-else>
      <!-- Quarterly Performance -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('reports.quarterlyPerformance') }}</h3>
        </div>
        <div class="table-container">
          <table class="reports-table">
            <thead>
              <tr>
                <th>{{ t('reports.table.quarter') }}</th>
                <th>{{ t('reports.table.totalOrders') }}</th>
                <th>{{ t('reports.table.totalRevenue') }}</th>
                <th>{{ t('reports.table.avgOrderValue') }}</th>
                <th>{{ t('reports.table.fulfillmentRate') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in quarterlyData" :key="q.quarter">
                <td><strong>{{ q.quarter }}</strong></td>
                <td>{{ q.total_orders.toLocaleString() }}</td>
                <td>{{ formatMoney(q.total_revenue) }}</td>
                <td>{{ formatMoney(q.avg_order_value) }}</td>
                <td>
                  <span :class="getFulfillmentClass(q.fulfillment_rate)">
                    {{ q.fulfillment_rate }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Monthly Trends Chart -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('reports.monthlyRevenueTrend') }}</h3>
        </div>
        <div class="chart-container">
          <div class="bar-chart">
            <div v-for="month in monthlyData" :key="month.month" class="bar-wrapper">
              <div class="bar-container">
                <div
                  class="bar"
                  :style="{ height: getBarHeight(month.revenue) + 'px' }"
                  :title="formatMoney(month.revenue)"
                ></div>
              </div>
              <div class="bar-label">{{ formatMonth(month.month) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Month-over-Month Comparison -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('reports.monthOverMonth') }}</h3>
        </div>
        <div class="table-container">
          <table class="reports-table">
            <thead>
              <tr>
                <th>{{ t('reports.table.month') }}</th>
                <th>{{ t('reports.table.orders') }}</th>
                <th>{{ t('reports.table.revenue') }}</th>
                <th>{{ t('reports.table.change') }}</th>
                <th>{{ t('reports.table.growthRate') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(month, index) in monthlyData" :key="month.month">
                <td><strong>{{ formatMonth(month.month) }}</strong></td>
                <td>{{ month.order_count.toLocaleString() }}</td>
                <td>{{ formatMoney(month.revenue) }}</td>
                <td>
                  <span v-if="index > 0" :class="getChangeClass(month.revenue, monthlyData[index - 1].revenue)">
                    {{ getChangeValue(month.revenue, monthlyData[index - 1].revenue) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td>
                  <span v-if="index > 0" :class="getChangeClass(month.revenue, monthlyData[index - 1].revenue)">
                    {{ getGrowthRate(month.revenue, monthlyData[index - 1].revenue) }}
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="card-grid">
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.stats.totalRevenueYTD') }}</div>
          <div class="stat-value">{{ formatMoney(totalRevenue) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.stats.avgMonthlyRevenue') }}</div>
          <div class="stat-value">{{ formatMoney(avgMonthlyRevenue) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.stats.totalOrdersYTD') }}</div>
          <div class="stat-value">{{ totalOrders.toLocaleString() }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.stats.bestQuarter') }}</div>
          <div class="stat-value">{{ bestQuarter }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../api'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'
import { formatCurrency } from '../utils/currency'

export default {
  name: 'Reports',
  setup() {
    const { t, currentCurrency, currentLocale } = useI18n()
    const loading = ref(true)
    const error = ref(null)
    const quarterlyData = ref([])
    const monthlyData = ref([])

    // Use shared filters
    const {
      selectedPeriod,
      selectedLocation,
      selectedCategory,
      selectedStatus,
      getCurrentFilters
    } = useFilters()

    const loadData = async () => {
      try {
        loading.value = true
        error.value = null
        const filters = getCurrentFilters()
        const [quarterly, monthly] = await Promise.all([
          api.getQuarterlyReports(filters),
          api.getMonthlyTrends(filters)
        ])
        quarterlyData.value = quarterly
        monthlyData.value = monthly
      } catch (err) {
        error.value = 'Failed to load reports: ' + err.message
      } finally {
        loading.value = false
      }
    }

    // Summary stats derived from loaded data
    const totalRevenue = computed(() =>
      monthlyData.value.reduce((sum, m) => sum + m.revenue, 0)
    )
    const avgMonthlyRevenue = computed(() =>
      monthlyData.value.length ? totalRevenue.value / monthlyData.value.length : 0
    )
    const totalOrders = computed(() =>
      monthlyData.value.reduce((sum, m) => sum + m.order_count, 0)
    )
    const bestQuarter = computed(() => {
      let best = ''
      let bestRevenue = -Infinity
      quarterlyData.value.forEach(q => {
        if (q.total_revenue > bestRevenue) {
          bestRevenue = q.total_revenue
          best = q.quarter
        }
      })
      return best || '-'
    })

    // Chart helper: compute the max once instead of per-bar
    const maxMonthlyRevenue = computed(() => {
      if (!monthlyData.value.length) return 0
      return Math.max(...monthlyData.value.map(m => m.revenue))
    })
    const getBarHeight = (revenue) => {
      if (maxMonthlyRevenue.value === 0) return 0
      return (revenue / maxMonthlyRevenue.value) * 200
    }

    // Locale + currency aware formatting
    const formatMoney = (amount) => formatCurrency(amount, currentCurrency.value)

    const formatMonth = (monthStr) => {
      if (!monthStr) return ''
      const parts = monthStr.split('-')
      const year = parseInt(parts[0], 10)
      const monthIndex = parseInt(parts[1], 10) - 1
      if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        return monthStr
      }
      const locale = currentLocale.value === 'ja' ? 'ja-JP' : 'en-US'
      return new Date(year, monthIndex, 1).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short'
      })
    }

    const getFulfillmentClass = (rate) => {
      if (rate >= 90) return 'badge success'
      if (rate >= 75) return 'badge warning'
      return 'badge danger'
    }

    const getChangeValue = (current, previous) => {
      const change = current - previous
      const sign = change > 0 ? '+' : change < 0 ? '-' : ''
      return sign + formatMoney(Math.abs(change))
    }

    const getChangeClass = (current, previous) => {
      const change = current - previous
      if (change > 0) return 'positive-change'
      if (change < 0) return 'negative-change'
      return ''
    }

    const getGrowthRate = (current, previous) => {
      if (previous === 0) return t('reports.na')
      const rate = ((current - previous) / previous) * 100
      const sign = rate > 0 ? '+' : ''
      return sign + rate.toFixed(1) + '%'
    }

    // Reload when any global filter changes
    watch([selectedPeriod, selectedLocation, selectedCategory, selectedStatus], () => {
      loadData()
    })

    onMounted(loadData)

    return {
      t,
      loading,
      error,
      quarterlyData,
      monthlyData,
      totalRevenue,
      avgMonthlyRevenue,
      totalOrders,
      bestQuarter,
      getBarHeight,
      formatMoney,
      formatMonth,
      getFulfillmentClass,
      getChangeValue,
      getChangeClass,
      getGrowthRate
    }
  }
}
</script>

<style scoped>
.reports {
  padding: 0;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table th {
  background: #f8fafc;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
}

.reports-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.reports-table tr:hover {
  background: #f8fafc;
}

.chart-container {
  padding: 2rem 1rem;
  min-height: 300px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 250px;
  gap: 0.5rem;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
}

.bar-container {
  height: 200px;
  display: flex;
  align-items: flex-end;
  width: 100%;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
  cursor: pointer;
}

.bar:hover {
  background: linear-gradient(to top, #2563eb, #3b82f6);
}

.bar-label {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  transform: rotate(-45deg);
  white-space: nowrap;
  margin-top: 1.5rem;
}

.positive-change {
  color: #16a34a;
  font-weight: 600;
}

.negative-change {
  color: #dc2626;
  font-weight: 600;
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
}
</style>
