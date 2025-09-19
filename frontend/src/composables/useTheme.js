// Composable para manejar el tema de la aplicación
import { ref, onMounted, watch } from 'vue';

export default function useTheme() {
  const theme = ref('light');
  
  // Cargar tema desde localStorage si existe
  onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      theme.value = savedTheme;
      applyTheme(savedTheme);
    }
  });
  
  // Aplicar tema al DOM
  const applyTheme = (newTheme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };
  
  // Cambiar tema
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme.value);
    applyTheme(theme.value);
  };
  
  // Observar cambios en el tema
  watch(theme, (newTheme) => {
    applyTheme(newTheme);
  });
  
  return {
    theme,
    toggleTheme
  };
}