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
            <li @click="goToGestionUsuarios" style="cursor:pointer">Gestion usuarios</li>
            <li @click="goToGestionGuardias" style="cursor:pointer">Gestion Guardias</li>
            <li @click="goToHistorial" style="cursor:pointer">Historial</li>
            <li @click="goToControlEquipos" style="cursor:pointer">Control Equipos</li>
            <li @click="goToNotificacion" style="cursor:pointer">Notificaciones</li>
            <li @click="goToLogsAuditoria" style="cursor:pointer">Logs Auditoría</li>
            <li @click="goToLogin" style="cursor:pointer">Cerrar Sesión</li>
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
        <div class="chart-container">
          <div class="chart-bars">
            <div class="bar-group" v-for="(month, index) in chartData" :key="index">
              <div class="bar entrada" :style="{height: (month.entradas / maxValue * 100) + '%'}" :title="`Entradas: ${month.entradas}`"></div>
              <div class="bar salida" :style="{height: (month.salidas / maxValue * 100) + '%'}" :title="`Salidas: ${month.salidas}`"></div>
              <span class="month-label">{{ month.name }}</span>
            </div>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color entrada"></span>
              <span>Entradas</span>
            </div>
            <div class="legend-item">
              <span class="legend-color salida"></span>
              <span>Salidas</span>
            </div>
          </div>
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
            <button class="btn-gestion-usuarios" @click="goToGestionUsuarios">Gestion Usuarios</button>
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
      chartData: [
        { name: 'Ene', entradas: 45, salidas: 42 },
        { name: 'Feb', entradas: 52, salidas: 48 },
        { name: 'Mar', entradas: 38, salidas: 35 },
        { name: 'Abr', entradas: 61, salidas: 58 },
        { name: 'May', entradas: 55, salidas: 52 },
        { name: 'Jun', entradas: 47, salidas: 44 },
        { name: 'Jul', entradas: 63, salidas: 60 },
        { name: 'Ago', entradas: 58, salidas: 55 },
        { name: 'Sep', entradas: 42, salidas: 39 },
        { name: 'Oct', entradas: 67, salidas: 64 },
        { name: 'Nov', entradas: 53, salidas: 50 },
        { name: 'Dic', entradas: 49, salidas: 46 }
      ]
    }
  },
  computed: {
    maxValue() {
      const allValues = this.chartData.flatMap(month => [month.entradas, month.salidas]);
      return Math.max(...allValues);
    },
    daysInMonth() {
      return new Date(this.year, this.month + 1, 0).getDate();
    },
    blankDays() {
      const firstDay = new Date(this.year, this.month, 1).getDay();
      let blank = firstDay === 0 ? 6 : firstDay - 1;
      return Array.from({ length: blank });
    },
    calendarRows() {
      const totalBlocks = 35;
      const blanks = this.blankDays.length;
      const days = this.daysInMonth;
      const blocks = [];
      for (let i = 0; i < blanks; i++) blocks.push({ type: 'empty' });
      for (let i = 1; i <= days; i++) blocks.push({ type: 'date', value: i });
      while (blocks.length < totalBlocks) blocks.push({ type: 'empty' });
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
    goToHistorial() {
      this.$router.push({ path: '/historial' });
    },
    goToGestionUsuarios() {
      this.$router.push({ path: '/gestion-usuarios' });
    },
     goToGestionGuardias() {
    this.$router.push({ path: '/gestionGuardia' });
     },
    logout() {
      localStorage.removeItem('token');
      this.$router.push({ path: '/login', name: 'login' });
     },
     goToControlEquipos() {
       this.$router.push({ path: '/control-equipos' });
    },
    goToNotificacion() {
      this.$router.push({ path: '/notificacion' });
    },
    goToLogsAuditoria() {
      this.$router.push({ path: '/logs-auditoria' });
    },
    goToLogin() {
      this.$router.push({ path: '/login' });
      },
    }
  }
</script>

<style scoped>
:root {
  --primary-gradient: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  --secondary-gradient: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
  --success-gradient: linear-gradient(135deg, #059669 0%, #10b981 100%);
  --warning-gradient: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  --dark-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.15);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.8);
  --shadow-light: 0 8px 32px rgba(30, 64, 175, 0.2);
  --shadow-medium: 0 15px 35px rgba(30, 64, 175, 0.15);
  --shadow-heavy: 0 20px 40px rgba(0, 0, 0, 0.25);
  --accent-color: #3b82f6;
}

.app-container {
  display: flex;
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px) saturate(120%);
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  padding: clamp(1rem, 3vw, 1.5rem);
  box-sizing: border-box;
  box-shadow: var(--shadow-light);
  position: relative;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.avatar {
  width: 60px;
  height: 60px;
  background: var(--primary-gradient);
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
}

.avatar::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: var(--primary-gradient);
  border-radius: 50%;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.avatar:hover::before {
  opacity: 1;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-info {
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  color: var(--text-primary);
}

.user-name {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text-primary);
  font-size: clamp(1rem, 2.5vw, 1.1rem);
}

.user-doc {
  margin: 0;
  color: var(--text-secondary);
  font-weight: 400;
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
  padding: clamp(0.8rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.2rem);
  cursor: pointer;
  font-size: clamp(0.9rem, 2vw, 1rem);
  font-weight: 500;
  text-align: left;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.nav-menu li::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s;
}

.nav-menu li:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.nav-menu li:hover::before {
  left: 100%;
}

.nav-menu li:active {
  transform: translateX(2px) scale(0.98);
}

/* Main content */
.main-content {
  flex-grow: 1;
  padding: clamp(1rem, 3vw, 2rem);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: clamp(1.5rem, 3vw, 2rem);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.top-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(1rem, 3vw, 1.5rem);
}

@media (max-width: 768px) {
  .top-cards {
    grid-template-columns: 1fr;
  }
}

.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: clamp(1.5rem, 4vw, 2rem);
  text-align: center;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: var(--shadow-light);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-medium);
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.card h3 {
  margin: 0 0 clamp(0.5rem, 2vw, 1rem) 0;
  font-weight: 600;
  color: var(--text-primary);
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  letter-spacing: 0.5px;
}

.number {
  font-size: clamp(2rem, 5vw, 2.5rem);
  font-weight: 700;
  margin: 0;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -1px;
}

/* Chart section */
.chart-section {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: clamp(1.5rem, 4vw, 2rem);
  box-shadow: var(--shadow-light);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.chart-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.chart-section:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
  background: rgba(255, 255, 255, 0.12);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  font-weight: 600;
  color: var(--text-primary);
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
}

.historial-btn {
  cursor: pointer;
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  font-weight: 500;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.historial-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-container {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: clamp(1rem, 3vw, 1.5rem);
  backdrop-filter: blur(10px);
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: end;
  height: clamp(120px, 20vw, 160px);
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  max-width: 60px;
}

.bar {
  width: clamp(12px, 2vw, 16px);
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  position: relative;
}

.bar.entrada {
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  margin-right: 2px;
}

.bar.salida {
  background: linear-gradient(135deg, #10b981, #059669);
  margin-left: 2px;
}

.bar:hover {
  transform: scaleY(1.05);
  filter: brightness(1.2);
}

.month-label {
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 4px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: clamp(1rem, 3vw, 2rem);
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  color: var(--text-secondary);
  font-weight: 500;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.entrada {
  background: linear-gradient(135deg, #3b82f6, #1e40af);
}

.legend-color.salida {
  background: linear-gradient(135deg, #10b981, #059669);
}

/* Bottom panels */
.bottom-panels {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: clamp(1rem, 3vw, 1.5rem);
  align-items: start;
}

@media (max-width: 1024px) {
  .bottom-panels {
    grid-template-columns: 1fr;
  }
}

.entrada-salida-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: clamp(1.5rem, 4vw, 2rem);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: clamp(1rem, 3vw, 1.5rem);
  align-items: start;
  box-shadow: var(--shadow-light);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.entrada-salida-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.entrada-salida-panel:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
  background: rgba(255, 255, 255, 0.12);
}

.entrada-salida-column {
  display: flex;
  flex-direction: column;
  gap: clamp(0.8rem, 2vw, 1rem);
}

.calendar-and-button {
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vw, 1rem);
  align-items: center;
  justify-self: end;
}

.count-box {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: clamp(1rem, 3vw, 1.5rem) clamp(1.5rem, 4vw, 2rem);
  text-align: center;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  min-width: 120px;
}

.count-box:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.count-box h4 {
  margin: 0 0 clamp(0.25rem, 1vw, 0.5rem) 0;
  color: var(--text-secondary);
  font-size: clamp(0.9rem, 2vw, 1rem);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.count-box .number {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  margin: 0;
  background: var(--success-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.calendar {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: clamp(0.75rem, 2vw, 1rem);
  width: clamp(200px, 25vw, 250px);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.calendar:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.18);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: clamp(0.5rem, 2vw, 0.75rem);
}

.calendar-header button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  cursor: pointer;
  user-select: none;
  padding: 4px 8px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(10px);
}

.calendar-header button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.calendar-days {
  display: flex;
  justify-content: space-between;
  font-size: clamp(0.75rem, 1.8vw, 0.85rem);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: clamp(0.5rem, 2vw, 0.75rem);
}

.day-label {
  width: clamp(24px, 4vw, 32px);
  text-align: center;
  letter-spacing: 0.5px;
}

.calendar-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.date-btn {
  width: clamp(24px, 4vw, 32px);
  height: clamp(24px, 4vw, 32px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  cursor: pointer;
  font-size: clamp(0.7rem, 1.8vw, 0.8rem);
  font-weight: 500;
  padding: 0;
  user-select: none;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(10px);
}

.date-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.date-btn.selected {
  background: var(--primary-gradient);
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.empty {
  width: clamp(24px, 4vw, 32px);
  height: clamp(24px, 4vw, 32px);
  visibility: hidden;
}

/* Gestion Usuarios Button */
.btn-gestion-usuarios {
  width: 100%;
  max-width: clamp(200px, 25vw, 250px);
  padding: clamp(0.75rem, 2vw, 1rem);
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  font-weight: 600;
  cursor: pointer;
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.btn-gestion-usuarios::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.btn-gestion-usuarios:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.btn-gestion-usuarios:hover::before {
  left: 100%;
}

.btn-gestion-usuarios:active {
  transform: translateY(0);
}

/* Guardias Activos Panel */
.guardias-activos-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: clamp(1.5rem, 4vw, 2rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, 3vw, 1.5rem);
  box-shadow: var(--shadow-light);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.guardias-activos-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.guardias-activos-panel:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
  background: rgba(255, 255, 255, 0.12);
}

.guardias-activos-panel h4 {
  color: var(--text-primary);
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
  font-weight: 600;
  margin: 0;
  text-align: center;
  letter-spacing: 0.5px;
}

.circle-percentage {
  width: clamp(100px, 15vw, 140px);
  height: clamp(100px, 15vw, 140px);
  position: relative;
  filter: drop-shadow(0 4px 15px rgba(0, 0, 0, 0.2));
}

.circular-chart {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.15);
  stroke-width: 4;
}

.circle {
  fill: none;
  stroke: url(#gradient);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.percentage {
  fill: var(--text-primary);
  font-size: clamp(0.8rem, 2vw, 1rem);
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: middle;
  transform: rotate(90deg);
}

.legend {
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vw, 1rem);
  align-items: center;
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 0.75rem);
  color: var(--text-secondary);
  font-weight: 500;
}

.black-box {
  width: clamp(16px, 3vw, 20px);
  height: clamp(16px, 3vw, 20px);
  background: var(--primary-gradient);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.gray-box {
  width: clamp(16px, 3vw, 20px);
  height: clamp(16px, 3vw, 20px);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Gestion Gu Button */
.btn-gestion-guardias {
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  font-weight: 600;
  cursor: pointer;
  background: var(--secondary-gradient);
  color: white;
  border: none;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;
}

.btn-gestion-guardias::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.btn-gestion-guardias:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
}

.btn-gestion-guardias:hover::before {
  left: 100%;
}

.btn-gestion-guardias:active {
  transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .nav-menu {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
  }
  
  .nav-menu ul {
    display: flex;
    gap: 0.5rem;
    min-width: max-content;
  }
  
  .nav-menu li {
    white-space: nowrap;
    margin-bottom: 0;
  }
  
  .top-cards {
    grid-template-columns: 1fr;
  }
  
  .bottom-panels {
    grid-template-columns: 1fr;
  }
  
  .entrada-salida-panel {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .profile {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .calendar-and-button {
    width: 100%;
  }
  
  .calendar {
    width: 100%;
    max-width: 300px;
  }
}

/* SVG Gradient Definition */
.guardias-activos-panel svg defs {
  display: none;
}

.guardias-activos-panel::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

/* Add gradient definition for SVG */
.circular-chart::before {
  content: '<defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#667eea;stop-opacity:1" /><stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" /></linearGradient></defs>';
}
</style>