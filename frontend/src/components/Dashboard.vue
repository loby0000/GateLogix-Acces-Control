<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-white text-gray-800 flex">
    <!-- Sidebar elegante -->
    <aside class="w-72 min-h-screen bg-white border-r shadow-lg flex flex-col items-center py-8 px-4">
      <div class="flex flex-col items-center mb-10">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 shadow-lg flex items-center justify-center mb-3">
          <svg width="56" height="56" viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="16" rx="12" ry="12" fill="#fff" stroke="#2563eb" stroke-width="2"/><ellipse cx="24" cy="16" rx="10" ry="10" fill="#e0e7ff" stroke="#2563eb" stroke-width="1.5"/><ellipse cx="24" cy="16" rx="8" ry="8" fill="#fff" stroke="#2563eb" stroke-width="1"/></svg>
        </div>
        <div class="font-extrabold text-2xl text-blue-800 tracking-wide mb-1">Nombre</div>
        <div class="text-base text-gray-500">Documento</div>
      </div>
      <nav class="flex-1 flex flex-col gap-2 w-full">
        <a class="py-2 px-5 rounded-lg font-semibold bg-blue-100 text-blue-800 shadow-sm">Dashboard</a>
        <a class="py-2 px-5 rounded-lg hover:bg-blue-50 transition">Gestion usuarios</a>
        <a class="py-2 px-5 rounded-lg hover:bg-blue-50 transition">Gestion Guardias</a>
        <a class="py-2 px-5 rounded-lg hover:bg-blue-50 transition">Historial</a>
        <a class="py-2 px-5 rounded-lg hover:bg-blue-50 transition">Control Equipos</a>
        <a class="py-2 px-5 rounded-lg hover:bg-blue-50 transition">Notificaciones</a>
        <a class="py-2 px-5 rounded-lg hover:bg-blue-50 transition">Logs Auditoría</a>
        <button class="mt-6 py-2 px-5 rounded-lg bg-red-100 text-red-700 font-bold shadow hover:bg-red-200 transition">Cerrar Sesión</button>
      </nav>
    </aside>

    <!-- Main -->
    <main class="flex-1 p-8 flex flex-col gap-10 max-w-7xl mx-auto">
      <!-- Top cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div class="bg-white rounded-xl shadow-lg p-8 text-center flex flex-col items-center min-w-[220px] min-h-[120px] border-t-4 border-blue-500">
          <div class="text-lg font-semibold text-gray-600 mb-2">Usuarios Activos</div>
          <div class="text-3xl font-extrabold text-blue-700">{{ stats.activeUsers }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-8 text-center flex flex-col items-center min-w-[220px] min-h-[120px] border-t-4 border-blue-500">
          <div class="text-lg font-semibold text-gray-600 mb-2">Entradas del día</div>
          <div class="text-3xl font-extrabold text-blue-700">{{ stats.entriesToday }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-8 text-center flex flex-col items-center min-w-[220px] min-h-[120px] border-t-4 border-blue-500">
          <div class="text-lg font-semibold text-gray-600 mb-2">Salidas del día</div>
          <div class="text-3xl font-extrabold text-blue-700">{{ stats.exitsToday }}</div>
        </div>
      </div>

      <!-- Chart and lower area -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Gráfica principal -->
        <section class="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-4 border border-gray-200">
          <div class="flex flex-wrap justify-between items-center mb-2 gap-2">
            <span class="text-2xl font-bold text-gray-800">Entradas/salidas x mes</span>
            <span class="text-lg font-medium text-gray-500">Año Actual</span>
            <button @click="toggleHistory" class="border border-blue-500 px-5 py-1 rounded-lg text-blue-700 font-semibold hover:bg-blue-50 transition">Historial</button>
          </div>
          <div class="w-full h-64">
            <canvas ref="monthChart" height="120"></canvas>
          </div>
        </section>
        <!-- Guardias activos -->
        <aside class="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-between min-h-[340px] border border-gray-200">
          <div class="text-2xl font-bold text-gray-800 mb-2">Guardias Activos</div>
          <div class="relative flex items-center justify-center mb-2 w-full">
            <canvas ref="doughnutChart" width="180" height="180"></canvas>
            <div class="absolute text-4xl font-extrabold text-blue-700 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">{{ guardiasPercent }}%</div>
          </div>
          <div class="flex gap-6 mb-2 w-full justify-center">
            <div class="flex items-center gap-2"><span class="w-6 h-6 bg-blue-700 block rounded"></span> <span class="text-lg font-semibold text-gray-700">Activos</span></div>
            <div class="flex items-center gap-2"><span class="w-6 h-6 bg-gray-300 block rounded"></span> <span class="text-lg font-semibold text-gray-700">Inactivos</span></div>
          </div>
          <button class="border border-blue-500 px-5 py-1 rounded-lg text-blue-700 font-semibold hover:bg-blue-50 transition">Gestion Gu</button>
        </aside>
      </div>

      <!-- Lower area: Entrada/Salida + calendario -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div class="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-8 min-h-[340px] justify-between border border-gray-200">
          <div class="bg-blue-50 rounded-lg p-6 text-center flex-1 flex flex-col justify-center border-t-4 border-blue-500">
            <div class="text-lg font-semibold text-gray-600 mb-2">Entrada</div>
            <div class="text-3xl font-extrabold text-blue-700">{{ todayCounts.entry }}</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-6 text-center flex-1 flex flex-col justify-center border-t-4 border-blue-500">
            <div class="text-lg font-semibold text-gray-600 mb-2">Salida</div>
            <div class="text-3xl font-extrabold text-blue-700">{{ todayCounts.exit }}</div>
          </div>
        </div>
        <div class="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border border-gray-200">
          <div class="flex items-center justify-between w-full mb-4">
            <button @click="prevMonth" class="border border-blue-500 px-3 py-1 rounded-lg text-blue-700 font-semibold hover:bg-blue-50 transition">◀</button>
            <div class="border border-blue-500 px-8 py-2 rounded-lg text-xl font-bold bg-blue-50 text-blue-800">{{ monthNames[currentMonth] }} {{ currentYear }}</div>
            <button @click="nextMonth" class="border border-blue-500 px-3 py-1 rounded-lg text-blue-700 font-semibold hover:bg-blue-50 transition">▶</button>
          </div>
          <div class="grid grid-cols-7 gap-2 text-center text-base mb-2 w-full">
            <div v-for="d in weekDays" :key="d" class="font-bold text-gray-700">{{ d }}</div>
          </div>
          <div class="grid grid-cols-7 gap-2 w-full">
            <div
              v-for="(cell, idx) in calendarDays"
              :key="idx"
              class="h-12 flex items-center justify-center rounded-lg border border-blue-200 text-lg cursor-pointer transition"
              :class="{
                'text-gray-400 bg-gray-100': !cell.inMonth,
                'bg-blue-200 font-bold text-blue-900': isToday(cell.date),
                'bg-yellow-100': cell.hasEvent
              }"
              @click="selectDate(cell)"
            >
              {{ cell.day }}
            </div>
          </div>
          <button @click="goToGestionUsuarios" class="border border-blue-500 px-8 py-2 rounded-lg text-xl font-bold mt-6 bg-blue-600 text-white hover:bg-blue-700 transition">Gestion Usuarios</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
/**
 * Dashboard.vue
 * Requerimientos:
 * - Vue 3 (Composition API)
 * - Tailwind CSS (para estilos)
 * - chart.js (npm i chart.js)
 *
 * Pega este archivo en src/views/Dashboard.vue
 */

import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

/* ----- Datos de ejemplo (reemplaza con tu API) ----- */
const stats = reactive({
  activeUsers: 0,
  entriesToday: 0,
  exitsToday: 0
})

// ejemplo mensual (12 meses)
const monthlyData = reactive({
  entries: [12, 18, 16, 14, 20, 24, 30, 28, 26, 22, 18, 15],
  exits:   [8,  9,  7,  6,  9,  11, 14, 13, 12, 11, 10, 9],
})

// counts today
const todayCounts = reactive({ entry: 0, exit: 0 })

// guardias
const guardias = reactive({ activos: 13, inactivos: 7 })

/* ----- Chart refs ----- */
const monthChart = ref(null)
const doughnutChart = ref(null)
let monthChartInstance = null
let doughnutChartInstance = null

/* ----- Calendar state ----- */
const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())
const selectedDate = ref(null)

const monthNames = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'
]
const weekDays = ['L','M','X','J','V','S','D'] // Lunes..Domingo (como tu boceto)

const calendarDays = ref([])

/* ----- Computed ----- */
const guardiasPercent = computed(() => {
  const total = guardias.activos + guardias.inactivos
  if (!total) return 0
  return Math.round((guardias.activos / total) * 100)
})

/* ----- Funciones ----- */
function buildCalendar(month = currentMonth.value, year = currentYear.value) {
  calendarDays.value = []
  // Primer día del mes (0..6) (DOM-based -> ajustamos a Lunes..Domingo)
  const first = new Date(year, month, 1)
  let startWeekday = first.getDay() // 0 (Dom) - 6 (Sab)
  // Convertir a índice donde lunes=0 (según weekDays): JS domingo=0 -> queremos 6
  // Ajuste: weekdayIndex = (day + 6) % 7
  startWeekday = (startWeekday + 6) % 7

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // days from prev month to fill first week
  const prevMonthDays = startWeekday
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  // Fill leading days from previous month
  for (let i = prevMonthLastDay - prevMonthDays + 1; i <= prevMonthLastDay; i++) {
    const d = new Date(year, month - 1, i)
    calendarDays.value.push({ day: i, inMonth: false, date: d, hasEvent: false })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d)
    // ejemplo: marcar eventos aleatorios (puedes reemplazar con datos reales)
    const hasEvent = Math.random() > 0.8
    calendarDays.value.push({ day: d, inMonth: true, date: dateObj, hasEvent })
  }

  // Fill trailing days to complete weeks (7 columns)
  while (calendarDays.value.length % 7 !== 0) {
    const nextDay = calendarDays.value.length - (prevMonthDays + daysInMonth) + 1
    const d = new Date(year, month + 1, nextDay)
    calendarDays.value.push({ day: d.getDate(), inMonth: false, date: d, hasEvent: false })
  }
}

function isToday(date) {
  const t = new Date()
  return date.getFullYear() === t.getFullYear() &&
         date.getMonth() === t.getMonth() &&
         date.getDate() === t.getDate()
}

function selectDate(cell) {
  selectedDate.value = cell.date
  // ejemplo: al seleccionar fecha, actualizamos contador del día (simulación)
  todayCounts.entry = Math.floor(Math.random() * 10)
  todayCounts.exit = Math.floor(Math.random() * 8)
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  buildCalendar()
  updateMonthChartLabel()
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  buildCalendar()
  updateMonthChartLabel()
}

function goToGestionUsuarios() {
  // placeholder: en una app real navegarías con router.push
  alert('Ir a Gestión de Usuarios (ejemplo)')
}

function toggleHistory() {
  alert('Mostrar historial (ejemplo)')
}

/* ----- Charts ----- */
function initMonthChart() {
  if (!monthChart.value) return
  const ctx = monthChart.value.getContext('2d')
  if (monthChartInstance) monthChartInstance.destroy()
  monthChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthNames,
      datasets: [
        {
          label: 'Entradas',
          data: monthlyData.entries,
          backgroundColor: 'rgba(59,130,246,0.7)', // tailwind blue-500 semitransp
          borderRadius: 6
        },
        {
          label: 'Salidas',
          data: monthlyData.exits,
          backgroundColor: 'rgba(107,114,128,0.7)', // gray
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { stacked: false },
        y: { beginAtZero: true }
      }
    }
  })
}

function initDoughnutChart() {
  if (!doughnutChart.value) return
  const ctx = doughnutChart.value.getContext('2d')
  if (doughnutChartInstance) doughnutChartInstance.destroy()
  doughnutChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Activos','Inactivos'],
      datasets: [{
        data: [guardias.activos, guardias.inactivos],
        backgroundColor: ['#000000','#9CA3AF']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: { legend: { display: false } }
    }
  })
}

function updateMonthChartLabel() {
  // Si quieres actualizar etiquetas o datos dinámicamente: ejemplo de filtro por mes
  // (aquí no cambiamos datos, solo sirve como placeholder)
  if (!monthChartInstance) return
  monthChartInstance.update()
}

/* ----- Simulación de carga inicial de datos ----- */
function fetchInitialData() {
  // Simula carga desde API
  stats.activeUsers = 42
  stats.entriesToday = 5
  stats.exitsToday = 2
  todayCounts.entry = 2
  todayCounts.exit = 1
  // monthlyData ya tiene valores de ejemplo
  guardias.activos = 18
  guardias.inactivos = 10
}

/* ----- Lifecycle ----- */
onMounted(() => {
  fetchInitialData()
  buildCalendar()
  initMonthChart()
  initDoughnutChart()
})

onBeforeUnmount(() => {
  if (monthChartInstance) monthChartInstance.destroy()
  if (doughnutChartInstance) doughnutChartInstance.destroy()
})
</script>

<style scoped>
/* pequeños ajustes para que el calendario tenga aspecto limpio */
.grid-cols-7 > div {
  min-height: 2.5rem;
}
canvas {
  /* asegurar que canvas use el tamaño del contenedor (Chart.js) */
  width: 100% !important;
  height: auto !important;
}
</style>
