// src/mixins/barcodeScannerMixin.js
export default {
  data() {
    return {
      scanBuffer: "",
      lastTime: Date.now(),
    };
  },
  methods: {
    handleScan(e) {
      const now = Date.now();

      // Si pasa mucho entre teclas, se considera humano escribiendo
      if (now - this.lastTime > 100) {
        this.scanBuffer = "";
      }
      this.lastTime = now;

      if (e.key === "Enter") {
        if (this.scanBuffer.length > 4) {
          console.log("📌 Código escaneado:", this.scanBuffer);

          // 👉 redirigir con el serial
          this.$router.push({
            name: "RegistroUsuariosYaResg", 
            query: { serial: this.scanBuffer }
          });
        }
        this.scanBuffer = "";
      } else {
        this.scanBuffer += e.key;
      }
    },
  },
  mounted() {
    window.addEventListener("keydown", this.handleScan);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleScan);
  },
};
