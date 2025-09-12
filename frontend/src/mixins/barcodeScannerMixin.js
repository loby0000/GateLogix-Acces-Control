// src/mixins/barcodeScannerMixin.js
export default {
  data() {
    return {
      scannedInput: "",  // acumulador de caracteres del lector
      scanTimeout: null, // temporizador
    };
  },
  mounted() {
    window.addEventListener("keydown", this.captureScan);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.captureScan);
  },
  methods: {
 captureScan(e) {
  // Ignora si el usuario está escribiendo manualmente en un input/textarea
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  if (this.scanTimeout) clearTimeout(this.scanTimeout);

  // Solo letras y números desde el principio
  if (/^[a-zA-Z0-9]$/.test(e.key)) {
    this.scannedInput += e.key;
  }

  this.scanTimeout = setTimeout(() => {
    const code = this.scannedInput.trim();
    if (code.length > 4) {  // los códigos suelen ser largos
      console.log("📸 Escaneado limpio:", code);

      // Redirigir a la ruta con serial como query parameter
      this.$router.push({
        name: "RegistroUsuariosYaResg",
        query: { serial: code }
      });
    }
    this.scannedInput = "";
  }, 300);
}

  }
};
