<template>
  <div class="app-container" :class="{ 'dark-theme': isDarkTheme }">
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
      
      <!-- Theme Toggle Button moved to sidebar -->
      <div class="sidebar-theme-toggle">
        <button class="theme-toggle-sidebar" @click="toggleTheme" :title="isDarkTheme ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'">
          <svg v-if="isDarkTheme" class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <span class="theme-text">{{ isDarkTheme ? 'Tema Oscuro' : 'Tema Claro' }}</span>
        </button>
      </div>

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
                stroke-dasharray="65, 100"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" class="percentage">65%</text>
            </svg>
            <div class="count-box">
              <h4>Guardias</h4>
              <p class="number">{{ guardiasActivos }}</p>
            </div>
            <button class="btn-gestion-guardias" @click="goToGestionGuardias">Gestion Guardias</button>
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
      isDarkTheme: true, // Configurar tema oscuro como predeterminado
      usuariosActivos: 150,
      entradasDia: 45,
      salidasDia: 42,
      entrada: 89,
      salida: 87,
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
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
    }
  },
  mounted() {
    // Component mounted with theme functionality restored
  }
}
</script>

<style scoped>
/* Variables base para el tema oscuro por defecto */
:root {
  /* Colores base oscuros */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-card: rgba(30, 41, 59, 0.95);
  --bg-hover: #475569;
  
  /* Colores de texto oscuros */
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --text-accent: #60a5fa;
  
  /* Colores de borde oscuros */
  --border-primary: #334155;
  --border-secondary: #475569;
  --border-accent: #60a5fa;
  
  /* Colores de acento oscuros */
  --accent-blue: #3b82f6;
  --accent-green: #10b981;
  --accent-orange: #f59e0b;
  --accent-purple: #8b5cf6;
  
  /* Sombras oscuras */
  --shadow-light: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-strong: 0 4px 16px rgba(0, 0, 0, 0.5);
  
  /* Gradientes oscuros */
  --gradient-primary: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  --gradient-card: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.9) 100%);
  --gradient-accent: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  
  /* Legacy variables for compatibility */
  --primary-blue: #2563eb;
  --primary-blue-light: #3b82f6;
  --primary-blue-lighter: #60a5fa;
  --primary-blue-lightest: #dbeafe;
  --white: #ffffff;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  --text-white: #ffffff;
  --text-contrast: #000000;
  --border-light: rgba(148, 163, 184, 0.2);
  --border-medium: rgba(148, 163, 184, 0.3);
  --primary-gradient: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  --secondary-gradient: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%);
  --success-gradient: linear-gradient(135deg, #059669 0%, #10b981 100%);
  --warning-gradient: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
}

/* TEMA CLARO - Solo disponible cuando se desactiva el tema oscuro */
.app-container:not(.dark-theme) {
  /* Tema claro más cálido con mejor contraste */
  --bg-primary: #faf8f5;
  --bg-secondary: #f0ebe3;
  --bg-card: rgba(248, 245, 240, 0.95);
  --bg-glass: rgba(245, 240, 235, 0.85);
  --bg-sidebar: rgba(250, 247, 242, 0.98);
  
  --text-primary: #1a1a1a;
  --text-secondary: #3d3d3d;
  --text-muted: #666666;
  
  --border-light: rgba(148, 163, 184, 0.2);
  --border-medium: rgba(148, 163, 184, 0.3);
  --border-primary: rgba(139, 69, 19, 0.2);
  --border-secondary: rgba(139, 69, 19, 0.3);
  
  --bg-hover: rgba(139, 69, 19, 0.1);
  --text-accent: #2c5aa0;
  --accent-blue: #1e3a8a;
  --text-white: #ffffff;
  --text-contrast: #000000;
  
  --primary-blue: #2c5aa0;
  --success-green: #1e7e34;
  --warning-orange: #d68910;
  --error-red: #c0392b;
  
  --shadow-light: 0 2px 8px rgba(139, 69, 19, 0.12);
  --shadow-medium: 0 4px 16px rgba(139, 69, 19, 0.18);
  --shadow-strong: 0 8px 32px rgba(139, 69, 19, 0.25);
  
  --primary-gradient: linear-gradient(135deg, #2c5aa0, #1e3a8a);
  --secondary-gradient: linear-gradient(135deg, #f0ebe3, #e6ddd4);
  --success-gradient: linear-gradient(135deg, #1e7e34, #155724);
  --glass-gradient: linear-gradient(135deg, rgba(248, 245, 240, 0.95), rgba(245, 240, 235, 0.85));
}

.app-container {
  display: flex;
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  font-family: 'Inter', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  transition: background-color 0.3s ease, color 0.3s ease;
  line-height: 1.5;
}

/* Chart Section */
.chart-section {
  background: var(--bg-card);
  border-radius: 16px;
  padding: clamp(1.5rem, 4vw, 2rem);
  margin-bottom: clamp(1.5rem, 3vw, 2rem);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-light);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.chart-section:hover {
  box-shadow: var(--shadow-medium);
  border-color: var(--border-medium);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1.3rem;
}

.chart-header span {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.historial-btn {
  background: var(--secondary-gradient);
  color: var(--text-primary);
  border: none;
  padding: clamp(0.5rem, 1.5vw, 0.7rem) clamp(1rem, 2.5vw, 1.2rem);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: clamp(0.8rem, 1.8vw, 0.9rem);
  border: 1px solid var(--border-light);
}

.historial-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
  border-color: var(--border-medium);
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 1.5rem);
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: end;
  height: clamp(200px, 30vw, 300px);
  padding: clamp(1rem, 3vw, 1.5rem);
  background: var(--bg-glass);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  gap: clamp(0.3rem, 1vw, 0.5rem);
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.2rem, 0.5vw, 0.3rem);
  flex: 1;
  min-width: clamp(35px, 5vw, 50px);
}

.bar {
  width: clamp(20px, 3vw, 25px);
  min-height: 10px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.bar.entrada {
  background: var(--primary-gradient);
}

.bar.salida {
  background: var(--success-gradient);
}

.bar:hover {
  transform: scaleY(1.05);
  filter: brightness(1.1);
}

.month-label {
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  color: var(--text-secondary);
  font-weight: 500;
  text-align: center;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: clamp(1.5rem, 4vw, 2rem);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 0.8rem);
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  color: var(--text-secondary);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.entrada {
  background: var(--primary-gradient);
}

.legend-color.salida {
  background: var(--success-gradient);
}

/* Bottom Panels */
.bottom-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(1.5rem, 4vw, 2rem);
  margin-bottom: clamp(1.5rem, 3vw, 2rem);
}

@media (max-width: 768px) {
  .bottom-panels {
    grid-template-columns: 1fr;
  }
}

.entrada-salida-panel, .guardias-activos-panel {
  background: var(--bg-card);
  border-radius: 16px;
  padding: clamp(1.5rem, 4vw, 2rem);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-light);
  transition: all 0.3s ease;
}

.entrada-salida-panel:hover, .guardias-activos-panel:hover {
  box-shadow: var(--shadow-medium);
  border-color: var(--border-medium);
}

.entrada-salida-panel {
  display: flex;
  gap: clamp(1.5rem, 4vw, 2rem);
}

@media (max-width: 768px) {
  .entrada-salida-panel {
    flex-direction: column;
  }
}

.entrada-salida-column {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 1.5rem);
  flex: 1;
}

.count-box {
  background: var(--bg-glass);
  border-radius: 12px;
  padding: clamp(1rem, 3vw, 1.5rem);
  text-align: center;
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.count-box:hover {
  background: var(--bg-secondary);
  border-color: var(--border-medium);
}

.count-box h4 {
  margin: 0 0 clamp(0.5rem, 1.5vw, 0.8rem) 0;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: clamp(0.9rem, 2vw, 1rem);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.count-box .number {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  font-weight: 700;
  color: var(--text-primary);
  background: var(--success-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.calendar-and-button {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 1.5rem);
  flex: 1;
}

.calendar {
  background: var(--bg-glass);
  border-radius: 12px;
  padding: clamp(1rem, 3vw, 1.5rem);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.calendar:hover {
  border-color: var(--border-medium);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
}

.calendar-header span {
  font-weight: 600;
  color: var(--text-primary);
  font-size: clamp(1rem, 2.5vw, 1.1rem);
}

.calendar-header button {
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  width: clamp(30px, 5vw, 35px);
  height: clamp(30px, 5vw, 35px);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: clamp(0.8rem, 1.8vw, 0.9rem);
}

.calendar-header button:hover {
  background: var(--bg-card);
  transform: scale(1.05);
  border-color: var(--border-medium);
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: clamp(0.2rem, 0.5vw, 0.3rem);
  margin-bottom: clamp(0.5rem, 1.5vw, 1rem);
}

.day-label {
  text-align: center;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  padding: clamp(0.3rem, 1vw, 0.5rem);
}

.calendar-dates {
  display: flex;
  flex-direction: column;
  gap: clamp(0.2rem, 0.5vw, 0.3rem);
}

.calendar-dates > div {
  display: flex;
  gap: clamp(0.2rem, 0.5vw, 0.3rem);
}

.empty {
  flex: 1;
  aspect-ratio: 1;
}

.date-btn {
  flex: 1;
  aspect-ratio: 1;
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-btn:hover {
  background: var(--bg-card);
  transform: scale(1.05);
  border-color: var(--border-medium);
}

.date-btn.selected {
  background: var(--primary-gradient);
  border-color: var(--primary-blue);
  color: var(--text-white);
  font-weight: 600;
}

.btn-gestion-usuarios, .btn-gestion-guardias {
  background: var(--success-gradient);
  color: var(--text-white);
  border: none;
  padding: clamp(0.8rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.5rem);
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: clamp(0.9rem, 2vw, 1rem);
  text-align: center;
  border: 1px solid transparent;
}

.btn-gestion-usuarios:hover, .btn-gestion-guardias:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
  filter: brightness(1.1);
}

.guardias-activos-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.guardias-activos-panel h4 {
  margin: 0 0 clamp(1rem, 3vw, 1.5rem) 0;
  color: var(--text-primary);
  font-weight: 600;
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
}

.circle-percentage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, 3vw, 1.5rem);
  width: 100%;
}

.circular-chart {
  width: clamp(120px, 25vw, 180px);
  height: clamp(120px, 25vw, 180px);
}

.circle-bg {
  fill: none;
  stroke: var(--border-light);
  stroke-width: 2.8;
}

.circle {
  fill: none;
  stroke: url(#gradient);
  stroke-width: 2.8;
  stroke-linecap: round;
  animation: progress 1s ease-out forwards;
}

.percentage {
  fill: var(--text-primary);
  font-family: 'Inter', sans-serif;
  font-size: clamp(0.4em, 1vw, 0.5em);
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: middle;
}

@keyframes progress {
  0% {
    stroke-dasharray: 0 100;
  }
}
/* Sidebar */
.sidebar {
  width: 280px;
  background: var(--bg-sidebar);
  backdrop-filter: blur(20px) saturate(120%);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  box-sizing: border-box;
  box-shadow: var(--shadow-light);
  position: relative;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, var(--border-medium), transparent);
}

.profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--bg-glass);
  border-radius: 16px;
  border: 1px solid var(--border-light);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.avatar {
  width: 60px;
  height: 60px;
  background: var(--primary-gradient);
  border-radius: 50%;
  border: 2px solid var(--border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: var(--shadow-light);
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
  box-shadow: var(--shadow-medium);
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
  margin-bottom: clamp(0.3rem, 1vw, 0.5rem);
  color: var(--text-primary);
  font-weight: 600;
  border-radius: 12px;
  transition: background-color 0.3s ease, color 0.3s ease;
  position: relative;
  overflow: hidden;
  font-size: clamp(0.9rem, 2vw, 1rem);
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  cursor: pointer;
}

.nav-menu li::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--border-medium), transparent);
  transition: left 0.6s;
}

.nav-menu li:hover {
  background: var(--bg-card);
  transform: translateX(5px);
  box-shadow: var(--shadow-light);
  border-color: var(--border-medium);
}

.nav-menu li:hover::before {
  left: 100%;
}

.nav-menu li:first-child {
  background: var(--primary-gradient);
  color: var(--text-white);
  border-color: var(--primary-blue);
}

.nav-menu li:last-child {
  background: var(--primary-gradient);
  color: var(--text-white);
  border-color: var(--primary-blue);
}

.nav-menu li:last-child:hover {
  background: var(--primary-gradient);
  filter: brightness(1.1);
}

/* Asegurar que el texto sea visible en tema claro */
.app-container:not(.dark-theme) .nav-menu li:last-child {
  color: var(--text-white);
}

.app-container:not(.dark-theme) .nav-menu li:first-child {
  color: var(--text-white);
}

/* Asegurar consistencia en el espaciado del sidebar para ambos temas */
.app-container:not(.dark-theme) .sidebar {
  padding: clamp(1rem, 3vw, 1.5rem);
  box-sizing: border-box;
}

.app-container:not(.dark-theme) .profile {
  margin-bottom: 2rem;
  padding: 1rem;
}

.app-container:not(.dark-theme) .nav-menu li {
  margin-bottom: clamp(0.3rem, 1vw, 0.5rem);
  padding: clamp(0.8rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.2rem);
}





/* Main content */
.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: var(--bg-secondary);
  transition: all 0.3s ease;
}

.top-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .top-cards {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--bg-card);
  backdrop-filter: blur(20px) saturate(120%);
  border: 1px solid var(--border-medium);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: var(--shadow-medium);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
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
  background: linear-gradient(90deg, transparent, var(--border-medium), transparent);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-strong);
  border-color: var(--primary-blue);
}

.card h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card .number {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -1px;
}

/* Chart section */
.chart-section {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow-light);
  transition: box-shadow 0.3s ease, background-color 0.3s ease;
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
  box-shadow: var(--shadow-medium);
  background: rgba(255, 255, 255, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
}

.chart-header span {
  color: var(--text-secondary);
  font-size: clamp(0.85rem, 2vw, 0.95rem);
}

.historial-btn {
  background: var(--primary-gradient);
  color: var(--text-primary);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  font-size: 0.9rem;
}

.historial-btn:hover {
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: end;
  height: 300px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
  gap: 1rem;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 60px;
}

.bar {
  width: 30px;
  min-height: 10px;
  border-radius: 4px 4px 0 0;
  transition: filter 0.3s ease;
  cursor: pointer;
  position: relative;
}

.bar.entrada {
  background: var(--primary-gradient);
  margin-right: 2px;
}

.bar.salida {
  background: var(--secondary-gradient);
  margin-left: 2px;
}

.bar:hover {
  filter: brightness(1.1);
  transform: scaleY(1.1) scaleX(1.1);
  filter: brightness(1.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.month-label {
  color: var(--text-primary);
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  font-weight: 500;
  text-align: center;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: clamp(1rem, 3vw, 2rem);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: clamp(0.3rem, 1vw, 0.5rem);
  color: var(--text-primary);
  font-size: clamp(0.8rem, 2vw, 0.9rem);
}

.legend-color {
  width: clamp(12px, 2.5vw, 16px);
  height: clamp(12px, 2.5vw, 16px);
  border-radius: 3px;
}

.legend-color.entrada {
  background: var(--primary-gradient);
}

.legend-color.salida {
  background: var(--secondary-gradient);
}

/* Bottom panels */
.bottom-panels {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: clamp(1rem, 3vw, 1.5rem);
  margin-top: clamp(1.5rem, 3vw, 2rem);
}

@media (max-width: 1024px) {
  .bottom-panels {
    grid-template-columns: 1fr;
  }
}

.entrada-salida-panel, .guardias-activos-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: clamp(1.5rem, 4vw, 2rem);
  box-shadow: var(--shadow-light);
  transition: box-shadow 0.3s ease, background-color 0.3s ease;
  position: relative;
  overflow: hidden;
}

.entrada-salida-panel::before, .guardias-activos-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.entrada-salida-panel:hover, .guardias-activos-panel:hover {
  box-shadow: var(--shadow-medium);
  background: rgba(255, 255, 255, 0.1);
}

.entrada-salida-panel {
  display: flex;
  gap: clamp(1rem, 3vw, 1.5rem);
}

@media (max-width: 768px) {
  .entrada-salida-panel {
    flex-direction: column;
  }
}

.entrada-salida-column {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 1.5rem);
  flex: 1;
}

.count-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: clamp(1rem, 3vw, 1.5rem);
  text-align: center;
  transition: background-color 0.3s ease;
}

.count-box:hover {
  background: rgba(255, 255, 255, 0.08);
}

.count-box h4 {
  margin: 0 0 clamp(0.5rem, 2vw, 1rem) 0;
  color: var(--text-primary);
  font-weight: 600;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
}

.calendar-and-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 1.5rem);
}

.calendar {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: clamp(1rem, 3vw, 1.5rem);
  flex: 1;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  color: var(--text-primary);
  font-weight: 600;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
}

.calendar-header button {
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  border-radius: 6px;
  padding: clamp(0.3rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.8rem);
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: clamp(0.8rem, 2vw, 1rem);
}

.calendar-header button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: clamp(0.2rem, 0.5vw, 0.3rem);
  margin-bottom: clamp(0.5rem, 1.5vw, 1rem);
}

.day-label {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  padding: clamp(0.3rem, 1vw, 0.5rem);
}

.calendar-dates {
  display: flex;
  flex-direction: column;
  gap: clamp(0.2rem, 0.5vw, 0.3rem);
}

.calendar-dates > div {
  display: flex;
  gap: clamp(0.2rem, 0.5vw, 0.3rem);
}

.empty {
  flex: 1;
  aspect-ratio: 1;
}

.date-btn {
  flex: 1;
  aspect-ratio: 1;
  background: var(--bg-glass);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: clamp(0.7rem, 1.5vw, 0.8rem);
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.date-btn.selected {
  background: var(--primary-gradient);
  border-color: rgba(59, 130, 246, 0.5);
  font-weight: 600;
}

.btn-gestion-usuarios, .btn-gestion-guardias {
  background: var(--success-gradient);
  color: var(--text-primary);
  border: none;
  padding: clamp(0.8rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.5rem);
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: box-shadow 0.3s ease, filter 0.3s ease;
  font-size: clamp(0.9rem, 2vw, 1rem);
  text-align: center;
}

.btn-gestion-usuarios:hover, .btn-gestion-guardias:hover {
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  filter: brightness(1.1);
}

.guardias-activos-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.guardias-activos-panel h4 {
  margin: 0 0 clamp(1rem, 3vw, 1.5rem) 0;
  color: var(--text-primary);
  font-weight: 600;
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
}

.circle-percentage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, 3vw, 1.5rem);
  width: 100%;
}

.circular-chart {
  width: clamp(120px, 25vw, 180px);
  height: clamp(120px, 25vw, 180px);
}

.circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 2.8;
}

.circle {
  fill: none;
  stroke: url(#gradient);
  stroke-width: 2.8;
  stroke-linecap: round;
  animation: progress 1s ease-out forwards;
}

.percentage {
  fill: white;
  font-family: 'Inter', sans-serif;
  font-size: clamp(0.4em, 1vw, 0.5em);
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: middle;
}

@keyframes progress {
  0% {
    stroke-dasharray: 0 100;
  }
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .sidebar {
    width: 250px;
  }
}

/* Media Queries para Responsive Design */

/* Portátiles pequeños (1025px - 1366px) - Nuevo breakpoint específico */
@media (min-width: 1025px) and (max-width: 1366px) {
  .sidebar {
    width: 240px;
    padding: 1.3rem;
  }
  
  .main-content {
    padding: 1.8rem;
  }
  
  .top-cards {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.2rem;
  }
  
  .card {
    padding: 1.6rem;
  }
  
  .card h3 {
    font-size: clamp(1rem, 2.2vw, 1.1rem);
  }
  
  .card .number {
    font-size: clamp(2.2rem, 4vw, 2.8rem);
  }
  
  .chart-section {
    padding: 1.6rem;
  }
  
  .chart-bars {
    height: 280px;
    padding: 1.2rem;
  }
  
  .bar-group {
    min-width: 45px;
  }
  
  .entrada-salida-panel, .guardias-activos-panel {
    padding: 1.6rem;
  }
  
  .count-box {
    padding: 1.3rem;
  }
  
  .calendar {
    padding: 1.3rem;
  }
  
  .btn-gestion-usuarios, .btn-gestion-guardias {
    padding: 0.9rem 1.4rem;
    font-size: 0.95rem;
  }
  
  .circular-chart {
    width: clamp(140px, 22vw, 160px);
    height: clamp(140px, 22vw, 160px);
  }
}

/* Laptops pequeños (768px - 1024px) */
@media (max-width: 1024px) {
  .sidebar {
    width: 250px;
    padding: 1.2rem;
  }
  
  .main-content {
    padding: 1.5rem;
  }
  
  .card {
    padding: 1.5rem;
  }
  
  .chart-section {
    padding: 1.5rem;
  }
  
  .entrada-salida-panel, .guardias-activos-panel {
    padding: 1.5rem;
  }
}

/* Tablets (481px - 768px) */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    padding: 1rem;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }
  
  .nav-menu ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
  
  .nav-menu li {
    flex: 1;
    min-width: 120px;
    text-align: center;
    margin-bottom: 0;
    padding: 0.5rem;
    background: var(--bg-glass);
    border-radius: 8px;
    font-size: 0.85rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .top-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .card {
    padding: 1.2rem;
  }
  
  .card h3 {
    font-size: 1rem;
  }
  
  .card .number {
    font-size: 2rem;
  }
  
  .chart-section {
    padding: 1.2rem;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .chart-header h4 {
    font-size: 1.1rem;
  }
  
  .chart-bars {
    height: 250px;
    padding: 1rem;
    gap: 0.5rem;
  }
  
  .bar-group {
    min-width: 40px;
    gap: 0.3rem;
  }
  
  .bar {
    width: 20px;
  }
  
  .month-label {
    font-size: 0.7rem;
  }
  
  .chart-legend {
    gap: 1rem;
  }
  
  .legend-item {
    font-size: 0.8rem;
  }
  
  .bottom-panels {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .entrada-salida-panel {
    flex-direction: column;
    gap: 1rem;
    padding: 1.2rem;
  }
  
  .guardias-activos-panel {
    padding: 1.2rem;
  }
  
  .count-box {
    padding: 1rem;
  }
  
  .count-box h4 {
    font-size: 1rem;
  }
  
  .calendar {
    padding: 1rem;
  }
  
  .calendar-header {
    font-size: 1rem;
    margin-bottom: 1rem;
  }
  
  .calendar-header button {
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
  }
  
  .btn-gestion-usuarios, .btn-gestion-guardias {
    padding: 0.8rem 1.2rem;
    font-size: 0.9rem;
  }
}

/* Móviles (≤480px) */
@media (max-width: 480px) {
  .sidebar {
    padding: 0.8rem;
  }
  
  .nav-menu ul {
    gap: 0.3rem;
  }
  
  .nav-menu li {
    min-width: 100px;
    font-size: 0.8rem;
    padding: 0.4rem;
  }
  
  .main-content {
    padding: 0.8rem;
  }
  
  .card {
    padding: 1rem;
  }
  
  .card h3 {
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
  }
  
  .card .number {
    font-size: 1.8rem;
  }
  
  .chart-section {
    padding: 1rem;
  }
  
  .chart-header h4 {
    font-size: 1rem;
  }
  
  .chart-bars {
    height: 200px;
    padding: 0.8rem;
    gap: 0.3rem;
  }
  
  .bar-group {
    min-width: 30px;
    gap: 0.2rem;
  }
  
  .bar {
    width: 15px;
  }
  
  .month-label {
    font-size: 0.65rem;
  }
  
  .chart-legend {
    gap: 0.8rem;
  }
  
  .legend-item {
    font-size: 0.75rem;
    gap: 0.3rem;
  }
  
  .legend-color {
    width: 12px;
    height: 12px;
  }
  
  .entrada-salida-panel, .guardias-activos-panel {
    padding: 1rem;
  }
  
  .count-box {
    padding: 0.8rem;
  }
  
  .count-box h4 {
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
  }
  
  .calendar {
    padding: 0.8rem;
  }
  
  .calendar-header {
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
  }
  
  .calendar-header button {
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .day-label {
    font-size: 0.7rem;
    padding: 0.3rem;
  }
  
  .date-btn {
    font-size: 0.7rem;
  }
  
  .btn-gestion-usuarios, .btn-gestion-guardias {
    padding: 0.7rem 1rem;
    font-size: 0.85rem;
  }
}

/* Móviles en horizontal (≤768px y landscape) */
@media (max-width: 768px) and (orientation: landscape) {
  .sidebar {
    padding: 0.8rem;
  }
  
  .nav-menu ul {
    justify-content: space-around;
  }
  
  .nav-menu li {
    min-width: 80px;
    font-size: 0.75rem;
    padding: 0.3rem;
  }
  
  .main-content {
    padding: 0.8rem;
  }
  
  .top-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }
  
  .chart-bars {
    height: 180px;
  }
  
  .bottom-panels {
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
  }
}

/* TEMA OSCURO - Estilos específicos para el tema oscuro */
.dark-theme {
  /* Variables del tema oscuro */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-card: rgba(30, 41, 59, 0.95);
  --bg-hover: #475569;
  
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --text-accent: #60a5fa;
  
  --border-primary: #334155;
  --border-secondary: #475569;
  --border-accent: #60a5fa;
  
  --accent-blue: #3b82f6;
  --accent-green: #10b981;
  --accent-orange: #f59e0b;
  --accent-purple: #8b5cf6;
  
  --shadow-light: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-strong: 0 4px 16px rgba(0, 0, 0, 0.5);
  
  --gradient-primary: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  --gradient-card: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.9) 100%);
  --gradient-accent: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

/* Estilos del botón de cambio de tema en el sidebar */
.sidebar-theme-toggle {
  margin-top: auto;
  padding: 1rem 0;
  border-top: 1px solid var(--border-primary);
}

/* Asegurar consistencia en el tema claro */
.app-container:not(.dark-theme) .sidebar-theme-toggle {
  border-top: 1px solid var(--border-primary);
  padding: 1rem 0;
  margin-top: auto;
}

.theme-toggle-sidebar {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.theme-toggle-sidebar:hover {
  background: var(--bg-hover);
  border-color: var(--border-accent);
  box-shadow: var(--shadow-medium);
}

.theme-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  color: var(--text-accent);
  transition: color 0.3s ease;
}

.theme-text {
  font-weight: 500;
  color: var(--text-secondary);
}

.theme-toggle-sidebar:hover .theme-icon {
  color: var(--accent-blue);
}

.theme-toggle-sidebar:hover .theme-text {
  color: var(--text-primary);
}
</style>