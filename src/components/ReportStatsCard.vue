<template>
  <div class="stats-card-wrapper" v-if="stats">
    <div class="card-header">
      <div class="title-block">
        <h2 class="title">📊 Итоги отчета</h2>
        <p class="subtitle" v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="badge" :class="trendClass">
        <span v-if="netImpact > 0">▲</span>
        <span v-else-if="netImpact < 0">▼</span>
        <span v-else>○</span>
        {{ netImpactLabel }}
      </div>
    </div>

    <div class="kpis">
      <div class="kpi total">
        <div class="kpi-label">Всего новостей</div>
        <div class="kpi-value">{{ stats.totalNews }}</div>
      </div>
      <div class="kpi positive" :class="{ faded: stats.positiveNewsCount === 0 }">
        <div class="kpi-label">Позитив</div>
        <div class="kpi-value">
          <span>{{ stats.positiveNewsCount }}</span>
          <small v-if="stats.positiveNewsCount">+{{ stats.averageGrowth.toFixed(1) }}%</small>
        </div>
      </div>
      <div class="kpi negative" :class="{ faded: stats.negativeNewsCount === 0 }">
        <div class="kpi-label">Негатив</div>
        <div class="kpi-value">
          <span>{{ stats.negativeNewsCount }}</span>
          <small v-if="stats.negativeNewsCount">-{{ stats.averageDecline.toFixed(1) }}%</small>
        </div>
      </div>
      <div class="kpi ratio">
        <div class="kpi-label">Соотношение</div>
        <div class="kpi-value">
          <span v-if="stats.positiveNewsCount + stats.negativeNewsCount > 0">
            {{ ratioLabel }}
          </span>
          <small v-else>—</small>
        </div>
      </div>
    </div>

    <div class="progress-row" v-if="stats.totalNews > 0">
      <div class="progress-bar">
        <div class="segment positive" :style="{ width: positivePercent + '%' }" />
        <div class="segment negative" :style="{ width: negativePercent + '%' }" />
        <div class="segment neutral" :style="{ width: neutralPercent + '%' }" />
      </div>
      <div class="progress-legend">
        <span class="legend-item pos">Позитив {{ positivePercent.toFixed(0) }}%</span>
        <span class="legend-item neg">Негатив {{ negativePercent.toFixed(0) }}%</span>
        <span v-if="neutralPercent > 0" class="legend-item neu">Нейтрал {{ neutralPercent.toFixed(0) }}%</span>
      </div>
    </div>

    <div class="insight" v-if="insight">
      <strong>Insight:</strong> {{ insight }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReportStatistics } from '@/types'
import { computed } from 'vue'

interface Props {
  stats: ReportStatistics | null
  subtitle?: string
}

const props = defineProps<Props>()

const stats = computed(() => props.stats)

const positivePercent = computed(() => {
  if (!stats.value) return 0
  return stats.value.totalNews === 0 ? 0 : (stats.value.positiveNewsCount / stats.value.totalNews) * 100
})
const negativePercent = computed(() => {
  if (!stats.value) return 0
  return stats.value.totalNews === 0 ? 0 : (stats.value.negativeNewsCount / stats.value.totalNews) * 100
})
const neutralPercent = computed(() => {
  if (!stats.value) return 0
  const neutral = stats.value.totalNews - stats.value.positiveNewsCount - stats.value.negativeNewsCount
  return stats.value.totalNews === 0 ? 0 : (neutral / stats.value.totalNews) * 100
})

const ratioLabel = computed(() => {
  if (!stats.value) return ''
  const pos = stats.value.positiveNewsCount
  const neg = stats.value.negativeNewsCount
  if (pos === 0 && neg === 0) return '—'
  if (neg === 0) return '∞'
  return `${pos}:${neg}`
})

const netImpact = computed(() => {
  if (!stats.value) return 0
  // Условный суммарный импакт = средний рост - средний спад (как модуль)
  return stats.value.averageGrowth - stats.value.averageDecline
})

const netImpactLabel = computed(() => {
  const v = netImpact.value
  if (v > 0) return `+${v.toFixed(1)}%`
  if (v < 0) return `${v.toFixed(1)}%`
  return '0%'
})

const trendClass = computed(() => {
  const v = netImpact.value
  if (v > 0.5) return 'trend-up'
  if (v < -0.5) return 'trend-down'
  return 'trend-flat'
})

const insight = computed(() => {
  if (!stats.value) return ''
  const { positiveNewsCount, negativeNewsCount, averageGrowth, averageDecline } = stats.value
  if (positiveNewsCount === 0 && negativeNewsCount === 0) return 'Недостаточно данных для выводов'
  if (positiveNewsCount > negativeNewsCount && averageGrowth > averageDecline) return 'Преобладает позитивный тон и сила сигналов'
  if (negativeNewsCount > positiveNewsCount && averageDecline > averageGrowth) return 'Рынок под давлением: негативные новости доминируют'
  if (Math.abs(positiveNewsCount - negativeNewsCount) <= 1) return 'Баланс сил: распределение новостей почти равное'
  return ''
})
</script>

<style scoped>
.stats-card-wrapper {
  --card-bg: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 1.75rem 1.5rem 1.75rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.2);
}
.stats-card-wrapper:before, .stats-card-wrapper:after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.18;
  pointer-events: none;
}
.stats-card-wrapper:before {
  width: 260px; height: 260px;
  background: radial-gradient(circle at 30% 30%, var(--accent) 0%, transparent 70%);
  top: -120px; left: -80px;
}
.stats-card-wrapper:after {
  width: 220px; height: 220px;
  background: radial-gradient(circle at 70% 70%, var(--success) 0%, transparent 70%);
  bottom: -110px; right: -60px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}
.subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  font-weight: 500;
}
.badge {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: inset 0 0 0 1px var(--border);
}
.badge.trend-up { color: var(--success); box-shadow: inset 0 0 0 1px rgba(16,185,129,0.4); }
.badge.trend-down { color: var(--danger); box-shadow: inset 0 0 0 1px rgba(239,68,68,0.4); }
.badge.trend-flat { color: var(--text-secondary); }

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.kpi {
  background: rgba(255,255,255,0.02);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  padding: 0.9rem 0.85rem 0.8rem;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 90px;
}
.kpi:before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0));
  pointer-events: none;
}
.kpi-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  font-weight: 600;
}
.kpi-value {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  line-height: 1;
}
.kpi-value small {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.85;
  line-height: 1.1;
}
.kpi.positive small { color: var(--success); }
.kpi.negative small { color: var(--danger); }
.kpi.ratio .kpi-value { font-size: 1.3rem; }
.kpi.faded { opacity: 0.45; }

.progress-row { margin-bottom: 1rem; }
.progress-bar {
  height: 14px;
  width: 100%;
  background: var(--bg-tertiary);
  border-radius: 8px;
  display: flex;
  overflow: hidden;
  border: 1px solid var(--border);
  position: relative;
}
.progress-bar .segment { height: 100%; transition: width 0.6s ease; }
.segment.positive { background: linear-gradient(90deg, rgba(16,185,129,0.9), rgba(16,185,129,0.5)); }
.segment.negative { background: linear-gradient(90deg, rgba(239,68,68,0.85), rgba(239,68,68,0.45)); }
.segment.neutral { background: linear-gradient(90deg, rgba(107,114,128,0.6), rgba(107,114,128,0.3)); }

.progress-legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.legend-item { opacity: 0.85; font-weight: 600; }
.legend-item.pos { color: var(--success); }
.legend-item.neg { color: var(--danger); }
.legend-item.neu { color: var(--text-secondary); }

.insight {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  padding: 0.75rem 0.9rem;
  border-radius: 0.6rem;
  color: var(--text-secondary);
  line-height: 1.3;
}
.insight strong { color: var(--text-primary); }

@media (max-width: 640px) {
  .kpi { min-height: 80px; }
  .kpi-value { font-size: 1.4rem; }
  .title { font-size: 1.2rem; }
}
</style>
