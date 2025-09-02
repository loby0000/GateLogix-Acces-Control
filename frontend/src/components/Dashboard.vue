<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="profile">
        <div class="avatar" @click="triggerFileInput">
          <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="avatar-img" />
        </div>
        <input type="file" ref="fileInput" style="display:none" @change="onFileChange" accept="image/*" />
        <div class="user-info">
          <p class="user-name">Nombre</p>
          <p class="user-doc">Documento</p>
        </div>
      </div>
      <nav class="nav-menu">
        <ul>
          <li>Dashboard</li>
          <li>Gestion usuarios</li>
          <li>Gestion Guardias</li>
          <li @click="goToHistorial" style="cursor:pointer">Historial</li>
          <li>Control Equipos</li>
          <li>Notificaciones</li>
          <li>Logs Auditoría</li>
          <li>Cerrar Sesión</li>
        </ul>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <section class="top-cards">
        <div class="card">
          <h3>Usuarios Activos</h3>
          <p class="number">{{ usuariosActivos }}</p>
        </div>
        <div class="card">
          <h3>Entradas del día</h3>
          <p class="number">{{ entradasDia }}</p>
        </div>
        <div class="card">
          <h3>Salidas del día</h3>
          <p class="number">{{ salidasDia }}</p>
        </div>
      </section>

      <section class="chart-section">
        <div class="chart-header">
          <h4>Entradas/salidas x mes</h4>
          <span>Año Actual</span>
          <button class="historial-btn">Historial</button>
        </div>
        <div class="chart-placeholder">
          <!-- Aquí iría un gráfico real, por ahora solo el placeholder -->
          <p>Gráfico de barras mes a mes (placeholder)</p>
        </div>
      </section>

      <section class="bottom-panels">
        <div class="entrada-salida-panel">
          <div class="entrada-salida-column">
            <div class="count-box">
              <h4>Entrada</h4>
              <p class="number">{{ entrada }}</p>
            </div>
            <div class="count-box">
              <h4>Salida</h4>
              <p class="number">{{ salida }}</p>
            </div>
          </div>

          <div class="calendar-and-button">
            <div class="calendar">
              <div class="calendar-header">
                <button @click="prevMonth">&#9664;</button>
                <span>{{ months[month] }} {{ year }}</span>
                <button @click="nextMonth">&#9654;</button>
              </div>
              <div class="calendar-days">
                <span v-for="day in daysLabel" :key="'day-'+day" class="day-label">{{ day }}</span>
              </div>
              <div class="calendar-dates">
                <template v-for="(row, rowIdx) in calendarRows" :key="'row-'+rowIdx">
                  <div style="display:flex;">
                    <template v-for="(block, colIdx) in row" :key="'block-'+rowIdx+'-'+colIdx">
                      <span v-if="block.type === 'empty'" class="empty"></span>
                      <button
                        v-else
                        :class="{'selected': block.value === selectedDate}"
                        @click="selectDate(block.value)"
                        class="date-btn"
                      >
                        {{ block.value }}
                      </button>
                    </template>
                  </div>
                </template>
              </div>
            </div>
            <button class="btn-gestion-usuarios">Gestion Usuarios</button>
          </div>
        </div>

        <div class="guardias-activos-panel">
          <h4>Guardias Activos</h4>
          <div class="circle-percentage">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <path class="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path class="circle"
                :stroke-dasharray="guardiasActivos + ', 100'"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" class="percentage">{{ guardiasActivos }}%</text>
            </svg>
          </div>
          <div class="legend">
            <div class="legend-item">
              <span class="black-box"></span> Activos
            </div>
            <div class="legend-item">
              <span class="gray-box"></span> Inactivos
            </div>
            <button class="btn-gestion-guardias">Gestion Gu</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      usuariosActivos: 0,
      entradasDia: 0,
      salidasDia: 0,
      entrada: 0,
      salida: 0,
      guardiasActivos: 65,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      selectedDate: null,
      daysLabel: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
      months: [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ],
      avatarUrl: null,
    }
  },
  computed: {
    daysInMonth() {
      return new Date(this.year, this.month + 1, 0).getDate();
    },
    blankDays() {
      const firstDay = new Date(this.year, this.month, 1).getDay();
      let blank = firstDay === 0 ? 6 : firstDay - 1;
      return Array.from({ length: blank });
    },
    calendarRows() {
      // 5 filas x 7 columnas
      const totalBlocks = 35;
      const blanks = this.blankDays.length;
      const days = this.daysInMonth;
      const blocks = [];
      for (let i = 0; i < blanks; i++) blocks.push({ type: 'empty' });
      for (let i = 1; i <= days; i++) blocks.push({ type: 'date', value: i });
      while (blocks.length < totalBlocks) blocks.push({ type: 'empty' });
      // Agrupar en filas de 7
      const rows = [];
      for (let i = 0; i < 5; i++) {
        rows.push(blocks.slice(i * 7, (i + 1) * 7));
      }
      return rows;
    }
  },
  methods: {
    prevMonth() {
      if (this.month === 0) {
        this.month = 11;
        this.year--;
      } else {
        this.month--;
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.avatarUrl = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    nextMonth() {
      if (this.month === 11) {
        this.month = 0;
        this.year++;
      } else {
        this.month++;
      }
    },
    selectDate(date) {
      this.selectedDate = date;
    },
    goToHistorial() {
      this.$router.push({ path: '/historial' });
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 230px;
  border-right: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
}
.profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.avatar {
  width: 50px;
  height: 50px;
  background: repeating-conic-gradient(#ccc 0deg 45deg, #fff 45deg 90deg);
  border-radius: 50%;
  border: 3px solid #000;
}
.user-info {
  font-size: 14px;
}
.user-name {
  font-family: 'Comic Sans MS', cursive, sans-serif;
  font-weight: bold;
  margin: 0;
}
.user-doc {
  margin: 0;
}
.nav-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.nav-menu li {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.8rem 0;
  cursor: pointer;
  font-size: 16px;
  text-align: left;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background 0.2s;
}
.nav-menu li:hover {
  background: #f0f0f0;
}
.avatar {
  width: 50px;
  height: 50px;
  background: repeating-conic-gradient(#ccc 0deg 45deg, #fff 45deg 90deg);
  border-radius: 50%;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Main content */
.main-content {
  flex-grow: 1;
  padding: 1rem 1.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.top-cards {
  display: flex;
  gap: 1.5rem;
}
.card {
  border: 1px solid #000;
  padding: 1rem 1.5rem;
  flex: 1;
  text-align: center;
}
.card h3 {
  margin-top: 0;
  font-weight: 500;
}
.number {
  font-size: 1.8rem;
  margin: 0.5rem 0 0;
}

/* Chart section */
.chart-section {
  border: 1px solid #000;
  padding: 1rem;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: 600;
}
.historial-btn {
  cursor: pointer;
  padding: 0.25em 0.75em;
  font-size: 14px;
}
.chart-placeholder {
  height: 80px;
  border: 1px solid #000;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  color: #555;
}

/* Bottom panels */
.bottom-panels {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.entrada-salida-panel {
  flex: 2 1 400px;
  border: 1px solid #000;
  padding: 1rem;
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: nowrap;
}

.entrada-salida-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calendar-and-button {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.count-box {
  border: 1px solid #000;
  padding: 1rem 2rem;
  flex-basis: 120px;
  text-align: center;
}
.count-box h4 {
  margin: 0 0 0.25rem;
}
.count-box .number {
  font-size: 1.5rem;
  margin: 0;
}

.calendar {
  border: 1px solid #000;
  padding: 0.5rem;
  width: 220px;
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 0.3rem;
}
.calendar-header button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  user-select: none;
}
.calendar-days {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 0.25rem;
}
.day-label {
  width: 28px;
  text-align: center;
}
.calendar-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
.date-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #000;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  user-select: none;
}
.date-btn.selected {
  background-color: #ccc;
}

.empty {
  width: 28px;
  height: 28px;
  visibility: hidden;
}

/* Gestion Usuarios Button */
.btn-gestion-usuarios {
  width: 100%;
  max-width: 220px;
  padding: 0.4rem;
  font-size: 14px;
  cursor: pointer;
}

/* Guardias Activos Panel */
.guardias-activos-panel {
  flex: 1 1 250px;
  border: 1px solid #000;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.circle-percentage {
  width: 120px;
  height: 120px;
  position: relative;
}
.circular-chart {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}
.circle-bg {
  fill: none;
  stroke: #eee;
  stroke-width: 3.8;
}
.circle {
  fill: none;
  stroke: black;
  stroke-width: 3.8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}
.percentage {
  fill: black;
  font-size: 0.5em;
  text-anchor: middle;
  dominant-baseline: middle;
  transform: rotate(90deg);
}

.legend {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 14px;
  width: 100%;
  justify-content: space-between;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.black-box {
  width: 20px;
  height: 20px;
  background-color: black;
  border: 1px solid black;
}
.gray-box {
  width: 20px;
  height: 20px;
  background-color: gray;
  border: 1px solid black;
}

/* Gestion Gu Button */
.btn-gestion-guardias {
  padding: 0.3em 0.8em;
  font-size: 13px;
  cursor: pointer;
  align-self: flex-start;
}
</style>